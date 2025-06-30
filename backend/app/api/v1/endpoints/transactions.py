from typing import Any, List, Optional
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionState
from app.models.money import Money
from app.models.attendance import Attendance

router = APIRouter()
logger = logging.getLogger(__name__)


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
        "description": transaction.creation_map,
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
        creation_map=transaction_data["creation_map"],
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
    type_name = transaction_data.get("type")
    description = transaction_data.get("description")
    recipients = transaction_data.get("recipients", [])
    
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
    
    # Format the creation map
    creation_map = {
        "description": description,
        "recipients": recipients
    }
    
    # Create the transaction
    try:
        logger.info("Attempting to create transaction")
        
        # Check if transaction states exist
        states = db.query(TransactionState).all()
        logger.info(f"Available states: {[s.name for s in states]}")
        
        # Check specifically for 'created' state
        created_state = db.query(TransactionState).filter(
            TransactionState.name == 'created'
        ).first()
        logger.info(f"Created state found: {created_state is not None}")
        
        # Create the transaction
        transaction = Transaction.new_transaction(
            creator=current_user,
            transaction_type=transaction_type,
            creation_map=creation_map,
            db=db  # Pass the existing session
        )
        
        # Process atomic transactions for each recipient
        for recipient_data in recipients:
            recipient_id = recipient_data.get("id")
            amount = recipient_data.get("amount", 0)
            
            recipient = db.query(User).filter(User.id == recipient_id).first()
            if not recipient:
                logger.warning(f"Recipient with ID {recipient_id} not found")
                continue
                
            # Create money atomic transaction if amount is non-zero
            if amount != 0:
                # Find appropriate money type
                from app.core.constants import MoneyTypeEnum
                money_type_name = MoneyTypeEnum[type_name].value if type_name in MoneyTypeEnum.__members__ else MoneyTypeEnum.general.value
                money_type = db.query(TransactionType).filter(TransactionType.name == money_type_name).first()
                
                if not money_type:
                    logger.warning(f"Money type {money_type_name} not found")
                    continue
                
                # Create money atomic
                from app.models.money import Money
                money = Money(
                    receiver_id=recipient_id,
                    related_transaction_id=transaction.id,
                    type_id=money_type.id,
                    value=amount,
                    counted=False
                )
                db.add(money)
                
            # Handle attendance counters based on transaction type
            if type_name in ["fac_attend", "sem_attend", "lab_pass", "lecture_attend"]:
                # Find corresponding attendance type
                from app.core.constants import AttendanceTypeEnum
                attendance_type_name = AttendanceTypeEnum[type_name].value if type_name in AttendanceTypeEnum.__members__ else None
                
                if attendance_type_name:
                    attendance_type = db.query(TransactionType).filter(TransactionType.name == attendance_type_name).first()
                    if attendance_type:
                        # Create attendance atomic
                        from app.models.attendance import Attendance
                        attendance = Attendance(
                            receiver_id=recipient_id,
                            related_transaction_id=transaction.id,
                            type_id=attendance_type.id,
                            counted=False
                        )
                        db.add(attendance)
        
        # Commit all changes
        db.commit()
        
        logger.info(f"Transaction created successfully with ID: {transaction.id}")
        return format_transaction_for_frontend(transaction, db)
    except ValueError as e:
        logger.error(f"Error creating transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
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