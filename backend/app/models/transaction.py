from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship, Session
from sqlalchemy.sql import func
from loguru import logger

from app.db.session import Base, SessionLocal
from app.core.constants import States, TransactionTypeEnum

# Import enum classes for validation


class TransactionRecipient(Base):
    """Recipient of a transaction: объединяет деньги, сертификаты и счетчики посещаемости"""
    __tablename__ = "transaction_recipients"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bucks = Column(Float, default=0)  # Деньги
    certs = Column(Float, default=0)  # Сертификаты
    lab = Column(Integer, default=0)
    lec = Column(Integer, default=0)
    sem = Column(Integer, default=0)
    fac = Column(Integer, default=0)
    description = Column(String(511), nullable=True)
    counted = Column(Boolean, default=False)
    creation_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    update_timestamp = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User")
    transaction = relationship("Transaction", back_populates="recipients")

    def apply(self):
        if self.counted:
            raise AttributeError("Already counted")
        self.counted = True
        self.update_timestamp = func.now()
        # Применить изменения к пользователю
        self.user.balance += self.bucks
        self.user.certificates += self.certs
        # Обновить счетчики посещаемости
        self.user.lab_count += self.lab
        self.user.lec_count += self.lec
        self.user.sem_count += self.sem
        self.user.fac_count += self.fac

    def undo(self):
        if not self.counted:
            raise AttributeError("Not counted yet")
        self.counted = False
        self.update_timestamp = func.now()
        self.user.balance -= self.bucks
        self.user.certificates -= self.certs
        # Откатить счетчики посещаемости
        self.user.lab_count -= self.lab
        self.user.lec_count -= self.lec
        self.user.sem_count -= self.sem
        self.user.fac_count -= self.fac


