# app/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from .auth import verify_password, get_password_hash, create_access_token, verify_token
from .database import (
    execute_query,
    get_table_names,
    get_table_info,
)

logger = logging.getLogger("sql_runner")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI(title="SQL Runner API", version="1.0.0")

# CORS - allow configuration via env if you want; kept simple for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# In-memory user database (demo)
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

# Per-user in-memory query history
query_history: Dict[str, List[Dict[str, Any]]] = {}


# Pydantic models
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
    # allow any shape for column metadata (name,type,notnull,default,primary_key)
    columns: List[Dict[str, Any]]
    sample_data: List[Dict[str, Any]]


class QueryHistoryItem(BaseModel):
    query: str
    timestamp: str
    success: bool
    error: Optional[str] = None


# Auth dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    username = verify_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username


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
    user = USERS_DB.get(request.username)
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # create token with subject (sub)
    access_token = create_access_token(data={"sub": request.username})

    # init history
    if request.username not in query_history:
        query_history[request.username] = []

    return LoginResponse(access_token=access_token, token_type="bearer", username=request.username)


@app.post("/query/execute", response_model=QueryResponse)
async def execute_sql_query(request: QueryRequest, current_user: str = Depends(get_current_user)):
    start_time = datetime.utcnow()
    try:
        result = execute_query(request.query)
        execution_time = (datetime.utcnow() - start_time).total_seconds()

        if isinstance(result, dict) and "error" in result:
            # failed query -> add to history
            query_history.setdefault(current_user, [])
            query_history[current_user].insert(0, {
                "query": request.query,
                "timestamp": datetime.utcnow().isoformat(),
                "success": False,
                "error": result["error"]
            })
            query_history[current_user] = query_history[current_user][:20]
            return QueryResponse(success=False, error=result["error"], execution_time=execution_time)

        columns = list(result[0].keys()) if result else []
        query_history.setdefault(current_user, [])
        query_history[current_user].insert(0, {
            "query": request.query,
            "timestamp": datetime.utcnow().isoformat(),
            "success": True,
            "rows_affected": len(result)
        })
        query_history[current_user] = query_history[current_user][:20]

        return QueryResponse(success=True, data=result, columns=columns, execution_time=execution_time)

    except Exception as e:
        logger.exception("Unexpected error executing query")
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        query_history.setdefault(current_user, [])
        query_history[current_user].insert(0, {
            "query": request.query,
            "timestamp": datetime.utcnow().isoformat(),
            "success": False,
            "error": str(e)
        })
        query_history[current_user] = query_history[current_user][:20]
        return QueryResponse(success=False, error=str(e), execution_time=execution_time)


@app.get("/tables", response_model=TableListResponse)
async def list_tables(current_user: str = Depends(get_current_user)):
    try:
        tables = get_table_names()
        return TableListResponse(tables=tables)
    except Exception as e:
        logger.exception("Error fetching table list")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/tables/{table_name}", response_model=TableInfoResponse)
async def get_table_details(table_name: str, current_user: str = Depends(get_current_user)):
    try:
        info = get_table_info(table_name)
        if isinstance(info, dict) and info.get("error"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=info["error"])
        return TableInfoResponse(columns=info["columns"], sample_data=info["sample_data"])
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching table info")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/query/history", response_model=List[QueryHistoryItem])
async def get_query_history(current_user: str = Depends(get_current_user)):
    return query_history.get(current_user, [])


@app.delete("/query/history")
async def clear_query_history(current_user: str = Depends(get_current_user)):
    query_history[current_user] = []
    return {"message": "Query history cleared successfully"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
