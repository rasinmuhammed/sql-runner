from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sqlite3
from datetime import datetime, timedelta
from .auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    verify_token
)
from .database import (
    get_db_connection, 
    close_db_connection,
    execute_query,
    get_table_names,
    get_table_info
)

app = FastAPI(title="SQL Runner API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# In-memory user database (for demo purposes)
USERS_DB = {
    "admin": {
        "username": "admin",
        "hashed_password": get_password_hash("admin123"),
        "full_name": "Admin User"
    },
    "demo": {
        "username": "demo",
        "hashed_password": get_password_hash("demo123"),
        "full_name": "Demo User"
    }
}

# In-memory query history (per user)
query_history: Dict[str, List[Dict[str, Any]]] = {}


# Pydantic Models
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str


class QueryRequest(BaseModel):
    query: str


class QueryResponse(BaseModel):
    success: bool
    data: Optional[List[Dict[str, Any]]] = None
    columns: Optional[List[str]] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None


class TableListResponse(BaseModel):
    tables: List[str]


class TableInfoResponse(BaseModel):
    columns: List[Dict[str, str]]
    sample_data: List[Dict[str, Any]]


class QueryHistoryItem(BaseModel):
    query: str
    timestamp: str
    success: bool
    error: Optional[str] = None


# Authentication Dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    token = credentials.credentials
    username = verify_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username


# Routes
@app.get("/")
async def root():
    return {
        "message": "SQL Runner API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/auth/login",
            "query": "/query/execute",
            "tables": "/tables",
            "table_info": "/tables/{table_name}",
            "history": "/query/history"
        }
    }


@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT token"""
    user = USERS_DB.get(request.username)
    
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": request.username})
    
    # Initialize query history for user
    if request.username not in query_history:
        query_history[request.username] = []
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        username=request.username
    )


@app.post("/query/execute", response_model=QueryResponse)
async def execute_sql_query(
    request: QueryRequest,
    current_user: str = Depends(get_current_user)
):
    """Execute SQL query and return results"""
    start_time = datetime.now()
    
    try:
        result = execute_query(request.query)
        execution_time = (datetime.now() - start_time).total_seconds()
        
        if isinstance(result, dict) and "error" in result:
            # Add to history as failed query
            query_history[current_user].insert(0, {
                "query": request.query,
                "timestamp": datetime.now().isoformat(),
                "success": False,
                "error": result["error"]
            })
            
            # Keep only last 20 queries
            query_history[current_user] = query_history[current_user][:20]
            
            return QueryResponse(
                success=False,
                error=result["error"],
                execution_time=execution_time
            )
        
        # Extract column names from first row
        columns = list(result[0].keys()) if result else []
        
        # Add to history as successful query
        query_history[current_user].insert(0, {
            "query": request.query,
            "timestamp": datetime.now().isoformat(),
            "success": True,
            "rows_affected": len(result)
        })
        
        # Keep only last 20 queries
        query_history[current_user] = query_history[current_user][:20]
        
        return QueryResponse(
            success=True,
            data=result,
            columns=columns,
            execution_time=execution_time
        )
        
    except Exception as e:
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Add to history as failed query
        query_history[current_user].insert(0, {
            "query": request.query,
            "timestamp": datetime.now().isoformat(),
            "success": False,
            "error": str(e)
        })
        
        query_history[current_user] = query_history[current_user][:20]
        
        return QueryResponse(
            success=False,
            error=str(e),
            execution_time=execution_time
        )


@app.get("/tables", response_model=TableListResponse)
async def list_tables(current_user: str = Depends(get_current_user)):
    """Get list of all available tables"""
    try:
        tables = get_table_names()
        return TableListResponse(tables=tables)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tables: {str(e)}"
        )


@app.get("/tables/{table_name}", response_model=TableInfoResponse)
async def get_table_details(
    table_name: str,
    current_user: str = Depends(get_current_user)
):
    """Get table schema and sample data"""
    try:
        info = get_table_info(table_name)
        
        if isinstance(info, dict) and "error" in info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=info["error"]
            )
        
        return TableInfoResponse(
            columns=info["columns"],
            sample_data=info["sample_data"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching table info: {str(e)}"
        )


@app.get("/query/history", response_model=List[QueryHistoryItem])
async def get_query_history(current_user: str = Depends(get_current_user)):
    """Get query history for current user"""
    return query_history.get(current_user, [])


@app.delete("/query/history")
async def clear_query_history(current_user: str = Depends(get_current_user)):
    """Clear query history for current user"""
    query_history[current_user] = []
    return {"message": "Query history cleared successfully"}


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}