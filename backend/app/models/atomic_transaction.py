from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base
from app.models.base import AbstractTypeBase


class AtomicTransactionType(AbstractTypeBase, Base):
    """Base type for atomic transactions"""
    id = Column(Integer, primary_key=True, index=True)


class AtomicTransaction(Base):
    """Base model for atomic transactions (Money and Attendance)"""
    __tablename__ = "atomic_transactions"

    id = Column(Integer, primary_key=True, index=True)
    value = Column(Float, default=0)
    description = Column(String(511), nullable=True)
    counted = Column(Boolean, default=False)
    creation_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    update_timestamp = Column(DateTime(timezone=True), onupdate=func.now())

    # SQLAlchemy doesn't support inheritance out of the box like Django
    # This is meant to be a common base class for Money and Attendance
    
    def _switch_counted(self, value):
        """Helper method to mark transaction as counted/uncounted"""
        if self.counted == value:
            raise AttributeError("Transaction already has this counted value")
        self.counted = value
        self.update_timestamp = func.now()
        
    def full_info_as_list(self):
        """Get transaction info as a list"""
        return [
            self.value, 
            self.description, 
            self.counted,
            self.creation_timestamp.strftime('%d.%m.%Y %H:%M'),
            self.update_timestamp.strftime('%d.%m.%Y %H:%M')
        ]
    
    def full_info_headers_as_list(self):
        """Get header names for info list"""
        return [
            'value', 
            'description', 
            'counted',
            'creation_timestamp',
            'update_timestamp'
        ] 