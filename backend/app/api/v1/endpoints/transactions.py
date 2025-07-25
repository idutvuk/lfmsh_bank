from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger

from app.api.v1.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.transaction import Transaction, TransactionRecipient
from app.core.constants import TransactionTypeEnum, States

router = APIRouter()


def format_transaction_for_frontend(transaction: Transaction, db: Session) -> dict:
    """
    Formats a Transaction object to match the frontend expected schema
    """
    # Get all recipients for this transaction
    recipients = db.query(TransactionRecipient).filter(TransactionRecipient.transaction_id == transaction.id).all()
    
    # Group by receiver to create the receivers array
    receivers = {}
    
    # Process all recipients
    for recipient in recipients:
        user = db.query(User).filter(User.id == recipient.user_id).first()
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
        
        # Add all changes from this recipient
        receivers[username]["bucks"] += recipient.bucks
        receivers[username]["certs"] += recipient.certs
        receivers[username]["lab"] += recipient.lab
        receivers[username]["lec"] += recipient.lec
        receivers[username]["sem"] += recipient.sem
        receivers[username]["fac"] += recipient.fac
    
    # Format the transaction
    return {
        "id": transaction.id,
        "author": transaction.creator.username,
        "description": transaction.description,
        "type": transaction.type.value,
        "status": transaction.state.value,
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
        # Regular users can see transactions where they are creator OR recipient
        # Get transactions where user is creator
        creator_transactions = db.query(Transaction).filter(
            Transaction.creator_id == current_user.id
        ).all()
        
        # Get transactions where user is recipient
        recipient_transactions = db.query(Transaction).join(
            TransactionRecipient, Transaction.id == TransactionRecipient.transaction_id
        ).filter(
            TransactionRecipient.user_id == current_user.id
        ).all()
        
        # Combine and remove duplicates
        all_transactions = list(set(creator_transactions + recipient_transactions))
        # Sort by creation timestamp (newest first) and apply pagination
        all_transactions.sort(key=lambda t: t.creation_timestamp, reverse=True)
        transactions = all_transactions[skip:skip + limit]
    
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
    # Get the transaction type from enum
    try:
        transaction_type = TransactionTypeEnum(transaction_data["type_name"])
    except ValueError:
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
    
    # Get the transaction type from enum
    try:
        transaction_type = TransactionTypeEnum(type_name)
    except ValueError:
        logger.error(f"Transaction type {type_name} not found")
        # Check what types are available
        available_types = [t.value for t in TransactionTypeEnum]
        logger.info(f"Available types: {available_types}")
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction type {type_name} not found",
        )
    
    logger.info(f"Found transaction type: {transaction_type.value}")
    
    # Create the transaction
    try:
        logger.info("Attempting to create transaction")
        
        # Check if transaction states exist
        available_states = [s.value for s in States]
        logger.info(f"Available states: {available_states}")
        
        transaction = Transaction.new_transaction(
            creator=current_user,
            transaction_type=transaction_type,
            description=description or "",
            recipients=recipients,
            update_of=transaction_data.get("update_of"),
            db=db
        )
        
        # If the creator is staff/superuser, automatically process the transaction
        if current_user.is_staff or current_user.is_superuser:
            logger.info(f"Auto-processing transaction {transaction.id} for staff user {current_user.username}")
            transaction.process(db)
        
        # If this is an update transaction, decline/substitute the original
        update_of_id = transaction_data.get("update_of")
        if update_of_id:
            original_transaction = db.query(Transaction).filter(Transaction.id == update_of_id).first()
            if original_transaction:
                # If transaction is processed, substitute it; if created, decline it
                if original_transaction.state.value == "processed":
                    logger.info(f"Substituting processed transaction {update_of_id} with new transaction {transaction.id}")
                    original_transaction.substitute(db)
                elif original_transaction.state.value == "created":
                    logger.info(f"Declining created transaction {update_of_id} and creating replacement {transaction.id}")
                    original_transaction.decline(db)
                else:
                    logger.warning(f"Cannot replace transaction {update_of_id} in state {original_transaction.state.value}")
        
        logger.info(f"Successfully created transaction with ID: {transaction.id}")
        return format_transaction_for_frontend(transaction, db)
        
    except Exception as e:
        logger.error(f"Error creating transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating transaction: {str(e)}",
        )


@router.post("/seminar/")
def create_seminar(
    *,
    db: Session = Depends(get_db),
    seminar_data: dict,
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a seminar as two transactions:
    1. Award points to the speaker based on evaluation
    2. Mark attendance for all attendees
    """
    # Only staff can create seminars
    if not current_user.is_staff and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can conduct seminars",
        )
    
    logger.info(f"Creating seminar from {current_user.username}")
    logger.info(f"Seminar data: {seminar_data}")
    
    try:
        speaker_username = seminar_data.get("speaker")
        description = seminar_data.get("description", "")
        block = seminar_data.get("block", "")
        total_score = seminar_data.get("totalScore", 0)
        attendees = seminar_data.get("attendees", [])

        # Find speaker
        speaker = db.query(User).filter(User.username == speaker_username).first()
        if not speaker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Speaker {speaker_username} not found",
            )
        

        # Transaction 1: Award points to speaker for conducting seminar
        if total_score != 0:  # Only create transaction if there are points to award
            speaker_transaction = Transaction.new_transaction(
                creator=current_user,
                transaction_type=TransactionTypeEnum.seminar,
                description=description,
                recipients=[{
                    "username": speaker_username,
                    "amount": total_score
                }],
                db=db
            )
            
            # Auto-process the transaction since it's created by staff
            speaker_transaction.process(db)
            logger.info(f"Created speaker transaction {speaker_transaction.id} for {total_score} points")
        
        # Transaction 2: Mark seminar attendance for all attendees
        if attendees:
            # Create recipients for faculty attendance
            attendance_recipients = []
            for attendee_username in attendees:
                attendee = db.query(User).filter(User.username == attendee_username).first()
                if attendee:
                    attendance_recipients.append({
                        "username": attendee_username,
                        "amount": 0  # No bucks for attendance, just counter increment
                    })
            
            if attendance_recipients:
                attendance_transaction = Transaction.new_transaction(
                    creator=current_user,
                    transaction_type=TransactionTypeEnum.fac_attend,
                    description=f"Посещение семинара '{description}' (блок {block})",
                    recipients=attendance_recipients,
                    db=db
                )
                
                # Auto-process the attendance transaction
                attendance_transaction.process(db)
                logger.info(f"Created attendance transaction {attendance_transaction.id} for {len(attendees)} attendees")
        
        # Return success response
        response = {
            "success": True,
            "message": f"Семинар успешно проведен! Докладчик получил {total_score} баллов, {len(attendees)} участников отмечены.",
            "speaker_points": total_score,
            "attendees_count": len(attendees),
            "block": block,
            "description": description
        }
        
        logger.info(f"Seminar creation completed successfully")
        return response
        
    except Exception as e:
        logger.error(f"Error creating seminar: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating seminar: {str(e)}",
        )


@router.get("/types/")
def get_transaction_types():
    """
    Get available transaction types.
    """
    return [{"name": t.value, "readable_name": t.value.replace('_', ' ').capitalize()} 
            for t in TransactionTypeEnum]


@router.get("/states/")
def get_transaction_states():
    """
    Get available transaction states.
    """
    return [{"name": s.value, "readable_name": s.value.capitalize()} 
            for s in States]


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
        transaction.process(db)
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