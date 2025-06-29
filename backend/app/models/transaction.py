import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table, Boolean
from sqlalchemy.orm import relationship, Session
from sqlalchemy.sql import func

from app.db.session import Base
from app.models.base import AbstractTypeBase

# Association table for transaction state possible transitions
transaction_state_transitions = Table(
    'transaction_state_transitions',
    Base.metadata,
    Column('from_state_id', Integer, ForeignKey('transactionstate.id'), primary_key=True),
    Column('to_state_id', Integer, ForeignKey('transactionstate.id'), primary_key=True)
)


class TransactionState(AbstractTypeBase, Base):
    """Transaction state model"""
    id = Column(Integer, primary_key=True, index=True)
    counted = Column(Boolean, default=False)

    # Many-to-many relationship for possible state transitions
    possible_transitions = relationship(
        "TransactionState",
        secondary=transaction_state_transitions,
        primaryjoin=id == transaction_state_transitions.c.from_state_id,
        secondaryjoin=id == transaction_state_transitions.c.to_state_id,
        backref="previous_states"
    )


class TransactionType(AbstractTypeBase, Base):
    """Transaction type model"""
    id = Column(Integer, primary_key=True, index=True)


class Transaction(Base):
    """Transaction model representing a financial or attendance transaction"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creation_map = Column(String(262143))  # Stores JSON data of transaction creation
    creation_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    type_id = Column(Integer, ForeignKey("transactiontype.id"), nullable=False)
    state_id = Column(Integer, ForeignKey("transactionstate.id"), nullable=False)
    update_of_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)

    # Relationships
    creator = relationship("User", back_populates="created_transactions")
    type = relationship("TransactionType")
    state = relationship("TransactionState")
    update_of = relationship("Transaction", remote_side=[id])

    # Atomics relations added via back_populates in their respective models

    @classmethod
    def new_transaction(cls, creator, transaction_type, creation_map, update_of=None):
        """Create a new transaction"""
        from app.db.session import SessionLocal

        db = SessionLocal()
        try:
            # If updating an existing transaction, validate it
            if update_of:
                updated = db.query(Transaction).filter(Transaction.id == update_of).first()
                if not updated:
                    raise ValueError("Transaction to update not found")
                if updated.creator != creator or updated.type != transaction_type:
                    raise ValueError("Cannot change transaction creator or type on update")

            from app.core.constants import States
            # Get the created state
            create_state = db.query(TransactionState).filter(
                TransactionState.name == States.created.value
            ).first()

            if not create_state:
                raise ValueError("Created transaction state not found")

            new_transaction = cls(
                creator=creator,
                type=transaction_type,
                creation_map=json.dumps(creation_map),
                update_of=updated if update_of else None,
                state=create_state
            )

            db.add(new_transaction)
            db.commit()
            db.refresh(new_transaction)
            return new_transaction
        finally:
            db.close()

    def process(self):
        """Process the transaction - change state to processed and apply all atomics"""
        from app.core.constants import States
        from sqlalchemy.orm import Session
        from app.db.session import SessionLocal

        db = SessionLocal()
        try:
            if self.can_be_transitioned_to(States.processed.value, db):
                if not self.state.counted:
                    for atomic in self.get_all_atomics(db):
                        atomic.apply()

                processed_state = db.query(TransactionState).filter(
                    TransactionState.name == States.processed.value
                ).first()

                self.state = processed_state
                db.add(self)
                db.commit()
            else:
                raise AttributeError("Cannot process the transaction in its current state")
        finally:
            db.close()

    def decline(self, db: Session):
        """Decline the transaction"""
        from app.core.constants import States

        if self.can_be_transitioned_to(States.declined.value, db):
            self._undo(db)
            declined_state = db.query(TransactionState).filter(
                TransactionState.name == States.declined.value
            ).first()
            self.state = declined_state
            db.add(self)
            db.commit()
        else:
            raise AttributeError("Cannot decline the transaction in its current state")

    def substitute(self, db: Session):
        """Mark the transaction as substituted"""
        from app.core.constants import States

        if self.can_be_transitioned_to(States.substituted.value, db):
            self._undo(db)
            substituted_state = db.query(TransactionState).filter(
                TransactionState.name == States.substituted.value
            ).first()
            self.state = substituted_state
            db.add(self)
            db.commit()
        else:
            raise AttributeError("Cannot substitute the transaction in its current state")

    def _undo(self, db: Session):
        """Undo the effects of the transaction"""
        if self.state.counted:
            for atomic in self.get_all_atomics(db):
                atomic.undo()

    def get_all_atomics(self, db: Session):
        """Get all atomic transactions (money and attendance) related to this transaction"""
        from app.models.money import Money
        from app.models.attendance import Attendance

        money_atomics = db.query(Money).filter(Money.related_transaction_id == self.id).all()
        attendance_atomics = db.query(Attendance).filter(Attendance.related_transaction_id == self.id).all()

        return money_atomics + attendance_atomics

    def can_be_transitioned_to(self, state_name: str, db: Session):
        """Check if the transaction can be transitioned to the given state"""
        from app.models.money import Money

        # Check that all money atomics are in the correct counted state
        money_atomics = db.query(Money).filter(Money.related_transaction_id == self.id).all()
        for atomic in money_atomics:
            if atomic.counted != self.state.counted:
                return False

        # Check if the transition is allowed
        possible_states = db.query(TransactionState).join(
            transaction_state_transitions,
            TransactionState.id == transaction_state_transitions.c.to_state_id
        ).filter(
            transaction_state_transitions.c.from_state_id == self.state_id,
            TransactionState.name == state_name
        ).all()

        return len(possible_states) > 0

    def receivers_count(self, db: Session):
        """Count unique receivers of this transaction"""
        atomics = self.get_all_atomics(db)
        return len(set([at.receiver_id for at in atomics]))

    def money_count(self, db: Session):
        """Calculate the total money amount in the transaction"""
        from app.models.money import Money

        money_atomics = db.query(Money).filter(Money.related_transaction_id == self.id).all()
        money_sum = sum([a.value for a in money_atomics])
        if money_sum > 9.99:
            return int(money_sum)
        return money_sum

    def money_count_string(self, db: Session):
        """Format the money count as a string with currency sign"""
        from app.core.constants import SIGN
        return f"{self.money_count(db)} {SIGN}"

    def get_creation_timestamp(self):
        """Format creation timestamp"""
        return self.creation_timestamp.strftime('%d.%m, %H:%M')

    def to_python(self, db: Session):
        """Convert transaction to a Python dictionary"""
        money_atomics = db.query(Money).filter(Money.related_transaction_id == self.id).all()
        attendance_atomics = db.query(Attendance).filter(Attendance.related_transaction_id == self.id).all()

        return {
            'creator': self.creator.long_name(),
            'creation_timestamp': self.creation_timestamp.strftime('%d.%m.%Y %H:%M'),
            'state': self.state.readable_name,
            'type': self.type.readable_name,
            'money': [t.to_python() for t in money_atomics],
            'counters': [t.to_python() for t in attendance_atomics],
        }

    def full_info_as_list(self):
        """Get full transaction info as a list"""
        return self.creator.full_info_as_list() + [
            self.creation_timestamp.strftime('%d.%m.%Y %H:%M'),
            self.state.readable_name,
            self.state.counted
        ] + self.type.full_info_as_list()

    def full_info_headers_as_list(self):
        """Get header names for info list"""
        return [
            'creator_' + x for x in self.creator.full_info_headers_as_list()
        ] + [
            'creation_timestamp', 'state_name', 'counted'
        ] + self.type.full_info_headers_as_list()