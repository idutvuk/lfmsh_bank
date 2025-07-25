from sqlalchemy import Boolean, Column, String, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    image_filename = Column(String(256), nullable=True)  # Filename of uploaded image
    
    # Optional settings
    is_active = Column(Boolean, default=True)
    
    def __str__(self):
        return self.name
    
    def full_info_as_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'image_filename': self.image_filename,
            'is_active': self.is_active
        } 