class Transaction(Base):
    """Transaction model representing a financial or attendance transaction"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(String(1000), nullable=True)
    creation_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    type = Column(SQLEnum(TransactionTypeEnum), nullable=False)
    state = Column(SQLEnum(States), nullable=False, default=States.created)
    update_of_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)

    # Relationships
    creator = relationship("User", back_populates="created_transactions")
    update_of = relationship("Transaction", remote_side=[id])
    
    # New relationships for recipients
    recipients = relationship("TransactionRecipient", back_populates="transaction", cascade="all, delete-orphan")

    @classmethod
    def new_transaction(cls, creator, transaction_type, description="", recipients=None, update_of=None, db=None):
        """Create a new transaction"""
        if recipients is None:
            recipients = []
            
        # Use the provided session or create a new one if none provided
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            # If updating an existing transaction, validate it
            if update_of:
                updated = db.query(Transaction).filter(Transaction.id == update_of).first()
                if not updated:
                    raise ValueError("Transaction to update not found")
                if updated.creator_id != creator.id or updated.type != transaction_type:
                    raise ValueError("Cannot change transaction creator or type on update")

            new_transaction = cls(
                creator_id=creator.id,
                type=transaction_type,
                description=description,
                update_of_id=updated.id if update_of else None,
                state=States.created
            )

            db.add(new_transaction)
            db.commit()
            db.refresh(new_transaction)
            
            # Create recipients if provided
            if recipients:
                from app.models.user import User
                
                for recipient_data in recipients:
                    # Handle different recipient data formats
                    if isinstance(recipient_data, dict):
                        # Frontend sends 'id' and 'amount', backend expects 'username' and 'bucks'
                        user_id = recipient_data.get('id')
                        amount = recipient_data.get('amount', 0)
                        
                        # For attendance types, we need to set the appropriate counter
                        bucks = 0
                        certs = 0
                        lab = 0
                        lec = 0
                        sem = 0
                        fac = 0
                        
                        # Set bucks for financial transactions
                        if transaction_type not in [TransactionTypeEnum.fac_attend, TransactionTypeEnum.lec_attend, 
                                                   TransactionTypeEnum.sem_attend, TransactionTypeEnum.lab_pass]:
                            bucks = amount
                        
                        # Set appropriate counter for attendance types
                        if transaction_type == TransactionTypeEnum.fac_attend:
                            fac = 1
                        elif transaction_type == TransactionTypeEnum.lec_attend:
                            lec = 1
                        elif transaction_type == TransactionTypeEnum.sem_attend:
                            sem = 1
                        elif transaction_type == TransactionTypeEnum.lab_pass:
                            lab = 1
                        
                        # Handle legacy format with username
                        username = recipient_data.get('username')
                        if username:
                            user = db.query(User).filter(User.username == username).first()
                        elif user_id:
                            user = db.query(User).filter(User.id == user_id).first()
                        else:
                            raise ValueError(f"Invalid recipient data: {recipient_data}")
                        
                        if not user:
                            raise ValueError(f"User not found: {username or user_id}")

                        recipient = TransactionRecipient(
                            transaction_id=new_transaction.id,
                            user_id=user.id,
                            bucks=bucks,
                            certs=certs,
                            lab=lab,
                            lec=lec,
                            sem=sem,
                            fac=fac,
                            description=description
                        )
                        db.add(recipient)
                
                db.commit()
            
            return new_transaction
        except Exception as e:
            logger.error(f"Error in new_transaction: {str(e)}")
            db.rollback()
            raise
        finally:
            if close_session:
                db.close()

    def process(self, db: Session = None):
        """Process the transaction - change state to processed and apply all atomics"""
        from app.db.session import SessionLocal

        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            if self.can_be_transitioned_to(States.processed, db):
                if not self._is_counted():
                    # For p2p transactions, check sender balance and deduct money
                    if self.type == TransactionTypeEnum.p2p:
                        total_amount = self._get_total_amount(db)
                        if self.creator.balance < total_amount:
                            raise ValueError(f"Insufficient balance. Required: {total_amount}, Available: {self.creator.balance}")
                        
                        # Deduct money from sender
                        self.creator.balance -= total_amount
                        db.add(self.creator)
                    
                    # Apply all recipients
                    for atomic in self.get_all_atomics(db):
                        atomic.apply()

                self.state = States.processed
                db.add(self)
                db.commit()
            else:
                raise AttributeError("Cannot process the transaction in its current state")
        finally:
            if close_session:
                db.close()

    def decline(self, db: Session):
        """Decline the transaction"""
        if self.can_be_transitioned_to(States.declined, db):
            self._undo(db)
            self.state = States.declined
            db.add(self)
            db.commit()
        else:
            raise AttributeError("Cannot decline the transaction in its current state")

    def substitute(self, db: Session):
        """Mark the transaction as substituted"""
        if self.can_be_transitioned_to(States.substituted, db):
            self._undo(db)
            self.state = States.substituted
            db.add(self)
            db.commit()
        else:
            raise AttributeError("Cannot substitute the transaction in its current state")

    def _undo(self, db: Session):
        """Undo the effects of the transaction"""
        if self._is_counted():
            # For p2p transactions, return money to sender
            if self.type == TransactionTypeEnum.p2p:
                total_amount = self._get_total_amount(db)
                self.creator.balance += total_amount
                db.add(self.creator)
            
            # Undo all recipients
            for atomic in self.get_all_atomics(db):
                atomic.undo()

    def _is_counted(self):
        """Check if transaction is counted based on state"""
        return self.state in [States.processed]
    
    def _get_total_amount(self, db: Session):
        """Calculate total amount of money in this transaction"""
        recipients = self.get_all_atomics(db)
        return sum(recipient.bucks for recipient in recipients)

    def get_all_atomics(self, db: Session):
        """Get all atomic transactions (recipients) related to this transaction"""
        return db.query(TransactionRecipient).filter(TransactionRecipient.transaction_id == self.id).all()

    def can_be_transitioned_to(self, new_state, db: Session):
        """Check if the transaction can be transitioned to the given state"""
        # Check that all recipients are in the correct counted state
        recipients = db.query(TransactionRecipient).filter(TransactionRecipient.transaction_id == self.id).all()
        for atomic in recipients:
            if atomic.counted != self._is_counted():
                return False

        # Check if the transition is allowed
        allowed_transitions = {
            States.created: [States.processed, States.declined],
            States.processed: [States.substituted],
            States.declined: [],
            States.substituted: []
        }
        
        return new_state in allowed_transitions.get(self.state, [])

    def receivers_count(self, db: Session):
        """Get count of unique receivers"""
        return db.query(TransactionRecipient.user_id).filter(TransactionRecipient.transaction_id == self.id).distinct().count()

    def money_count(self, db: Session):
        """Get total money value"""
        recipients = db.query(TransactionRecipient).filter(TransactionRecipient.transaction_id == self.id).all()
        return sum(recipient.bucks for recipient in recipients)

    def money_count_string(self, db: Session):
        """Get formatted money count string"""
        total = self.money_count(db)
        if total > 0:
            return f"+{total}"
        return str(total)

    def get_creation_timestamp(self):
        """Get formatted creation timestamp"""
        return self.creation_timestamp.strftime('%d.%m.%Y %H:%M')

    def to_python(self, db: Session):
        """Convert to a dictionary for API responses"""
        return {
            'id': self.id,
            'creator': self.creator.long_name(),
            'type': self.type.value,
            'state': self.state.value,
            'description': self.description,
            'creation_timestamp': self.get_creation_timestamp(),
            'receivers_count': self.receivers_count(db),
            'money_count': self.money_count_string(db),
            'update_of_id': self.update_of_id
        }

    def full_info_as_list(self):
        """Get full info as a list for export"""
        return [
            self.id,
            self.creator.long_name(),
            self.type.value,
            self.state.value,
            self.description,
            self.get_creation_timestamp(),
            self.update_of_id or 'NA'
        ]

    def full_info_headers_as_list(self):
        """Get header names for export"""
        return [
            'transaction_id',
            'creator',
            'type',
            'state',
            'description',
            'creation_timestamp',
            'update_of_id'
        ]