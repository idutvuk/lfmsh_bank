from sqlalchemy import Column, String
from sqlalchemy.ext.declarative import declared_attr

from app.db.session import Base


class AbstractTypeBase:
    """Base class for all type-related models"""
    
    name = Column(String(127), unique=True, index=True)
    readable_name = Column(String(511))

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    def __str__(self):
        return self.readable_name
        
    def full_info_as_list(self):
        return [self.readable_name]

    def full_info_headers_as_list(self):
        return ['type_readable_name'] 