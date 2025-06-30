"""Add description column and remove creation_map from transactions

Revision ID: ffcfe72df5f5
Revises: 
Create Date: 2025-06-30 21:50:17.349258

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ffcfe72df5f5'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add description column to transactions table
    op.add_column('transactions', sa.Column('description', sa.String(length=1000), nullable=True))
    
    # Remove creation_map column from transactions table
    op.drop_column('transactions', 'creation_map')
    
    # Add count column to attendance table
    op.add_column('attendance', sa.Column('count', sa.Integer(), nullable=True, server_default='1'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove count column from attendance table
    op.drop_column('attendance', 'count')
    
    # Add back creation_map column to transactions table
    op.add_column('transactions', sa.Column('creation_map', sa.String(length=262143), nullable=True))
    
    # Remove description column from transactions table
    op.drop_column('transactions', 'description')
