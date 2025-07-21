from typing import List
import csv
import io
from transliterate import translit
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
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
from app.core.media import upload_avatar, delete_avatar

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


@router.get("/{username}", response_model=UserSchema)
def read_user_by_username(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Only superusers/staff can access other users' profiles
    if (
        user.username != current_user.username
        and not current_user.is_staff
        and not current_user.is_superuser
    ):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )

    return prepare_user_schema(db, user)


@router.put("/{username}", response_model=UserSchema)
def update_user(
    *,
    db: Session = Depends(get_db),
    username: str,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a user.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Only superusers can update other users, and only superusers can promote to superusers
    if user.username != current_user.username and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    # Normal users can't change their admin status
    if not current_user.is_superuser and (
        user_in.is_superuser or user_in.is_staff
    ):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to change admin status",
        )

    # Update user
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)
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
    if user_in.bio is not None:
        user.bio = user_in.bio
    if user_in.position is not None:
        user.position = user_in.position
    if user_in.is_superuser is not None and current_user.is_superuser:
        user.is_superuser = user_in.is_superuser
    if user_in.is_staff is not None and current_user.is_superuser:
        user.is_staff = user_in.is_staff
    
    db.commit()
    db.refresh(user)
    return prepare_user_schema(db, user)


@router.patch("/{username}/avatar", response_model=UserSchema)
async def update_user_avatar(
    *,
    db: Session = Depends(get_db),
    username: str,
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    background_tasks: BackgroundTasks,
):
    """
    Update a user's avatar.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Only superusers can update other users
    if user.username != current_user.username and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )

    # Delete old avatar if exists
    if hasattr(user, 'avatar') and user.avatar:
        background_tasks.add_task(delete_avatar, user.avatar)

    # Upload new avatar
    avatar_name = await upload_avatar(avatar, user.username)
    
    # Update user avatar
    user.avatar = avatar_name
    db.commit()
    db.refresh(user)
    
    return prepare_user_schema(db, user)


@router.post("/admin/set-avatar/{target_username}", response_model=UserSchema)
async def admin_set_user_avatar(
    *,
    db: Session = Depends(get_db),
    target_username: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Administrator endpoint to set avatar for any user.
    Only accessible to superusers.
    """
    # Get target user by username
    user = db.query(User).filter(User.username == target_username).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    
    # Check file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image",
        )
    
    # Upload avatar using username
    await upload_avatar(file, target_username, background_tasks)
    
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
    last_name: str, first_name: str, middle_name: str|None = None, db: Session = None
) -> str:
    # приведение к нижнему регистру
    base = translit(last_name.strip().lower(), "ru", reversed=True).replace("`", "")
    first_initial = translit(first_name.strip().lower()[0], "ru", reversed=True).replace("`", "")
    middle_initial = translit(middle_name.strip().lower()[0] if middle_name else "", "ru", reversed=True).replace("`", "")

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


@router.post("/import-images", status_code=201)
async def import_users_from_images(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Import users from image files. Only accessible to superusers.
    The filename format should be:
    username,last_name,first_name,middle_name,party,grade,is_staff,is_superuser,bio,position.jpg
    
    Empty values can be represented by leaving the field blank (e.g., username,,first_name)
    """
    imported_users = []
    errors = []
    
    for file in files:
        try:
            # Ensure it's an image
            if not file.content_type.startswith("image/"):
                errors.append(f"File {file.filename}: Not an image")
                continue
                
            # Parse filename
            # Get base name without extension
            filename_parts = file.filename.rsplit('.', 1)[0].split(',')
            
            # Check if we have enough parts
            if len(filename_parts) < 3:  # Need at least username, last_name, first_name
                errors.append(f"File {file.filename}: Invalid format, needs at least username,last_name,first_name")
                continue
                
            # Extract data from filename
            user_data = {
                "username": filename_parts[0].strip() if filename_parts[0].strip() else None,
                "last_name": filename_parts[1].strip() if len(filename_parts) > 1 and filename_parts[1].strip() else "",
                "first_name": filename_parts[2].strip() if len(filename_parts) > 2 and filename_parts[2].strip() else "",
                "middle_name": filename_parts[3].strip() if len(filename_parts) > 3 and filename_parts[3].strip() else None,
                "party": int(filename_parts[4]) if len(filename_parts) > 4 and filename_parts[4].strip() else 0,
                "grade": int(filename_parts[5]) if len(filename_parts) > 5 and filename_parts[5].strip() else 0,
                "is_staff": filename_parts[6].lower() in ("true", "1", "yes") if len(filename_parts) > 6 and filename_parts[6].strip() else False,
                "is_superuser": filename_parts[7].lower() in ("true", "1", "yes") if len(filename_parts) > 7 and filename_parts[7].strip() else False,
                "bio": filename_parts[8].strip() if len(filename_parts) > 8 and filename_parts[8].strip() else None,
                "position": filename_parts[9].strip() if len(filename_parts) > 9 and filename_parts[9].strip() else None
            }
            
            # Generate username if not provided
            if not user_data["username"]:
                user_data["username"] = generate_username(
                    user_data["last_name"],
                    user_data["first_name"],
                    user_data["middle_name"],
                    db
                )
                
            # Check if user already exists
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if existing_user:
                errors.append(f"File {file.filename}: Username '{user_data['username']}' already exists")
                continue
                
            # Create user
            new_user = User(
                username=user_data["username"],
                hashed_password=get_password_hash("r"),  # Default password
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                middle_name=user_data["middle_name"],
                party=user_data["party"],
                grade=user_data["grade"],
                is_staff=user_data["is_staff"],
                is_superuser=user_data["is_superuser"],
                bio=user_data["bio"],
                position=user_data["position"]
            )
            
            db.add(new_user)
            db.flush()  # Get user ID without committing
            
            # Save and process avatar
            await upload_avatar(file, user_data["username"], background_tasks)
            
            imported_users.append(user_data["username"])
            
        except Exception as e:
            errors.append(f"File {file.filename}: {str(e)}")
            continue
    
    # Commit all changes
    try:
        db.commit()
        return {
            "message": f"Successfully imported {len(imported_users)} users with avatars",
            "imported_users": imported_users,
            "errors": errors,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error importing users: {str(e)}"
        ) 