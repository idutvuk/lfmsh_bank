from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime, Date, Time, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base
from app.core.constants import AttendanceTypeEnum, AttendanceBlockEnum
from app.models.atomic_transaction import AtomicTransaction


class Attendance(Base):
    """Attendance model for tracking educational attendance"""
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(SQLEnum(AttendanceTypeEnum), nullable=False)
    attendance_block = Column(SQLEnum(AttendanceBlockEnum), nullable=True)
    date = Column(Date, nullable=False, server_default=func.current_date())
    related_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    count = Column(Integer, default=1)  # Number of attendance records (e.g., multiple lectures)
    
    # Inherit base atomic transaction fields
    value = Column(Float, default=0)
    description = Column(String(511), nullable=True)
    counted = Column(Boolean, default=False)
    creation_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    update_timestamp = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    receiver = relationship("User", foreign_keys=[receiver_id])
    related_transaction = relationship("Transaction", back_populates="attendance_records")
    
    @classmethod
    def new_attendance(cls, receiver, value, attendance_type, description, date, transaction, attendance_block_name=None, count=1):
        """Create a new attendance record"""
        from sqlalchemy.orm import Session
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        try:
            # Get the attendance block if provided
            attendance_block = None
            if attendance_block_name:
                try:
                    attendance_block = AttendanceBlockEnum(attendance_block_name)
                except ValueError:
                    # If the block name is not valid, ignore it
                    pass
                
            new_attendance = cls(
                related_transaction=transaction,
                receiver=receiver,
                value=value,
                type=attendance_type,
                description=description,
                counted=False,
                update_timestamp=func.now(),
                date=date,
                attendance_block=attendance_block,
                count=count
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
    
    def _get_block_time_range(self):
        """Get time range for attendance block"""
        if not self.attendance_block:
            return None, None
            
        time_ranges = {
            AttendanceBlockEnum.before_breakfast: ('06:00', '08:00'),
            AttendanceBlockEnum.first: ('08:00', '10:00'),
            AttendanceBlockEnum.second: ('10:00', '12:00'),
            AttendanceBlockEnum.third: ('12:00', '14:00'),
            AttendanceBlockEnum.fourth: ('14:00', '16:00'),
            AttendanceBlockEnum.fifth: ('16:00', '18:00'),
            AttendanceBlockEnum.evening: ('18:00', '22:00')
        }
        
        return time_ranges.get(self.attendance_block, (None, None))
    
    def _clashes_with(self, other_attendance):
        """Check if this attendance clashes with another attendance"""
        if not self.attendance_block or not other_attendance.attendance_block:
            return False
            
        if self.attendance_block == other_attendance.attendance_block:
            return True
            
        # Check for time overlaps
        start1, end1 = self._get_block_time_range()
        start2, end2 = other_attendance._get_block_time_range()
        
        if start1 and end1 and start2 and end2:
            # Convert to minutes for comparison
            start1_min = int(start1.split(':')[0]) * 60 + int(start1.split(':')[1])
            end1_min = int(end1.split(':')[0]) * 60 + int(end1.split(':')[1])
            start2_min = int(start2.split(':')[0]) * 60 + int(start2.split(':')[1])
            end2_min = int(end2.split(':')[0]) * 60 + int(end2.split(':')[1])
            
            # Check for overlap
            return (start1_min < end2_min and start2_min < end1_min)
            
        return False
    
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
                if self._clashes_with(suspicious):
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
        block_name = self.attendance_block.value if self.attendance_block else 'No block'
        return f'{block_name} {self.receiver} {self.date} {self.counted}'
    
    def to_python(self):
        """Convert to a dictionary for API responses"""
        return {
            'type': self.type.value,
            'value': self.value,
            'receiver': self.receiver.long_name(),
            'counted': self.counted,
            'description': self.description,
            'update_timestamp': self.update_timestamp.strftime('%d.%m.%Y %H:%M'),
            'creation_timestamp': self.creation_timestamp.strftime('%d.%m.%Y %H:%M'),
            'attendance_block': self.attendance_block.value if self.attendance_block else None,
            'date': self.date.strftime('%d.%m'),
            'count': self.count,
        }
    
    def full_info_as_list(self):
        """Get full info as a list for export"""
        block_info = [
            self.attendance_block.value if self.attendance_block else 'NA',
            self._get_block_time_range()[0] or 'NA',
            self._get_block_time_range()[1] or 'NA'
        ]
        
        return [
            self.type.value,
            self.date.strftime('%d.%m.%Y')
        ] + block_info + [
            self.value, 
            self.description, 
            self.counted,
            self.creation_timestamp.strftime('%d.%m.%Y %H:%M'),
            self.update_timestamp.strftime('%d.%m.%Y %H:%M'),
            self.count
        ] + self.receiver.full_info_as_list() + self.related_transaction.full_info_as_list()
    
    def full_info_headers_as_list(self):
        """Get header names for export"""
        return [
            'type', 'date', 'attendance_block', 'start_time', 'end_time', 'value', 
            'description', 'counted', 'creation_timestamp', 'update_timestamp', 'count'
        ] + ['receiver_' + x for x in self.receiver.full_info_headers_as_list()] + [
            'transaction_' + x for x in self.related_transaction.full_info_headers_as_list()
        ] 