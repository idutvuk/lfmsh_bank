from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime, Date, Time, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base
from app.models.base import AbstractTypeBase
from app.models.atomic_transaction import AtomicTransaction


# Association table for attendance types and blocks
attendance_type_blocks = Table(
    'attendance_type_blocks',
    Base.metadata,
    Column('attendance_type_id', Integer, ForeignKey('attendancetype.id'), primary_key=True),
    Column('attendance_block_id', Integer, ForeignKey('attendanceblock.id'), primary_key=True)
)


class AttendanceType(AbstractTypeBase, Base):
    """Attendance type model"""
    id = Column(Integer, primary_key=True, index=True)
    
    # Many-to-many relationship with attendance blocks
    related_attendance_blocks = relationship(
        "AttendanceBlock",
        secondary=attendance_type_blocks,
        back_populates="related_attendance_types"
    )


class AttendanceBlock(AbstractTypeBase, Base):
    """Attendance block model (time slots)"""
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Many-to-many relationship with attendance types
    related_attendance_types = relationship(
        "AttendanceType",
        secondary=attendance_type_blocks,
        back_populates="related_attendance_blocks"
    )
    
    def clashes_with(self, other_block):
        """Check if this block clashes with another block"""
        if other_block:
            # If this block starts during the other block
            starts_during = (other_block.start_time <= self.start_time < other_block.end_time)
            # If this block ends during the other block
            ends_during = (other_block.start_time < self.end_time <= other_block.end_time)
            return starts_during or ends_during
        return False


class Attendance(Base):
    """Attendance model for tracking educational attendance"""
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type_id = Column(Integer, ForeignKey("attendancetype.id"), nullable=False)
    attendance_block_id = Column(Integer, ForeignKey("attendanceblock.id"), nullable=True)
    date = Column(Date, nullable=False)
    related_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    
    # Inherit base atomic transaction fields
    value = Column(Float, default=0)
    description = Column(String(511), nullable=True)
    counted = Column(Boolean, default=False)
    creation_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    update_timestamp = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    receiver = relationship("User", foreign_keys=[receiver_id])
    type = relationship("AttendanceType")
    attendance_block = relationship("AttendanceBlock")
    related_transaction = relationship("Transaction")
    
    @classmethod
    def new_attendance(cls, receiver, value, attendance_type, description, date, transaction, attendance_block_name=None):
        """Create a new attendance record"""
        from sqlalchemy.orm import Session
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        try:
            # Get the attendance block if provided
            attendance_block = None
            if attendance_block_name:
                attendance_block = db.query(AttendanceBlock).filter(
                    AttendanceBlock.name == attendance_block_name
                ).first()
                
            new_attendance = cls(
                related_transaction=transaction,
                receiver=receiver,
                value=value,
                type=attendance_type,
                description=description,
                counted=False,
                update_timestamp=func.now(),
                date=date,
                attendance_block=attendance_block
            )
            
            db.add(new_attendance)
            db.commit()
            db.refresh(new_attendance)
            return new_attendance
        finally:
            db.close()
    
    def apply(self):
        """Apply the attendance record if valid"""
        if self.is_valid():
            self._switch_counted(True)
    
    def undo(self):
        """Undo the attendance record"""
        self._switch_counted(False)
    
    def _switch_counted(self, value):
        """Helper to change counted status"""
        if self.counted == value:
            raise AttributeError("Attendance already has this counted value")
        
        # Update the counted status
        self.counted = value
        self.update_timestamp = func.now()
    
    def is_valid(self):
        """Check if this attendance doesn't clash with other attendances"""
        from sqlalchemy.orm import Session
        from app.db.session import SessionLocal
        
        if not self.attendance_block:
            return True
            
        db = SessionLocal()
        try:
            # Find other attendances for the same user on the same day
            suspicious_attendances = db.query(Attendance).filter(
                Attendance.receiver_id == self.receiver_id,
                Attendance.date == self.date,
                Attendance.counted == True,
                Attendance.id != self.id
            ).all()
            
            # Check if any of them clash with this one
            for suspicious in suspicious_attendances:
                if suspicious.attendance_block and self.attendance_block.clashes_with(suspicious.attendance_block):
                    return False
                    
            return True
        finally:
            db.close()
    
    def get_counted(self):
        """Get human-readable counted status"""
        return 'Засчитан' if self.counted else 'Не засчитан'
    
    def get_date(self):
        """Format date for display"""
        return self.date.strftime('%d.%m')
    
    def get_value(self):
        """Format value for display"""
        if self.value >= 0:
            return f'+{int(self.value)}'
        return str(int(self.value))
    
    def __str__(self):
        """String representation"""
        return f'{self.attendance_block} {self.receiver} {self.date} {self.counted}'
    
    def to_python(self):
        """Convert to a dictionary for API responses"""
        return {
            'type': self.type.readable_name,
            'value': self.value,
            'receiver': self.receiver.long_name(),
            'counted': self.counted,
            'description': self.description,
            'update_timestamp': self.update_timestamp.strftime('%d.%m.%Y %H:%M'),
            'creation_timestamp': self.creation_timestamp.strftime('%d.%m.%Y %H:%M'),
            'attendance_block': self.attendance_block.readable_name if self.attendance_block else 'null',
            'date': self.date.strftime('%d.%m'),
        }
    
    def full_info_as_list(self):
        """Get full info as a list for export"""
        at_block_info = self.attendance_block.full_info_as_list() if self.attendance_block else ['NA']
        
        return self.type.full_info_as_list() + [
            self.date.strftime('%d.%m.%Y')
        ] + at_block_info + [
            self.value, 
            self.description, 
            self.counted,
            self.creation_timestamp.strftime('%d.%m.%Y %H:%M'),
            self.update_timestamp.strftime('%d.%m.%Y %H:%M')
        ] + self.receiver.full_info_as_list() + self.related_transaction.full_info_as_list()
    
    def full_info_headers_as_list(self):
        """Get header names for export"""
        return self.type.full_info_headers_as_list() + [
            'date'
        ] + ['attendance_block_' + x for x in self.attendance_block.full_info_headers_as_list()] + [
            'value', 'description', 'counted', 'creation_timestamp', 'update_timestamp'
        ] + ['receiver_' + x for x in self.receiver.full_info_headers_as_list()] + [
            'transaction_' + x for x in self.related_transaction.full_info_headers_as_list()
        ] 