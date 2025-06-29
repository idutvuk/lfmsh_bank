from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionState

router = APIRouter()


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
    
    return [t.to_python(db) for t in transactions]


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
        update_of=update_of_id
    )
    
    return transaction.to_python(db)


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
    
    return transaction.to_python(db)


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
    
    return transaction.to_python(db)


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
    
    return transaction.to_python(db) 