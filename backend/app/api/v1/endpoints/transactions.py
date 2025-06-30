from typing import Any, List, Optional
from datetime import datetime
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger

from app.api.v1.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionState
from app.models.money import Money
from app.models.attendance import Attendance

router = APIRouter()


def format_transaction_for_frontend(transaction: Transaction, db: Session) -> dict:
    """
    Formats a Transaction object to match the frontend expected schema
    """
    # Get money atomics for this transaction
    money_atomics = db.query(Money).filter(Money.related_transaction_id == transaction.id).all()
    
    # Get attendance atomics for this transaction
    attendance_atomics = db.query(Attendance).filter(Attendance.related_transaction_id == transaction.id).all()
    
    # Group by receiver to create the receivers array
    receivers = {}
    
    # Process money atomics
    for atomic in money_atomics:
        user = db.query(User).filter(User.id == atomic.receiver_id).first()
        if not user:
            continue
        
        username = user.username
        if username not in receivers:
            receivers[username] = {
                "username": username,
                "bucks": 0,
                "certs": 0,
                "lab": 0,
                "lec": 0,
                "sem": 0,
                "fac": 0
            }
        
        # Determine if this is bucks or certs based on money type
        # For now we'll assume all are bucks until we implement certs properly
        receivers[username]["bucks"] += atomic.value
    
    # Process attendance atomics
    for atomic in attendance_atomics:
        user = db.query(User).filter(User.id == atomic.receiver_id).first()
        if not user:
            continue
        
        username = user.username
        if username not in receivers:
            receivers[username] = {
                "username": username,
                "bucks": 0,
                "certs": 0,
                "lab": 0,
                "lec": 0,
                "sem": 0,
                "fac": 0
            }
        
        # Update the appropriate counter based on attendance type
        attendance_type = atomic.type.name
        if "lab" in attendance_type:
            receivers[username]["lab"] += 1
        elif "lec" in attendance_type or "lecture" in attendance_type:
            receivers[username]["lec"] += 1
        elif "sem" in attendance_type or "seminar" in attendance_type:
            receivers[username]["sem"] += 1
        elif "fac" in attendance_type:
            receivers[username]["fac"] += 1
    
    # Format the transaction
    return {
        "id": transaction.id,
        "author": transaction.creator.username,
        "description": transaction.description,
        "type": transaction.type.name,
        "status": transaction.state.name,
        "date_created": transaction.creation_timestamp.strftime("%Y-%m-%dT%H:%M:%S"),
        "receivers": list(receivers.values())
    }


@router.get("/", response_model=List[dict])
def read_transactions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve transactions.
    """
    # Staff and admins can see all transactions
    if current_user.is_superuser or current_user.is_staff:
        transactions = db.query(Transaction).offset(skip).limit(limit).all()
    else:
        # Regular users can only see their own transactions
        transactions = db.query(Transaction).filter(
            Transaction.creator_id == current_user.id
        ).offset(skip).limit(limit).all()
    
    return [format_transaction_for_frontend(t, db) for t in transactions]


@router.post("/")
def create_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_data: dict,
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new transaction.
    """
    # Get the transaction type
    transaction_type = db.query(TransactionType).filter(
        TransactionType.name == transaction_data["type_name"]
    ).first()
    
    if not transaction_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction type {transaction_data['type_name']} not found",
        )
    
    update_of_id = transaction_data.get("update_of_id")
    
    # Create the transaction
    transaction = Transaction.new_transaction(
        creator=current_user,
        transaction_type=transaction_type,
        description=transaction_data.get("description", ""),
        recipients=transaction_data.get("recipients", []),
        update_of=update_of_id,
        db=db  # Pass the existing session
    )
    
    return format_transaction_for_frontend(transaction, db)


@router.post("/create/")
def create_transaction_frontend(
    *,
    db: Session = Depends(get_db),
    transaction_data: dict,
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new transaction via frontend endpoint.
    This endpoint matches the frontend API expectations.
    """
    logger.info(f"Received transaction create request from {current_user.username}")
    logger.info(f"Transaction data: {transaction_data}")
    
    # Map frontend transaction data to our backend format
    type_name = transaction_data.get("type") or transaction_data.get("type_name")
    description = transaction_data.get("description")
    
    # Use recipients if available, fall back to receivers if not
    recipients = transaction_data.get("recipients", []) or transaction_data.get("receivers", [])
    
    logger.info(f"Processing transaction of type: {type_name}")
    
    # Get the transaction type
    transaction_type = db.query(TransactionType).filter(
        TransactionType.name == type_name
    ).first()
    
    if not transaction_type:
        logger.error(f"Transaction type {type_name} not found")
        # Check what types are available
        available_types = db.query(TransactionType).all()
        logger.info(f"Available types: {[t.name for t in available_types]}")
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction type {type_name} not found",
        )
    
    logger.info(f"Found transaction type: {transaction_type.name}")
    
    # Create the transaction
    try:
        logger.info("Attempting to create transaction")
        
        # Check if transaction states exist
        states = db.query(TransactionState).all()
        logger.info(f"Available states: {[s.name for s in states]}")
        
        # Check specifically for 'created' state
        created_state = db.query(TransactionState).filter(
            TransactionState.name.ilike('created')
        ).first()
        logger.info(f"Created state found: {created_state is not None}")
        
        # Create the transaction
        transaction = Transaction.new_transaction(
            creator=current_user,
            transaction_type=transaction_type,
            description=description,
            recipients=recipients,
            db=db  # Pass the existing session
        )
        
        # Process atomic transactions for each recipient
        for recipient_data in recipients:
            recipient_id = recipient_data.get("id")
            username = recipient_data.get("username")
            bucks_amount = recipient_data.get("bucks", 0)
            
            logger.info(f"Processing recipient: {username} (id: {recipient_id}), bucks: {bucks_amount}")
            
            # Find recipient by ID first, then by username if ID not available
            recipient = None
            if recipient_id:
                recipient = db.query(User).filter(User.id == recipient_id).first()
            elif username:
                recipient = db.query(User).filter(User.username == username).first()
                
            if not recipient:
                logger.warning(f"Recipient with ID {recipient_id} or username {username} not found")
                continue
                
            logger.info(f"Found recipient: {recipient.username} (id: {recipient.id})")
                
            # Create money atomic transaction for bucks if non-zero
            if bucks_amount != 0:
                logger.info(f"Creating money atomic with value: {bucks_amount}")
                
                # Find or create a default money type
                from app.models.money import MoneyType
                money_type = db.query(MoneyType).filter(MoneyType.name == "general").first()
                if not money_type:
                    # Create a default money type if it doesn't exist
                    money_type = MoneyType(
                        name="general",
                        readable_name="General money transfer"
                    )
                    db.add(money_type)
                    db.flush()  # Get the ID without committing
                
                # Create money atomic
                from app.models.money import Money
                money = Money(
                    receiver_id=recipient.id,
                    type_id=money_type.id,
                    value=bucks_amount,
                    related_transaction_id=transaction.id,
                    description=description or f"Money from transaction {transaction.id}",
                    counted=False
                )
                db.add(money)
                logger.info(f"Added money atomic: {bucks_amount} bucks to {recipient.username}")
                
            # Handle attendance data if present
            lab_count = recipient_data.get("lab", 0)
            lec_count = recipient_data.get("lec", 0)
            sem_count = recipient_data.get("sem", 0)
            fac_count = recipient_data.get("fac", 0)
            
            logger.info(f"Attendance counts - lab: {lab_count}, lec: {lec_count}, sem: {sem_count}, fac: {fac_count}")
            
            from app.core.constants import AttendanceTypeEnum
            
            # Create attendance atomics as needed
            if lab_count > 0:
                from app.models.attendance import Attendance, AttendanceType
                from datetime import date
                lab_type = db.query(AttendanceType).filter(AttendanceType.name == AttendanceTypeEnum.lab_pass.value).first()
                if lab_type:
                    attendance = Attendance(
                        receiver_id=recipient.id,
                        type_id=lab_type.id,
                        related_transaction_id=transaction.id,
                        count=lab_count,
                        date=date.today(),
                        description=description or f"Lab attendance from transaction {transaction.id}",
                        counted=False
                    )
                    db.add(attendance)
                    logger.info(f"Added lab attendance: {lab_count} to {recipient.username}")
                else:
                    logger.warning(f"Lab attendance type not found: {AttendanceTypeEnum.lab_pass.value}")
            
            if lec_count > 0:
                from app.models.attendance import Attendance, AttendanceType
                from datetime import date
                lec_type = db.query(AttendanceType).filter(AttendanceType.name == AttendanceTypeEnum.lecture_attend.value).first()
                if lec_type:
                    attendance = Attendance(
                        receiver_id=recipient.id,
                        type_id=lec_type.id,
                        related_transaction_id=transaction.id,
                        count=lec_count,
                        date=date.today(),
                        description=description or f"Lecture attendance from transaction {transaction.id}",
                        counted=False
                    )
                    db.add(attendance)
                    logger.info(f"Added lecture attendance: {lec_count} to {recipient.username}")
                else:
                    logger.warning(f"Lecture attendance type not found: {AttendanceTypeEnum.lecture_attend.value}")
                    
            if sem_count > 0:
                from app.models.attendance import Attendance, AttendanceType
                from datetime import date
                sem_type = db.query(AttendanceType).filter(AttendanceType.name == AttendanceTypeEnum.seminar_pass.value).first()
                if sem_type:
                    attendance = Attendance(
                        receiver_id=recipient.id,
                        type_id=sem_type.id,
                        related_transaction_id=transaction.id,
                        count=sem_count,
                        date=date.today(),
                        description=description or f"Seminar attendance from transaction {transaction.id}",
                        counted=False
                    )
                    db.add(attendance)
                    logger.info(f"Added seminar attendance: {sem_count} to {recipient.username}")
                else:
                    logger.warning(f"Seminar attendance type not found: {AttendanceTypeEnum.seminar_pass.value}")
                    
            if fac_count > 0:
                from app.models.attendance import Attendance, AttendanceType
                from datetime import date
                fac_type = db.query(AttendanceType).filter(AttendanceType.name == AttendanceTypeEnum.fac_pass.value).first()
                if fac_type:
                    attendance = Attendance(
                        receiver_id=recipient.id,
                        type_id=fac_type.id,
                        related_transaction_id=transaction.id,
                        count=fac_count,
                        date=date.today(),
                        description=description or f"Faculty attendance from transaction {transaction.id}",
                        counted=False
                    )
                    db.add(attendance)
                    logger.info(f"Added faculty attendance: {fac_count} to {recipient.username}")
                else:
                    logger.warning(f"Faculty attendance type not found: {AttendanceTypeEnum.fac_pass.value}")
        
        logger.info("Committing transaction...")
        db.commit()
        logger.info("Transaction committed successfully")
        
        return format_transaction_for_frontend(transaction, db)
        
    except Exception as e:
        logger.error(f"Error creating transaction: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create transaction: {str(e)}"
        )


@router.get("/{transaction_id}")
def read_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_id: int,
    current_user: User = Depends(get_current_active_user),
):
    """
    Get transaction by ID.
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    
    # Check if user can access this transaction
    if not current_user.is_superuser and not current_user.is_staff and transaction.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this transaction",
        )
    
    return format_transaction_for_frontend(transaction, db)


@router.post("/{transaction_id}/process")
def process_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_id: int,
    current_user: User = Depends(get_current_active_user),
):
    """
    Process a transaction (apply it).
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    
    # Only staff and transaction creators can process transactions
    if not current_user.is_superuser and not current_user.is_staff and transaction.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to process this transaction",
        )
    
    try:
        transaction.process()
    except AttributeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return format_transaction_for_frontend(transaction, db)


@router.post("/{transaction_id}/decline")
def decline_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_id: int,
    current_user: User = Depends(get_current_active_user),
):
    """
    Decline a transaction.
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    
    # Only staff can decline transactions
    if not current_user.is_superuser and not current_user.is_staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to decline transactions",
        )
    
    try:
        transaction.decline(db)
    except AttributeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return format_transaction_for_frontend(transaction, db) 