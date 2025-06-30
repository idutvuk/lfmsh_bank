from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate, UserListItem
from app.api.v1.deps import get_current_active_user, get_current_active_superuser

router = APIRouter()


@router.get("/", response_model=List[UserListItem])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve users. Regular users can only access their own info and their party.
    """
    # Check if user has permission to view all users
    if current_user.is_staff or current_user.is_superuser:
        # Staff and admins can see all users
        users = db.query(User).offset(skip).limit(limit).all()
        return [prepare_user_list_item(user) for user in users]
    else:
        # Regular users can only see themselves and their party members
        # For MVP, we're restricting to only themselves
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to view user list"
        )


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
    from app.core.security import get_password_hash
    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        middle_name=user_in.middle_name,
        party=user_in.party,
        grade=user_in.grade,
        is_staff=user_in.is_staff,
        is_superuser=user_in.is_superuser,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return prepare_user_schema(db, user)


@router.get("/me", response_model=UserSchema)
def read_user_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user.
    """
    return prepare_user_schema(db, current_user)


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
    
    # Only superusers/staff can access other users' profiles
    if user.id != current_user.id and not current_user.is_staff and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    
    return prepare_user_schema(db, user)


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
    if user_in.is_staff is not None:
        user.is_staff = user_in.is_staff
    if user_in.is_superuser is not None:
        user.is_superuser = user_in.is_superuser
    if user_in.first_name:
        user.first_name = user_in.first_name
    if user_in.last_name:
        user.last_name = user_in.last_name
    if user_in.middle_name:
        user.middle_name = user_in.middle_name
    if user_in.party is not None:
        user.party = user_in.party
    if user_in.grade is not None:
        user.grade = user_in.grade
    if user_in.password:
        from app.core.security import get_password_hash
        user.hashed_password = get_password_hash(user_in.password)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return prepare_user_schema(db, user)


def prepare_user_schema(db: Session, user: User) -> UserSchema:
    """
    Prepare user data for schema serialization,
    adding calculated fields like expected_penalty and counters
    """
    from app.schemas.user import CounterSchema
    from app.core.constants import AttendanceTypeEnum
    
    # Calculate counters
    counters = []
    
    # Add lecture counter
    lec_value = user.get_counter(AttendanceTypeEnum.lecture_attend.value, db)
    lec_max = 8  # This should come from settings
    counters.append(CounterSchema(counter_name="lec", value=lec_value, max_value=lec_max))
    
    # Add seminar counter
    sem_value = user.get_counter(AttendanceTypeEnum.seminar_attend.value, db)
    sem_max = 5  # This should come from settings
    counters.append(CounterSchema(counter_name="sem", value=sem_value, max_value=sem_max))
    
    # Add lab counter
    lab_value = user.get_counter(AttendanceTypeEnum.lab_pass.value, db)
    lab_max = user.lab_needed()  # From user's configuration
    counters.append(CounterSchema(counter_name="lab", value=lab_value, max_value=lab_max))
    
    # Add faculty counter
    fac_value = user.get_counter(AttendanceTypeEnum.fac_attend.value, db)
    fac_max = 4  # This should come from settings
    counters.append(CounterSchema(counter_name="fac", value=fac_value, max_value=fac_max))
    
    # Calculate expected penalty (if not staff)
    expected_penalty = 0
    if not user.is_staff and not user.is_superuser:
        expected_penalty = user.get_final_study_fine(db)
    
    # Create user dict
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "middle_name": user.middle_name,
        "party": user.party,
        "grade": user.grade,
        "balance": user.balance,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "name": user.long_name(),
        "staff": user.is_staff,
        "expected_penalty": expected_penalty,
        "counters": counters,
        "avatar": None  # Add avatar implementation later
    }
    
    return UserSchema(**user_dict)


def prepare_user_list_item(user: User) -> UserListItem:
    """
    Prepare user data for list item serialization
    """
    return UserListItem(
        id=user.id,
        username=user.username,
        name=user.long_name(),
        party=user.party,
        staff=user.is_staff,
        balance=user.balance
    ) 