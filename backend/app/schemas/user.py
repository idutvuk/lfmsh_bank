from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class CounterSchema(BaseModel):
    """Schema for user counters"""
    counter_name: str
    value: int
    max_value: int


# Shared properties
class UserBase(BaseModel):
    username: str
    is_active: Optional[bool] = True


# Properties to receive on user creation
class UserCreate(UserBase):
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    party: Optional[int] = 0
    grade: Optional[int] = 0
    is_staff: bool = False
    is_superuser: bool = False


# Properties to receive on user update
class UserUpdate(UserBase):
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    party: Optional[int] = None
    grade: Optional[int] = None
    is_staff: Optional[bool] = None
    is_superuser: Optional[bool] = None


# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    party: int = 0
    grade: int = 0
    is_staff: bool = False
    is_superuser: bool = False
    balance: float = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Properties to return to client
class User(UserInDBBase):
    name: Optional[str] = None
    staff: bool = False
    expected_penalty: float = 0
    counters: List[CounterSchema] = []
    avatar: Optional[str] = None

    class Config:
        from_attributes = True


# Properties for user list
class UserListItem(BaseModel):
    id: int
    username: str
    name: str
    party: int
    staff: bool
    balance: float

    model_config = ConfigDict(from_attributes=True)


# Properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str 