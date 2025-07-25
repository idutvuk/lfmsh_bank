from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, get_current_active_user, get_current_active_superuser
from app.models.badge import Badge
from app.models.user import User
from app.schemas.badge import BadgeCreate, BadgeUpdate
from app.core.media import upload_badge, delete_badge

router = APIRouter()


@router.get("/", response_model=List[dict])
def get_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Получить список всех активных плашек
    """
    badges = db.query(Badge).filter(Badge.is_active == True).all()
    return [badge.full_info_as_dict() for badge in badges]


@router.get("/{badge_id}", response_model=dict)
def get_badge(
    badge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Получить информацию о конкретной плашке
    """
    badge = db.query(Badge).filter(Badge.id == badge_id, Badge.is_active == True).first()
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Плашка не найдена"
        )
    return badge.full_info_as_dict()


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_badge(
    badge_data: BadgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Создать новую плашку (только для админов)
    """
    # Проверяем, что плашка с таким именем не существует
    existing_badge = db.query(Badge).filter(Badge.name == badge_data.name).first()
    if existing_badge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Плашка с таким именем уже существует"
        )
    
    # Создаем новую плашку
    new_badge = Badge(
        name=badge_data.name,
        description=badge_data.description,
        image_filename=badge_data.image_filename,
        is_active=True
    )
    
    db.add(new_badge)
    db.commit()
    db.refresh(new_badge)
    
    return new_badge.full_info_as_dict()


@router.put("/{badge_id}", response_model=dict)
def update_badge(
    badge_id: int,
    badge_data: BadgeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Обновить плашку (только для админов)
    """
    badge = db.query(Badge).filter(Badge.id == badge_id).first()
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Плашка не найдена"
        )
    
    # Проверяем уникальность имени, если оно изменяется
    if badge_data.name and badge_data.name != badge.name:
        existing_badge = db.query(Badge).filter(Badge.name == badge_data.name).first()
        if existing_badge:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Плашка с таким именем уже существует"
            )
    
    # Обновляем поля
    if badge_data.name is not None:
        badge.name = badge_data.name
    if badge_data.description is not None:
        badge.description = badge_data.description
    if badge_data.image_filename is not None:
        badge.image_filename = badge_data.image_filename
    if badge_data.is_active is not None:
        badge.is_active = badge_data.is_active
    
    db.commit()
    db.refresh(badge)
    
    return badge.full_info_as_dict()


@router.delete("/{badge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_badge(
    badge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Удалить плашку (только для админов)
    """
    badge = db.query(Badge).filter(Badge.id == badge_id).first()
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Плашка не найдена"
        )
    
    # Убираем плашку у всех пользователей перед удалением
    users_with_badge = db.query(User).filter(User.badge_id == badge_id).all()
    for user in users_with_badge:
        user.badge_id = None
    
    # Удаляем файлы изображений
    if badge.image_filename:
        delete_badge(badge_id)
    
    db.delete(badge)
    db.commit()


@router.get("/all", response_model=List[dict])
def get_all_badges_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Получить все плашки, включая неактивные (только для админов)
    """
    badges = db.query(Badge).all()
    return [badge.full_info_as_dict() for badge in badges]


@router.patch("/{badge_id}/assign/{user_id}", response_model=dict)
def assign_badge_to_user(
    badge_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Назначить плашку пользователю (только для админов)
    """
    badge = db.query(Badge).filter(Badge.id == badge_id, Badge.is_active == True).first()
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Активная плашка не найдена"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    user.badge_id = badge_id
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"Плашка '{badge.name}' назначена пользователю {user.username}",
        "user_id": user.id,
        "badge_id": badge.id
    }


@router.patch("/unassign/{user_id}", response_model=dict)
def unassign_badge_from_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Убрать плашку у пользователя (только для админов)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    if not user.badge_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="У пользователя нет плашки"
        )
    
    user.badge_id = None
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"Плашка убрана у пользователя {user.username}",
        "user_id": user.id
    }


@router.post("/{badge_id}/upload-image", response_model=dict)
async def upload_badge_image(
    badge_id: int,
    image: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Загрузить изображение для плашки (только для админов)
    """
    badge = db.query(Badge).filter(Badge.id == badge_id).first()
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Плашка не найдена"
        )
    
    # Проверяем тип файла
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть изображением"
        )
    
    # Удаляем старое изображение если есть
    if badge.image_filename:
        delete_badge(badge_id)
    
    # Загружаем новое изображение
    filename = await upload_badge(image, badge_id, background_tasks)
    
    # Обновляем запись в базе
    badge.image_filename = filename
    db.commit()
    db.refresh(badge)
    
    return {
        "message": "Изображение плашки загружено",
        "badge_id": badge_id,
        "filename": filename
    }


@router.delete("/{badge_id}/image", response_model=dict)
def delete_badge_image(
    badge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Удалить изображение плашки (только для админов)
    """
    badge = db.query(Badge).filter(Badge.id == badge_id).first()
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Плашка не найдена"
        )
    
    if not badge.image_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="У плашки нет изображения"
        )
    
    # Удаляем файлы изображений
    delete_badge(badge_id)
    
    # Очищаем поле в базе
    badge.image_filename = None
    db.commit()
    db.refresh(badge)
    
    return {
        "message": "Изображение плашки удалено",
        "badge_id": badge_id
    } 