from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from .auth import verify_password, get_password_hash, create_access_token, verify_token
from .database import (
    execute_query,
    get_table_names,
    get_table_info,
    create_user,
    get_user_by_username,
    get_user_by_email,
)
from .models import UserCreate, UserLogin, User

logger = logging.getLogger("sql_runner")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI(
    title="SQL Runner API",
    version="1.0.0",
    description="A powerful SQL query execution platform with user authentication"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Per-user in-memory query history
query_history: Dict[str, List[Dict[str, Any]]] = {}


# Pydantic response models
from pydantic import BaseModel


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    full_name: str


class SignupResponse(BaseModel):
    message: str
    user: User


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
    columns: List[Dict[str, Any]]
    sample_data: List[Dict[str, Any]]


class QueryHistoryItem(BaseModel):
    query: str
    timestamp: str
    success: bool
    error: Optional[str] = None
    rows_affected: Optional[int] = None


# Auth dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and return username"""
    token = credentials.credentials
    username = verify_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify user exists in database
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return username


# Root endpoint
@app.get("/")
async def root():
    """API root endpoint with available endpoints"""
    return {
        "message": "SQL Runner API",
        "version": "1.0.0",
        "description": "Execute SQL queries with authentication",
        "endpoints": {
            "auth": {
                "login": "POST /auth/login",
                "signup": "POST /auth/signup"
            },
            "query": {
                "execute": "POST /query/execute",
                "history": "GET /query/history",
                "clear_history": "DELETE /query/history"
            },
            "tables": {
                "list": "GET /tables",
                "info": "GET /tables/{table_name}"
            },
            "health": "GET /health"
        },
        "docs": "/docs"
    }


# Authentication endpoints
@app.post("/auth/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate):
    """
    Register a new user
    
    - **username**: Unique username (3-50 characters)
    - **password**: Password (minimum 6 characters)
    - **full_name**: User's full name
    - **email**: Optional email address
    """
    # Check if username already exists
    existing_user = get_user_by_username(user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists (if provided)
    if user_data.email:
        existing_email = get_user_by_email(user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user in database
    user = create_user(
        username=user_data.username,
        email=user_data.email or "",
        full_name=user_data.full_name,
        hashed_password=hashed_password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # Initialize query history for new user
    query_history[user_data.username] = []
    
    logger.info(f"New user registered: {user_data.username}")
    
    return SignupResponse(
        message="User registered successfully",
        user=User(**user)
    )


@app.post("/auth/login", response_model=LoginResponse)
async def login(request: UserLogin):
    """
    Authenticate user and return access token
    
    - **username**: User's username
    - **password**: User's password
    """
    # Get user from database
    user = get_user_by_username(request.username)
    
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": request.username})
    
    # Initialize query history if not exists
    if request.username not in query_history:
        query_history[request.username] = []
    
    logger.info(f"User logged in: {request.username}")
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        username=request.username,
        full_name=user["full_name"]
    )


# Query execution endpoints
@app.post("/query/execute", response_model=QueryResponse)
async def execute_sql_query(request: QueryRequest, current_user: str = Depends(get_current_user)):
    """
    Execute an SQL query
    
    - **query**: SQL query string to execute
    
    Supports SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, DROP TABLE, etc.
    """
    start_time = datetime.utcnow()
    
    try:
        result = execute_query(request.query)
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Handle error results
        if isinstance(result, dict) and "error" in result:
            # Add failed query to history
            query_history.setdefault(current_user, [])
            query_history[current_user].insert(0, {
                "query": request.query,
                "timestamp": datetime.utcnow().isoformat(),
                "success": False,
                "error": result["error"]
            })
            # Keep only last 50 queries
            query_history[current_user] = query_history[current_user][:50]
            
            return QueryResponse(
                success=False,
                error=result["error"],
                execution_time=execution_time
            )
        
        # Handle successful results
        columns = list(result[0].keys()) if result else []
        
        # Add successful query to history
        query_history.setdefault(current_user, [])
        query_history[current_user].insert(0, {
            "query": request.query,
            "timestamp": datetime.utcnow().isoformat(),
            "success": True,
            "rows_affected": len(result)
        })
        query_history[current_user] = query_history[current_user][:50]
        
        return QueryResponse(
            success=True,
            data=result,
            columns=columns,
            execution_time=execution_time
        )
        
    except Exception as e:
        logger.exception("Unexpected error executing query")
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Add error to history
        query_history.setdefault(current_user, [])
        query_history[current_user].insert(0, {
            "query": request.query,
            "timestamp": datetime.utcnow().isoformat(),
            "success": False,
            "error": str(e)
        })
        query_history[current_user] = query_history[current_user][:50]
        
        return QueryResponse(
            success=False,
            error=str(e),
            execution_time=execution_time
        )


@app.get("/query/history", response_model=List[QueryHistoryItem])
async def get_query_history_endpoint(current_user: str = Depends(get_current_user)):
    """
    Get query history for the current user
    
    Returns the last 50 queries executed by the user.
    """
    return query_history.get(current_user, [])


@app.delete("/query/history")
async def clear_query_history_endpoint(current_user: str = Depends(get_current_user)):
    """
    Clear query history for the current user
    """
    query_history[current_user] = []
    return {"message": "Query history cleared successfully"}


# Table management endpoints
@app.get("/tables", response_model=TableListResponse)
async def list_tables(current_user: str = Depends(get_current_user)):
    """
    Get list of all available database tables
    
    Returns list of table names excluding system tables and user table.
    """
    try:
        tables = get_table_names()
        return TableListResponse(tables=tables)
    except Exception as e:
        logger.exception("Error fetching table list")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/tables/{table_name}", response_model=TableInfoResponse)
async def get_table_details(table_name: str, current_user: str = Depends(get_current_user)):
    """
    Get detailed information about a specific table
    
    - **table_name**: Name of the table
    
    Returns schema (columns and data types) and sample data (first 5 rows).
    """
    try:
        info = get_table_info(table_name)
        
        if isinstance(info, dict) and info.get("error"):
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
        logger.exception("Error fetching table info")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint
    
    Returns the current status and timestamp of the API.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


# User info endpoint
@app.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    """
    Get current user information
    """
    user = get_user_by_username(current_user)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(
        user_id=user["user_id"],
        username=user["username"],
        email=user.get("email", ""),
        full_name=user["full_name"],
        created_at=user["created_at"],
        is_active=user["is_active"]
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)