from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger

from app.api.v1.deps import get_current_active_superuser, get_db
from app.models.user import User
from app.models.transaction import Transaction, TransactionRecipient
from app.core.constants import TransactionTypeEnum, States, DAILY_TAX_AMOUNT

router = APIRouter()


@router.post("/tax")
def apply_daily_tax(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Apply daily tax to all active users.
    Only superusers can invoke this endpoint.
    """
    logger.info(f"Applying daily tax: {DAILY_TAX_AMOUNT}@")
    
    # Get all active non-staff users (pioneers)
    users = db.query(User).filter(
        User.is_active == True,
        User.is_staff == False,
        User.is_superuser == False
    ).all()
    
    if not users:
        logger.warning("No active users found to apply tax")
        return {"message": "No active users found to apply tax"}
    
    # Create a new transaction for the daily tax
    transaction = Transaction.new_transaction(
        creator=current_user,
        transaction_type=TransactionTypeEnum.tax,
        description=f"Ежедневный налог",
        db=db
    )
    
    # Add all users as recipients with negative amount (tax)
    recipients_count = 0
    for user in users:
        recipient = TransactionRecipient(
            transaction_id=transaction.id,
            user_id=user.id,
            bucks=-DAILY_TAX_AMOUNT,
            description=f"Ежедневный налог"
        )
        db.add(recipient)
        recipients_count += 1
    
    # Process the transaction to apply the changes
    db.commit()
    transaction.process(db)
    
    logger.info(f"Daily tax applied to {recipients_count} users")
    
    return {
        "message": f"Daily tax of {DAILY_TAX_AMOUNT}@ applied to {recipients_count} users",
        "transaction_id": transaction.id
    }


@router.post("/equatorial_fine")
def apply_equatorial_fine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Apply equatorial fine (mid-term penalty) to all active users who haven't met requirements.
    Only superusers can invoke this endpoint.
    """
    logger.info("Calculating equatorial fines")
    
    # Get all active non-staff users (pioneers)
    users = db.query(User).filter(
        User.is_active == True,
        User.is_staff == False,
        User.is_superuser == False
    ).all()
    
    if not users:
        logger.warning("No active users found to check for equatorial fines")
        return {"message": "No active users found to check for equatorial fines"}
    
    # Create a new transaction for the equatorial fine
    transaction = Transaction.new_transaction(
        creator=current_user,
        transaction_type=TransactionTypeEnum.equatorial_fine,
        description="Экваториальный образовательный штраф",
        db=db
    )
    
    # Calculate and apply fine for each user
    recipients_count = 0
    total_fine = 0
    
    for user in users:
        # Calculate the equatorial fine for this user
        fine_amount = user.get_equator_study_fine(db)
        
        # Skip if no fine needed
        if fine_amount <= 0:
            continue
        
        # Add user as recipient with negative amount (fine)
        recipient = TransactionRecipient(
            transaction_id=transaction.id,
            user_id=user.id,
            bucks=-fine_amount,
            description=f"Экваториальный образовательный штраф ({fine_amount}@)"
        )
        db.add(recipient)
        recipients_count += 1
        total_fine += fine_amount
    
    # If no recipients (no fines to apply), delete the transaction
    if recipients_count == 0:
        db.delete(transaction)
        db.commit()
        logger.info("No equatorial fines needed, no transaction created")
        return {"message": "No equatorial fines needed"}
    
    # Process the transaction to apply the changes
    db.commit()
    transaction.process(db)
    
    logger.info(f"Equatorial fine applied to {recipients_count} users, total: {total_fine}@")
    
    return {
        "message": f"Equatorial fine applied to {recipients_count} users, total: {total_fine}@",
        "transaction_id": transaction.id
    }


@router.post("/final_fine")
def apply_final_fine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Apply final fine (end-term penalty) to all active users who haven't met requirements.
    Only superusers can invoke this endpoint.
    """
    logger.info("Calculating final fines")
    
    # Get all active non-staff users (pioneers)
    users = db.query(User).filter(
        User.is_active == True,
        User.is_staff == False,
        User.is_superuser == False
    ).all()
    
    if not users:
        logger.warning("No active users found to check for final fines")
        return {"message": "No active users found to check for final fines"}
    
    # Create a new transaction for the final fine
    transaction = Transaction.new_transaction(
        creator=current_user,
        transaction_type=TransactionTypeEnum.final_fine,
        description="Финальный образовательный штраф",
        db=db
    )
    
    # Calculate and apply fine for each user
    recipients_count = 0
    total_fine = 0
    
    for user in users:
        # Calculate the final fine for this user
        fine_amount = user.get_final_study_fine(db)
        
        # Skip if no fine needed
        if fine_amount <= 0:
            continue
        
        # Add user as recipient with negative amount (fine)
        recipient = TransactionRecipient(
            transaction_id=transaction.id,
            user_id=user.id,
            bucks=-fine_amount,
            description=f"Финальный образовательный штраф ({fine_amount}@)"
        )
        db.add(recipient)
        recipients_count += 1
        total_fine += fine_amount
    
    # If no recipients (no fines to apply), delete the transaction
    if recipients_count == 0:
        db.delete(transaction)
        db.commit()
        logger.info("No final fines needed, no transaction created")
        return {"message": "No final fines needed"}
    
    # Process the transaction to apply the changes
    db.commit()
    transaction.process(db)
    
    logger.info(f"Final fine applied to {recipients_count} users, total: {total_fine}@")
    
    return {
        "message": f"Final fine applied to {recipients_count} users, total: {total_fine}@",
        "transaction_id": transaction.id
    } 