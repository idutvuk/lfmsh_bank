from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.api.v1.deps import get_current_active_user, get_current_active_superuser

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Retrieve users. Only accessible to superusers.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=UserSchema)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Create new user. Only accessible to superusers.
    """
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    
    # Create user object
    from passlib.hash import bcrypt
    hashed_password = bcrypt.hash(user_in.password)
    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hashed_password,
        first_name=user_in.full_name.split()[1] if user_in.full_name and len(user_in.full_name.split()) > 1 else "",
        last_name=user_in.full_name.split()[0] if user_in.full_name else "",
        is_superuser=user_in.is_superuser,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user.
    """
    return current_user


@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """
    Update own user.
    """
    # Only update allowed fields
    if user_in.email:
        current_user.email = user_in.email
    
    if user_in.full_name:
        parts = user_in.full_name.split()
        if len(parts) > 0:
            current_user.last_name = parts[0]
            if len(parts) > 1:
                current_user.first_name = parts[1]
    
    if user_in.password:
        from passlib.hash import bcrypt
        hashed_password = bcrypt.hash(user_in.password)
        current_user.hashed_password = hashed_password
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.get("/{user_id}", response_model=UserSchema)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a specific user by id.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    
    # Only superusers can access other users' profiles
    if user.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    
    return user


@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Update a user. Only accessible to superusers.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    
    # Update user fields
    if user_in.username:
        user.username = user_in.username
    if user_in.email:
        user.email = user_in.email
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.is_superuser is not None:
        user.is_superuser = user_in.is_superuser
    if user_in.full_name:
        parts = user_in.full_name.split()
        if len(parts) > 0:
            user.last_name = parts[0]
            if len(parts) > 1:
                user.first_name = parts[1]
    if user_in.password:
        from passlib.hash import bcrypt
        hashed_password = bcrypt.hash(user_in.password)
        user.hashed_password = hashed_password
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user 