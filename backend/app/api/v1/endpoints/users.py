from typing import List
import csv
import io
from transliterate import translit
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    User as UserSchema,
    UserCreate,
    UserUpdate,
    UserListItem,
    UserCSVImport,
)
from app.api.v1.deps import get_current_active_user, get_current_active_superuser
from app.core.constants import SEM_NEEDED, LEC_NEEDED, FAC_NEEDED
from app.core.security import get_password_hash

router = APIRouter()


@router.get("/", response_model=List[UserListItem])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve users. Staff can see all users, regular users can see only pioneers.
    """
    # Check if user has permission to view all users
    if current_user.is_staff or current_user.is_superuser:
        # Staff and admins can see all users
        users = db.query(User).offset(skip).limit(limit).all()
        return [prepare_user_list_item(user) for user in users]
    else:
        # Regular users (pioneers) can see only other pioneers (non-staff users)
        users = (
            db.query(User)
            .filter(User.is_staff == False, User.is_superuser == False)
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [prepare_user_list_item(user) for user in users]


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
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )

    # Create user object
    user = User(
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
    if (
        user.id != current_user.id
        and not current_user.is_staff
        and not current_user.is_superuser
    ):
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
    counters.append(
        CounterSchema(counter_name="lec", value=lec_value, max_value=LEC_NEEDED)
    )

    # Add seminar counter
    sem_value = user.get_counter(AttendanceTypeEnum.seminar_attend.value, db)
    counters.append(
        CounterSchema(counter_name="sem", value=sem_value, max_value=SEM_NEEDED)
    )

    # Add lab counter
    lab_value = user.get_counter(AttendanceTypeEnum.lab_pass.value, db)
    lab_max = user.lab_needed()  # From user's configuration
    counters.append(
        CounterSchema(counter_name="lab", value=lab_value, max_value=lab_max)
    )

    # Add faculty counter
    fac_value = user.get_counter(AttendanceTypeEnum.fac_attend.value, db)
    counters.append(
        CounterSchema(counter_name="fac", value=fac_value, max_value=FAC_NEEDED)
    )

    # Calculate expected penalty (if not staff)
    expected_penalty = 0
    if not user.is_staff and not user.is_superuser:
        expected_penalty = user.get_final_study_fine(db)

    # Create user dict
    user_dict = {
        "id": user.id,
        "username": user.username,
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
        "avatar": None,  # Add avatar implementation later
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
        balance=user.balance,
    )


def generate_username(
    last_name: str, first_name: str, middle_name: str = None, db: Session = None
) -> str:
    # приведение к нижнему регистру
    base = translit(last_name.strip().lower(), "ru", reversed=True)
    first_initial = translit(first_name.strip().lower()[0], "ru", reversed=True)
    middle_initial = translit(middle_name.strip().lower()[0] if middle_name else "", "ru", reversed=True)

    username = base
    candidate = username
    counter = 1

    # этапы расширения
    stages = [f"{base}.{first_initial}", f"{base}.{first_initial}.{middle_initial}"]

    # проверяем базовое имя
    if db.query(User).filter(User.username == candidate).first() is None:
        return candidate

    # проверяем с добавленными инициалами
    for stage in stages:
        if db.query(User).filter(User.username == stage).first() is None:
            return stage

    # если все занято, начинаем счет
    while True:
        candidate = f"{stages[-1]}{counter}"
        if db.query(User).filter(User.username == candidate).first() is None:
            return candidate
        counter += 1


@router.post("/import-csv")
def import_users_from_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Import users from CSV file. Only accessible to superusers.

    Expected CSV format:
    username,first_name,last_name,middle_name,party,grade,is_staff,is_superuser,bio,position

    If username is not provided, it will be generated from name parts.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    try:
        # Read CSV content
        content = file.file.read().decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(content))

        imported_users = []
        errors = []

        for row_num, row in enumerate(
            csv_reader, start=2
        ):  # Start from 2 because row 1 is header
            try:
                # Parse boolean fields
                is_staff = row.get("is_staff", "false").lower() in ("true", "1", "yes")
                is_superuser = row.get("is_superuser", "false").lower() in (
                    "true",
                    "1",
                    "yes",
                )

                # Parse integer fields
                party = int(row.get("party", 0)) if row.get("party") else 0
                grade = int(row.get("grade", 0)) if row.get("grade") else 0

                # Create user data
                user_data = UserCSVImport(
                    username=row.get("username"),
                    last_name=row["last_name"].strip(),
                    first_name=row["first_name"].strip(),
                    middle_name=row.get("middle_name", "").strip()
                    if row.get("middle_name")
                    else None,
                    party=party,
                    grade=grade,
                    is_staff=is_staff,
                    is_superuser=is_superuser,
                    bio=row.get("bio", "").strip() if row.get("bio") else None,
                    position=row.get("position", "").strip()
                    if row.get("position")
                    else None,
                )

                # Generate username if not provided
                if not user_data.username:
                    user_data.username = generate_username(
                        user_data.last_name,
                        user_data.first_name,
                        user_data.middle_name,
                        db,
                    )

                # Check if username already exists
                existing_user = (
                    db.query(User).filter(User.username == user_data.username).first()
                )
                if existing_user:
                    errors.append(
                        f"Row {row_num}: Username '{user_data.username}' already exists"
                    )
                    continue

                # Create user
                user = User(
                    username=user_data.username,
                    hashed_password=get_password_hash(
                        "r"
                    ),  # Default password
                    first_name=user_data.first_name,
                    last_name=user_data.last_name,
                    middle_name=user_data.middle_name,
                    party=user_data.party,
                    grade=user_data.grade,
                    is_staff=user_data.is_staff,
                    is_superuser=user_data.is_superuser,
                    bio=user_data.bio,
                    position=user_data.position,
                )

                db.add(user)
                imported_users.append(user_data.username)

            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue

        # Commit all changes
        db.commit()

        return {
            "message": f"Successfully imported {len(imported_users)} users",
            "imported_users": imported_users,
            "errors": errors,
            "total_rows_processed": len(csv_reader.fieldnames)
            + len(imported_users)
            + len(errors)
            - 1,
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing CSV file: {str(e)}"
        )
    finally:
        file.file.close() 