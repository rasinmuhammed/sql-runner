from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Model for user registration"""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username must be alphanumeric (can include _ and -)')
        return v.lower()

    @validator('full_name')
    def full_name_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip()


class UserLogin(BaseModel):
    """Model for user login"""
    username: str
    password: str


class User(BaseModel):
    """Model for user response"""
    user_id: int
    username: str
    email: str
    full_name: str
    created_at: str
    is_active: bool = True

    class Config:
        from_attributes = True
        