"""
Pydantic models for SQL Runner API

This module contains all request and response models used throughout the API.
Organized by functionality: Authentication, Query Execution, and Table Management.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============================================================================
# AUTHENTICATION MODELS
# ============================================================================

class UserCreate(BaseModel):
    """
    Model for user registration
    
    Validates username format (alphanumeric with _ and -) and ensures
    full name is not empty. Email is optional.
    """
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")
    full_name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    email: Optional[EmailStr] = Field(None, description="Optional email address")

    @field_validator('username')
    def username_alphanumeric(cls, v):
        """Validate username is alphanumeric (allows _ and -)"""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username must be alphanumeric (can include _ and -)')
        return v.lower()

    @field_validator('full_name')
    def full_name_not_empty(cls, v):
        """Ensure full name is not just whitespace"""
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip()

    model_config = {
        "json_schema_extra" : {
            "example": {
                "username": "john_doe",
                "password": "secure123",
                "full_name": "John Doe",
                "email": "john@example.com"
            }
        }
    }


class UserLogin(BaseModel):
    """
    Model for user login
    
    Simple username and password combination for authentication.
    """
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")

    model_config = {
        "json_schema_extra" : {
            "example": {
                "username": "admin",
                "password": "admin123"
            }
        }
   }


class User(BaseModel):
    """
    Model for user response
    
    Represents user data returned after successful operations.
    Excludes sensitive information like password hash.
    """
    user_id: int = Field(..., description="Unique user identifier")
    username: str = Field(..., description="Username")
    email: Optional[str] = Field(..., description="Email address")
    full_name: str = Field(..., description="User's full name")
    created_at: datetime = Field(..., description="Account creation timestamp (ISO format)")
    is_active: bool = Field(True, description="Whether account is active")

    model_config = {
        "from_attributes" : True,
        "json_schema_extra" : {
            "example": {
                "user_id": 1,
                "username": "john_doe",
                "email": "john@example.com",
                "full_name": "John Doe",
                "created_at": "2025-10-24T12:00:00",
                "is_active": True
            }
        }
    }


class LoginResponse(BaseModel):
    """
    Response model for successful login
    
    Returns JWT access token along with user information.
    """
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(..., description="Token type (always 'bearer')")
    username: str = Field(..., description="Logged in username")
    full_name: str = Field(..., description="User's full name")

    model_config = {
        "json_schema_extra" : {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "username": "john_doe",
                "full_name": "John Doe"
            }
        }
    }


class SignupResponse(BaseModel):
    """
    Response model for successful user registration
    
    Returns success message and created user data.
    """
    message: str = Field(..., description="Success message")
    user: User = Field(..., description="Created user data")

    model_config = {
        "json_schema_extra" : {
            "example": {
                "message": "User registered successfully",
                "user": {
                    "user_id": 2,
                    "username": "john_doe",
                    "email": "john@example.com",
                    "full_name": "John Doe",
                    "created_at": "2025-10-24T12:00:00",
                    "is_active": True
                }
            }
        }
    }


# ============================================================================
# QUERY EXECUTION MODELS
# ============================================================================

class QueryRequest(BaseModel):
    """
    Request model for SQL query execution
    
    Accepts any valid SQL query string.
    """
    query: str = Field(..., min_length=1, description="SQL query to execute")

    @field_validator('query')
    def query_not_empty(cls, v):
        """Ensure query is not just whitespace"""
        if not v.strip():
            raise ValueError('Query cannot be empty')
        return v.strip()

    model_config = {
        "json_schema_extra" : {
            "example": {
                "query": "SELECT * FROM Customers WHERE age > 25;"
            }
        }
    }


class QueryResponse(BaseModel):
    """
    Response model for query execution
    
    Returns execution results or error information along with execution time.
    """
    success: bool = Field(..., description="Whether query executed successfully")
    data: Optional[List[Dict[str, Any]]] = Field(None, description="Query result rows (for SELECT)")
    columns: Optional[List[str]] = Field(None, description="Column names in result")
    error: Optional[str] = Field(None, description="Error message if query failed")
    execution_time: Optional[float] = Field(None, description="Query execution time in seconds")

    model_config = {
        "json_schema_extra" : {
            "example": {
                "success": True,
                "data": [
                    {
                        "customer_id": 1,
                        "first_name": "John",
                        "last_name": "Doe",
                        "age": 31,
                        "country": "USA"
                    }
                ],
                "columns": ["customer_id", "first_name", "last_name", "age", "country"],
                "execution_time": 0.0023
            }
        }
    }


class QueryHistoryItem(BaseModel):
    """
    Model for a single query history entry
    
    Represents a past query execution with its metadata.
    """
    query: str = Field(..., description="SQL query that was executed")
    timestamp: str = Field(..., description="Execution timestamp (ISO format)")
    success: bool = Field(..., description="Whether query succeeded")
    error: Optional[str] = Field(None, description="Error message if query failed")
    rows_affected: Optional[int] = Field(None, description="Number of rows affected")

    model_config = {
        "json_schema_extra" : {
            "example": {
                "query": "SELECT * FROM Customers;",
                "timestamp": "2025-10-24T12:30:00",
                "success": True,
                "error": None,
                "rows_affected": 5
            }
        }
    }


# ============================================================================
# TABLE MANAGEMENT MODELS
# ============================================================================

class TableListResponse(BaseModel):
    """
    Response model for table list
    
    Returns list of available database tables.
    """
    tables: List[str] = Field(..., description="List of table names")

    model_config = {
        "json_schema_extra" : {
            "example": {
                "tables": ["Customers", "Orders", "Shippings"]
            }
        }
    }


class ColumnInfo(BaseModel):
    """
    Model for database column information
    
    Represents schema details for a single column.
    """
    name: str = Field(..., description="Column name")
    type: str = Field(..., description="Column data type")
    notnull: bool = Field(..., description="Whether column has NOT NULL constraint")
    default_value: Optional[Any] = Field(None, description="Default value if any")
    primary_key: bool = Field(..., description="Whether column is primary key")

    model_config = {
        "json_schema_extra" : {
            "example": {
                "name": "customer_id",
                "type": "INTEGER",
                "notnull": False,
                "default_value": None,
                "primary_key": True
            }
        }
    }


class TableInfoResponse(BaseModel):
    """
    Response model for table information
    
    Returns table schema and sample data rows.
    """
    columns: List[ColumnInfo] = Field(..., description="Column schema information")
    sample_data: List[Dict[str, Any]] = Field(..., description="Sample data rows (up to 5)")

    model_config = {
        "json_schema_extra" : {
            "example": {
                "columns": [
                    {
                        "name": "customer_id",
                        "type": "INTEGER",
                        "notnull": False,
                        "default_value": None,
                        "primary_key": True
                    },
                    {
                        "name": "first_name",
                        "type": "VARCHAR(100)",
                        "notnull": False,
                        "default_value": None,
                        "primary_key": False
                    }
                ],
                "sample_data": [
                    {
                        "customer_id": 1,
                        "first_name": "John",
                        "last_name": "Doe",
                        "age": 31,
                        "country": "USA"
                    }
                ]
            }
        }
    }


# ============================================================================
# HEALTH CHECK MODEL
# ============================================================================

class HealthResponse(BaseModel):
    """
    Response model for health check
    
    Returns API health status and version information.
    """
    status: str = Field(..., description="Health status")
    timestamp: str = Field(..., description="Current server timestamp (ISO format)")
    version: str = Field(..., description="API version")

    model_config = {
        "json_schema_extra" : {
            "example": {
                "status": "healthy",
                "timestamp": "2025-10-24T12:00:00",
                "version": "1.0.0"
            }
        }
    }


# ============================================================================
# ERROR RESPONSE MODEL
# ============================================================================

class ErrorResponse(BaseModel):
    """
    Standard error response model
    
    Used for consistent error messaging across all endpoints.
    """
    detail: str = Field(..., description="Error message")
    status_code: int = Field(..., description="HTTP status code")

    model_config = {
        "json_schema_extra" : {
            "example": {
                "detail": "Invalid or expired token",
                "status_code": 401
            }
        }
    }