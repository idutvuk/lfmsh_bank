from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base
from app.core.constants import SIGN, MoneyTypeEnum
from app.models.atomic_transaction import AtomicTransaction


class Money(Base):
    """Money model for tracking financial transactions"""
    __tablename__ = "money"

    id = Column(Integer, primary_key=True, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(SQLEnum(MoneyTypeEnum), nullable=False)
    related_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    
    # Inherit base atomic transaction fields
    value = Column(Float, default=0)
    description = Column(String(511), nullable=True)
    counted = Column(Boolean, default=False)
    creation_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    update_timestamp = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    receiver = relationship("User", foreign_keys=[receiver_id])
    related_transaction = relationship("Transaction", back_populates="money_records")
    
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
        return f'{self.value}{SIGN} за {self.type.value}'
    
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
            'general_group': self._get_general_group(),
            'local_group': self._get_local_group(),
            'type': self.type.value,
            'value': self.value,
            'receiver': self.receiver.long_name(),
            'creator': self.related_transaction.creator.long_name(),
            'counted': self.counted,
            'state': self.related_transaction.state.value,
            'description': self.description,
            'update_timestamp': self.update_timestamp.strftime('%d.%m.%Y %H:%M'),
            'creation_timestamp': self.creation_timestamp.strftime('%d.%m.%Y %H:%M')
        }
    
    def _get_general_group(self):
        """Get general group for money type"""
        general_groups = {
            MoneyTypeEnum.fine: 'Штрафы',
            MoneyTypeEnum.activity: 'Деятельность',
            MoneyTypeEnum.seminar: 'Учёба',
            MoneyTypeEnum.lecture: 'Учёба',
            MoneyTypeEnum.fac_pass: 'Факультативы',
            MoneyTypeEnum.lab: 'Лабораторные',
            MoneyTypeEnum.ds: 'Дежурства',
            MoneyTypeEnum.exam: 'Экзамены',
            MoneyTypeEnum.general: 'Общие',
            MoneyTypeEnum.purchase: 'Покупки',
            MoneyTypeEnum.p2p: 'Переводы'
        }
        return general_groups.get(self.type, 'Другое')
    
    def _get_local_group(self):
        """Get local group for money type"""
        local_groups = {
            MoneyTypeEnum.fine: 'Штрафы',
            MoneyTypeEnum.activity: 'Деятельность',
            MoneyTypeEnum.seminar: 'Семинары',
            MoneyTypeEnum.lecture: 'Лекции',
            MoneyTypeEnum.fac_pass: 'Факультативы',
            MoneyTypeEnum.lab: 'Лабораторные',
            MoneyTypeEnum.ds: 'Дежурства',
            MoneyTypeEnum.exam: 'Экзамены',
            MoneyTypeEnum.general: 'Общие',
            MoneyTypeEnum.purchase: 'Покупки',
            MoneyTypeEnum.p2p: 'Переводы'
        }
        return local_groups.get(self.type, 'Другое')
    
    def full_info_as_list(self):
        """Get full info as a list for export"""
        return [
            self.type.value,
            self._get_general_group(),
            self._get_local_group(),
            self.value, 
            self.description, 
            self.counted,
            self.creation_timestamp.strftime('%d.%m.%Y %H:%M'),
            self.update_timestamp.strftime('%d.%m.%Y %H:%M')
        ] + self.receiver.full_info_as_list() + self.related_transaction.full_info_as_list()
    
    def full_info_headers_as_list(self):
        """Get header names for export"""
        return [
            'type', 'general_group', 'local_group', 'value', 'description', 'counted', 
            'creation_timestamp', 'update_timestamp'
        ] + ['receiver_' + x for x in self.receiver.full_info_headers_as_list()] + [
            'transaction_' + x for x in self.related_transaction.full_info_headers_as_list()
        ] 