from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base
from app.models.base import AbstractTypeBase
from app.core.constants import SIGN
from app.models.atomic_transaction import AtomicTransaction


class MoneyType(AbstractTypeBase, Base):
    """Money type model"""
    id = Column(Integer, primary_key=True, index=True)
    readable_group_general = Column(String, nullable=True)
    readable_group_local = Column(String, nullable=True)


class Money(Base):
    """Money model for tracking financial transactions"""
    __tablename__ = "money"

    id = Column(Integer, primary_key=True, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type_id = Column(Integer, ForeignKey("moneytype.id"), nullable=False)
    related_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    
    # Inherit base atomic transaction fields
    value = Column(Float, default=0)
    description = Column(String(511), nullable=True)
    counted = Column(Boolean, default=False)
    creation_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    update_timestamp = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    receiver = relationship("User", foreign_keys=[receiver_id])
    type = relationship("MoneyType")
    related_transaction = relationship("Transaction")
    
    @classmethod
    def new_money(cls, receiver, value, money_type, description, transaction):
        """Create a new money transaction"""
        new_money = cls(
            related_transaction=transaction,
            receiver=receiver,
            value=value,
            type=money_type,
            description=description,
            counted=False,
            update_timestamp=func.now()
        )
        return new_money
    
    def __str__(self):
        """String representation of the money transaction"""
        return f'{self.value}{SIGN} за {self.type}'
    
    def apply(self):
        """Apply the money transaction"""
        self._switch_counted(True)
    
    def undo(self):
        """Undo the money transaction"""
        self._switch_counted(False)
    
    def _switch_counted(self, value):
        """Helper to change counted status and update balances"""
        if self.counted == value:
            raise AttributeError("Money already has this counted value")
        
        # Update the counted status
        self.counted = value
        self.update_timestamp = func.now()
        
        # Update balances
        creator = self.related_transaction.creator
        receiver = self.receiver
        
        if not value:  # If uncounting
            creator.balance += self.value
            receiver.balance -= self.value
        else:  # If counting
            creator.balance -= self.value
            receiver.balance += self.value
    
    def get_value(self):
        """Format the value for display"""
        if abs(self.value) > 9.9:
            v = int(self.value)
        else:
            v = round(self.value, 1)
            
        if v > 0:
            return f'+{str(v)} {SIGN}'
        return f'{str(v)} {SIGN}'
    
    def to_python(self):
        """Convert to a dictionary for API responses"""
        return {
            'general_group': self.type.readable_group_general,
            'local_group': self.type.readable_group_local,
            'type': self.type.readable_name,
            'value': self.value,
            'receiver': self.receiver.long_name(),
            'creator': self.related_transaction.creator.long_name(),
            'counted': self.counted,
            'state': self.related_transaction.state.readable_name,
            'description': self.description,
            'update_timestamp': self.update_timestamp.strftime('%d.%m.%Y %H:%M'),
            'creation_timestamp': self.creation_timestamp.strftime('%d.%m.%Y %H:%M')
        }
    
    def full_info_as_list(self):
        """Get full info as a list for export"""
        return self.type.full_info_as_list() + [
            self.value, 
            self.description, 
            self.counted,
            self.creation_timestamp.strftime('%d.%m.%Y %H:%M'),
            self.update_timestamp.strftime('%d.%m.%Y %H:%M')
        ] + self.receiver.full_info_as_list() + self.related_transaction.full_info_as_list()
    
    def full_info_headers_as_list(self):
        """Get header names for export"""
        return self.type.full_info_headers_as_list() + [
            'value', 'description', 'counted', 'creation_timestamp', 'update_timestamp'
        ] + ['receiver_' + x for x in self.receiver.full_info_headers_as_list()] + [
            'transaction_' + x for x in self.related_transaction.full_info_headers_as_list()
        ] 