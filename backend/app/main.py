"""
SQL Runner API - Main Application

FastAPI application for executing SQL queries with user authentication.
Provides endpoints for user management, query execution, and database exploration.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from datetime import datetime
import logging

# Import authentication utilities
from .auth import verify_password, get_password_hash, create_access_token, verify_token

# Import database operations
from .database import (
    execute_query,
    get_table_names,
    get_table_info,
    create_user,
    get_user_by_username,
    get_user_by_email,
    save_query_history,
    get_query_history,
    clear_query_history,
)

# Import all Pydantic models
from .models import (
    # Authentication models
    UserCreate,
    UserLogin,
    User,
    LoginResponse,
    SignupResponse,
    # Query execution models
    QueryRequest,
    QueryResponse,
    QueryHistoryItem,
    # Table management models
    TableListResponse,
    TableInfoResponse,
    ColumnInfo,
    # Health check model
    HealthResponse,
)

# Configure logging
logger = logging.getLogger("sql_runner")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Initialize FastAPI application
app = FastAPI(
    title="SQL Runner API",
    version="1.0.0",
    description="A powerful SQL query execution platform with user authentication",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "authentication",
            "description": "User authentication and registration"
        },
        {
            "name": "queries",
            "description": "SQL query execution and history"
        },
        {
            "name": "tables",
            "description": "Database table information"
        },
        {
            "name": "health",
            "description": "API health check"
        }
    ]
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

# Security scheme for JWT authentication
security = HTTPBearer()


# ============================================================================
# AUTHENTICATION DEPENDENCY
# ============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Dependency to verify JWT token and return username
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        str: Username of authenticated user
        
    Raises:
        HTTPException: If token is invalid, expired, or user not found
    """
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


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get(
    "/",
    tags=["health"],
    summary="API Root",
    description="Returns API information and available endpoints"
)
async def root():
    """
    API root endpoint with available endpoints
    
    Provides overview of all available API routes and documentation links.
    """
    return {
        "message": "SQL Runner API",
        "version": "1.0.0",
        "description": "Execute SQL queries with authentication",
        "endpoints": {
            "auth": {
                "login": "POST /auth/login",
                "signup": "POST /auth/signup",
                "me": "GET /auth/me"
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
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post(
    "/auth/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["authentication"],
    summary="Register New User",
    description="Create a new user account with username, password, and full name"
)
async def signup(user_data: UserCreate):
    """
    Register a new user
    
    Creates a new user account with the provided credentials. Username must be unique,
    and email (if provided) must also be unique. Password is hashed using bcrypt.
    
    Args:
        user_data: User registration data (username, password, full_name, email)
        
    Returns:
        SignupResponse: Success message and created user data
        
    Raises:
        HTTPException 400: If username or email already exists
        HTTPException 500: If user creation fails
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
    
    logger.info(f"New user registered: {user_data.username}")
    
    return SignupResponse(
        message="User registered successfully",
        user=User(**user)
    )


@app.post(
    "/auth/login",
    response_model=LoginResponse,
    tags=["authentication"],
    summary="User Login",
    description="Authenticate user and receive JWT access token"
)
async def login(request: UserLogin):
    """
    Authenticate user and return access token
    
    Validates username and password, then returns a JWT token for authentication.
    Token expires after 8 hours.
    
    Args:
        request: Login credentials (username, password)
        
    Returns:
        LoginResponse: JWT token and user information
        
    Raises:
        HTTPException 401: If username or password is incorrect
        HTTPException 403: If user account is inactive
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
    
    logger.info(f"User logged in: {request.username}")
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        username=request.username,
        full_name=user["full_name"]
    )


@app.get(
    "/auth/me",
    response_model=User,
    tags=["authentication"],
    summary="Get Current User",
    description="Retrieve information about the currently authenticated user"
)
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    """
    Get current user information
    
    Returns profile information for the authenticated user.
    
    Args:
        current_user: Username from JWT token (injected by dependency)
        
    Returns:
        User: Current user's profile data
        
    Raises:
        HTTPException 404: If user not found
        HTTPException 401: If authentication fails
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


# ============================================================================
# QUERY EXECUTION ENDPOINTS
# ============================================================================

@app.post(
    "/query/execute",
    response_model=QueryResponse,
    tags=["queries"],
    summary="Execute SQL Query",
    description="Execute any SQL query (SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, etc.)"
)
async def execute_sql_query(
    request: QueryRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Execute an SQL query
    
    Supports all SQL operations including SELECT, INSERT, UPDATE, DELETE,
    CREATE TABLE, DROP TABLE, ALTER TABLE, etc. Query history is automatically
    saved for the authenticated user.
    
    Args:
        request: Query request containing SQL string
        current_user: Username from JWT token (injected by dependency)
        
    Returns:
        QueryResponse: Query results or error message with execution time
    """
    start_time = datetime.utcnow()
    
    try:
        result = execute_query(request.query)
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Handle error results
        if isinstance(result, dict) and "error" in result:
            # Save failed query to database
            save_query_history(
                username=current_user,
                query=request.query,
                success=False,
                error=result["error"]
            )
            
            return QueryResponse(
                success=False,
                error=result["error"],
                execution_time=execution_time
            )
        
        # Handle successful results
        columns = list(result[0].keys()) if result else []
        rows_affected = len(result)
        
        # Save successful query to database
        save_query_history(
            username=current_user,
            query=request.query,
            success=True,
            rows_affected=rows_affected
        )
        
        return QueryResponse(
            success=True,
            data=result,
            columns=columns,
            execution_time=execution_time
        )
        
    except Exception as e:
        logger.exception("Unexpected error executing query")
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Save error to database
        save_query_history(
            username=current_user,
            query=request.query,
            success=False,
            error=str(e)
        )
        
        return QueryResponse(
            success=False,
            error=str(e),
            execution_time=execution_time
        )


@app.get(
    "/query/history",
    response_model=List[QueryHistoryItem],
    tags=["queries"],
    summary="Get Query History",
    description="Retrieve query execution history for the current user"
)
async def get_query_history_endpoint(current_user: str = Depends(get_current_user)):
    """
    Get query history for the current user
    
    Returns the last 50 queries executed by the authenticated user,
    including success/failure status and execution details.
    
    Args:
        current_user: Username from JWT token (injected by dependency)
        
    Returns:
        List[QueryHistoryItem]: List of past query executions
    """
    history = get_query_history(current_user, limit=50)
    return history


@app.delete(
    "/query/history",
    tags=["queries"],
    summary="Clear Query History",
    description="Delete all query history for the current user"
)
async def clear_query_history_endpoint(current_user: str = Depends(get_current_user)):
    """
    Clear query history for the current user
    
    Permanently deletes all query history records for the authenticated user.
    This action cannot be undone.
    
    Args:
        current_user: Username from JWT token (injected by dependency)
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException 500: If history clearing fails
    """
    success = clear_query_history(current_user)
    
    if success:
        return {"message": "Query history cleared successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear query history"
        )


# ============================================================================
# TABLE MANAGEMENT ENDPOINTS
# ============================================================================

@app.get(
    "/tables",
    response_model=TableListResponse,
    tags=["tables"],
    summary="List All Tables",
    description="Get list of all available database tables"
)
async def list_tables(current_user: str = Depends(get_current_user)):
    """
    Get list of all available database tables
    
    Returns names of all tables in the database, excluding system tables
    (users, query_history, and SQLite internal tables).
    
    Args:
        current_user: Username from JWT token (injected by dependency)
        
    Returns:
        TableListResponse: List of table names
        
    Raises:
        HTTPException 500: If table list retrieval fails
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


@app.get(
    "/tables/{table_name}",
    response_model=TableInfoResponse,
    tags=["tables"],
    summary="Get Table Information",
    description="Get detailed schema and sample data for a specific table"
)
async def get_table_details(
    table_name: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get detailed information about a specific table
    
    Returns table schema (column names, types, constraints) and
    sample data (first 5 rows) for the specified table.
    
    Args:
        table_name: Name of the table to query
        current_user: Username from JWT token (injected by dependency)
        
    Returns:
        TableInfoResponse: Table schema and sample data
        
    Raises:
        HTTPException 400: If table doesn't exist
        HTTPException 500: If table info retrieval fails
    """
    try:
        info = get_table_info(table_name)
        
        if isinstance(info, dict) and info.get("error"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=info["error"]
            )
        
        # Convert column dicts to ColumnInfo models for better typing
        from .models import ColumnInfo
        columns = [ColumnInfo(**col) for col in info["columns"]]
        
        return TableInfoResponse(
            columns=columns,
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


# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["health"],
    summary="Health Check",
    description="Check if the API is running and healthy"
)
async def health_check():
    """
    Health check endpoint
    
    Returns the current status and timestamp of the API.
    Useful for monitoring and load balancer health checks.
    
    Returns:
        HealthResponse: API health status and version
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )


# ============================================================================
# APPLICATION STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )