"""Add due_date column to tasks table

Revision ID: 2026020a001
Revises: 188b5c7ebea7
Create Date: 2026-02-10 18:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2026020a001'
down_revision: Union[str, None] = '188b5c7ebea7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add due_date column to tasks table with index for efficient queries"""
    # Add due_date column as nullable DATE type
    op.add_column('tasks', sa.Column('due_date', sa.Date(), nullable=True))

    # Create composite index on (user_id, due_date) for efficient filtering and sorting
    # Using a partial index (WHERE due_date IS NOT NULL) to optimize for sparse data
    op.create_index(
        'idx_tasks_user_id_due_date',
        'tasks',
        ['user_id', 'due_date'],
        postgresql_where=sa.text('due_date IS NOT NULL')
    )


def downgrade() -> None:
    """Remove due_date column and index from tasks table"""
    # Drop index first
    op.drop_index('idx_tasks_user_id_due_date', table_name='tasks')

    # Drop column
    op.drop_column('tasks', 'due_date')
