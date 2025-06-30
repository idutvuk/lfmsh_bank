from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.deps import get_current_active_user, get_db
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=Dict[str, float])
def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get system statistics like average and total balance.
    Only staff and superusers can access this endpoint.
    """
    # Check if user has permission to view statistics
    if not current_user.is_staff and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access statistics",
        )
    
    # Get active non-staff users (students)
    student_query = db.query(User).filter(
        User.is_active == True,
        User.is_staff == False,
        User.is_superuser == False
    )
    
    # Count students
    student_count = student_query.count()
    
    if student_count == 0:
        # Return zeros if no students
        return {
            "avg_balance": 0.0,
            "total_balance": 0.0
        }
    
    # Calculate total balance
    total_balance = db.query(func.sum(User.balance)).filter(
        User.is_active == True,
        User.is_staff == False,
        User.is_superuser == False
    ).scalar() or 0.0
    
    # Calculate average balance
    avg_balance = total_balance / student_count
    
    # Format the results
    # Round to 2 decimal places
    total_balance = round(total_balance, 2)
    avg_balance = round(avg_balance, 2)
    
    return {
        "avg_balance": avg_balance,
        "total_balance": total_balance
    } 