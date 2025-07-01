from sqlalchemy import Boolean, Column, String, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base
from app.core.constants import SIGN


class User(Base):
    """User model based on Django's Account model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(256), unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Basic info
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    middle_name = Column(String(40), default="Not stated")
    
    # School-specific info
    balance = Column(Float, default=0)
    certificates = Column(Float, default=0)  # Сертификаты
    party = Column(Integer, default=0)
    grade = Column(Integer, default=0)
    
    # Attendance counters
    lab_count = Column(Integer, default=0)
    lec_count = Column(Integer, default=0)
    sem_count = Column(Integer, default=0)
    fac_count = Column(Integer, default=0)
    
    # Status fields
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_staff = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    created_transactions = relationship("Transaction", back_populates="creator")
    
    # Count attendance by type
    def get_counter(self, counter_name, db):
        """Get the count of a specific attendance type"""
        from app.models.transaction import TransactionRecipient
        
        # Map counter names to TransactionRecipient fields
        counter_field_map = {
            'seminar_attend': 'sem',
            'seminar_pass': 'sem', 
            'fac_attend': 'fac',
            'fac_pass': 'fac',
            'lab_pass': 'lab',
            'lecture_miss': 'lec'
        }
        
        field_name = counter_field_map.get(counter_name)
        if not field_name:
            return 0
            
        # Get all counted transaction recipients for this user
        recipients = db.query(TransactionRecipient).filter(
            TransactionRecipient.user_id == self.id,
            TransactionRecipient.counted,
        ).all()
        
        # Sum up the specific counter field
        total = 0
        for recipient in recipients:
            total += getattr(recipient, field_name, 0)
            
        return total
    
    # Name formatting
    def __str__(self):
        """String representation"""
        if self.balance:
            return f"{self.short_name()} {self.get_balance()}"
        return self.short_name()
        
    def name_with_balance(self):
        """Get name with balance"""
        return f"{self.last_name} {self.first_name} {self.get_balance()}"
        
    def long_name(self):
        """Get full name"""
        return f"{self.last_name} {self.first_name}"
        
    def short_name(self):
        """Get short name with initials"""
        if self.first_name and self.middle_name:
            return f"{self.last_name} {self.first_name[0]}. {self.middle_name[0]}."
        return self.last_name
        
    def get_balance(self):
        """Format the balance with currency sign"""
        if abs(self.balance) > 9.99:
            return f"{int(self.balance)}{SIGN}"
        return f"{round(self.balance, 1)}{SIGN}"
    
    # Money-related methods
    def get_all_money(self, db):
        """Get all money transactions"""
        from app.models.transaction import TransactionRecipient
        
        # Get all transaction recipients where this user is involved
        recipients = db.query(TransactionRecipient).filter(
            TransactionRecipient.user_id == self.id
        ).all()
        
        # Sort by timestamp
        recipients.sort(key=lambda r: r.creation_timestamp)
        
        return recipients
    
    # Study performance and fines calculation
    def get_final_study_fine(self, db):
        """Calculate total study fine"""
        return sum([
            self.get_sem_fine(db),
            self.get_obl_study_fine(db),
            self.get_lab_fine(db),
            self.get_fac_fine(db),
        ])
        
    def get_equator_study_fine(self, db):
        """Calculate equator study fine"""
        return self.get_obl_study_fine_equator(db) + self.get_lab_fine_equator(db)
        
    def get_sem_fine(self, db):
        """Calculate seminar fine"""
        from app.core.constants import SEM_NOT_READ_PEN
        return SEM_NOT_READ_PEN * max(0, 1 - self.get_counter('seminar_pass', db))
        
    def get_lab_fine(self, db):
        """Calculate laboratory fine"""
        from app.core.constants import LAB_PENALTY
        return max(0, self.lab_needed() - self.get_counter('lab_pass', db)) * LAB_PENALTY
        
    def get_lab_fine_equator(self, db):
        """Calculate laboratory fine at equator"""
        from app.core.constants import LAB_PENALTY, LAB_PASS_NEEDED_EQUATOR
        return max(0, (LAB_PASS_NEEDED_EQUATOR - self.get_counter('lab_pass', db))) * LAB_PENALTY
        
    def get_obl_study_fine(self, db):
        """Calculate obligatory study fine"""
        from app.core.constants import (OBL_STUDY_NEEDED, INITIAL_STEP_OBL_STD, 
                                       STEP_OBL_STD)
        
        seminar_count = self.get_counter('seminar_attend', db)
        fac_count = self.get_counter('fac_attend', db)
        
        deficit = max(0, OBL_STUDY_NEEDED - int(seminar_count + fac_count))
        single_fine = INITIAL_STEP_OBL_STD
        fine = 0
        
        for _ in range(deficit):
            fine += single_fine
            single_fine += STEP_OBL_STD
            
        return fine
        
    def get_obl_study_fine_equator(self, db):
        """Calculate obligatory study fine at equator"""
        from app.core.constants import (OBL_STUDY_NEEDED_EQUATOR, INITIAL_STEP_OBL_STD, 
                                       STEP_OBL_STD)
        
        seminar_count = self.get_counter('seminar_attend', db)
        fac_count = self.get_counter('fac_attend', db)
        
        deficit = max(0, OBL_STUDY_NEEDED_EQUATOR - int(seminar_count + fac_count))
        single_fine = INITIAL_STEP_OBL_STD
        fine = 0
        
        for _ in range(deficit):
            fine += single_fine
            single_fine += STEP_OBL_STD
            
        return fine
        
    def get_fac_fine(self, db):
        """Calculate faculty fine"""
        from app.core.constants import FAC_PENALTY
        return max(0, (self.fac_needed() - self.get_counter('fac_pass', db))) * FAC_PENALTY
        
    def lab_needed(self):
        """Get required number of labs based on grade"""
        from app.core.constants import LAB_PASS_NEEDED
        return LAB_PASS_NEEDED.get(self.grade, 2)  # Default to 2 if grade not found
        
    def fac_needed(self):
        """Get required number of faculty passes based on grade"""
        from app.core.constants import FAC_PASS_NEEDED
        return FAC_PASS_NEEDED.get(self.grade, 1)  # Default to 1 if grade not found
        
    def get_next_missed_lec_penalty(self, db):
        """Calculate penalty for next missed lecture"""
        from app.core.constants import (LECTURE_PENALTY_STEP, LECTURE_PENALTY_INITIAL)
        return (self.get_counter('lecture_miss', db) * 
                LECTURE_PENALTY_STEP + LECTURE_PENALTY_INITIAL)
    
    # Data export methods
    def full_info_as_list(self):
        """Get full user info as list for export"""
        return [
            self.first_name, 
            self.last_name, 
            self.middle_name,
            self.username, 
            self.party, 
            self.grade, 
            self.balance
        ]
        
    def full_info_as_map(self, with_balance=True):
        """Get full user info as dict for export"""
        result = {
            'first_name': self.first_name,
            'last_name': self.last_name,
            'middle_name': self.middle_name,
            'username': self.username,
            'party': self.party,
            'grade': self.grade,
        }
        
        if with_balance:
            result['balance'] = self.balance
            
        return result
        
    def full_info_headers_as_list(self):
        """Get header names for user info list"""
        return [
            'first_name', 
            'last_name', 
            'middle_name', 
            'username', 
            'party', 
            'grade',
            'balance'
        ] 