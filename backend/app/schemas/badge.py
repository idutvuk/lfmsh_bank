from pydantic import BaseModel, ConfigDict
from typing import Optional


class BadgeBase(BaseModel):
    """Базовая схема плашки"""
    name: str
    description: Optional[str] = None
    image_filename: Optional[str] = None


class BadgeCreate(BadgeBase):
    """Схема для создания плашки"""
    pass


class BadgeUpdate(BaseModel):
    """Схема для обновления плашки"""
    name: Optional[str] = None
    description: Optional[str] = None
    image_filename: Optional[str] = None
    is_active: Optional[bool] = None


class Badge(BadgeBase):
    """Схема плашки для отправки клиенту"""
    id: int
    is_active: bool = True
    
    model_config = ConfigDict(from_attributes=True) 