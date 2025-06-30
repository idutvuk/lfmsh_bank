"""Add description column and remove creation_map from transactions

Revision ID: 9debf2577c4d
Revises: ffcfe72df5f5
Create Date: 2025-06-30 21:50:18.375820

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9debf2577c4d'
down_revision: Union[str, Sequence[str], None] = 'ffcfe72df5f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
