# Data Model: Task Due Dates & Deadlines

**Purpose**: Phase 1 data model for Task Due Dates & Deadlines feature
**Date**: 2026-02-10
**Status**: Complete

## Overview

This document defines the extended Task entity with due date support. The model extends the existing Task table with a single new column (`due_date`) and associated indexes. All other entities (User, Conversation, Message, ToolCall) remain unchanged.

---

## Task Entity (Extended)

### Entity Definition

```
Task
├── Existing Fields
│   ├── id: int (PRIMARY KEY, auto-increment)
│   ├── user_id: str (FOREIGN KEY → users.id, indexed)
│   ├── title: str (max 255 chars, required)
│   ├── description: str (max 5000 chars, nullable)
│   ├── status: str (enum: incomplete | complete, default: incomplete)
│   ├── priority: str (enum: low | medium | high, default: medium)
│   ├── created_at: datetime UTC (auto-set to current time on insert)
│   └── updated_at: datetime UTC (auto-set to current time on insert/update)
│
└── New Fields
    └── due_date: date (nullable, no default value)
```

### Attributes

| Field | Type | Nullable | Default | Index | Description |
|-------|------|----------|---------|-------|-------------|
| id | INTEGER | No | AUTO_INCREMENT | PK | Unique task identifier |
| user_id | VARCHAR | No | — | FK, IX | Owner of the task (references users.id) |
| title | VARCHAR(255) | No | — | — | Task name/title |
| description | VARCHAR(5000) | Yes | NULL | — | Extended task description |
| status | VARCHAR | No | "incomplete" | — | Task completion status (incomplete\|complete) |
| priority | VARCHAR | No | "medium" | — | Task priority level (low\|medium\|high) |
| due_date | DATE | Yes | NULL | IX | Due date for task (NEW FIELD) |
| created_at | TIMESTAMP (UTC) | No | NOW() | — | Task creation timestamp |
| updated_at | TIMESTAMP (UTC) | No | NOW() | — | Last modification timestamp |

### Indexes

**Primary Index (unchanged)**:
- PRIMARY KEY (id)

**Foreign Key Index (unchanged)**:
- FOREIGN KEY (user_id) REFERENCES users(id)

**New Index for Due Date Queries** (NEW):
```sql
CREATE INDEX idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
```

This composite index enables efficient queries for:
- `SELECT * FROM tasks WHERE user_id = ? AND due_date < ? ORDER BY due_date` (overdue tasks)
- `SELECT * FROM tasks WHERE user_id = ? AND due_date = ? ORDER BY created_at DESC` (due today, sorted by recency)
- `SELECT * FROM tasks WHERE user_id = ? AND due_date > ? ORDER BY due_date` (upcoming tasks)

The `WHERE due_date IS NOT NULL` clause optimizes for the common case where most tasks don't have due dates (sparse index).

---

## Computed Fields (Not Stored)

These fields are derived at runtime from `due_date` and the current date. They are NOT stored in the database but returned in API responses for convenience.

### is_overdue: boolean

**Definition**: Task is overdue if it has a due_date and due_date is in the past.

**Computation**:
```python
is_overdue = due_date is not None and due_date < date.today()
```

**Use Case**: UI displays "Overdue" label and red highlighting for overdue tasks.

### is_due_today: boolean

**Definition**: Task is due today if due_date equals today's date.

**Computation**:
```python
is_due_today = due_date is not None and due_date == date.today()
```

**Use Case**: UI displays "Due Today" label and orange highlighting.

### days_until_due: integer or null

**Definition**: Number of days from today until the task's due date.

**Computation**:
```python
if due_date is None:
    days_until_due = None
else:
    days_until_due = (due_date - date.today()).days
```

**Use Case**: UI displays "Due in X days" for upcoming tasks.

---

## SQLModel Definition

**Python Code** (`backend/src/models.py`):

```python
from datetime import datetime, timezone, date
from typing import Optional
from sqlmodel import SQLModel, Field

class Task(SQLModel, table=True):
    """Task model - represents a single to-do item owned by a user"""
    __tablename__ = "tasks"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Key
    user_id: str = Field(foreign_key="users.id", index=True)

    # Content
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)

    # State
    status: str = Field(default="incomplete")  # Enum: incomplete | complete
    priority: str = Field(default="medium")  # Enum: low | medium | high

    # NEW: Due Date Support
    due_date: Optional[date] = Field(default=None, index=True)

    # Timestamps (UTC)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
```

---

## Pydantic Schemas (API Request/Response)

**Request Schemas** (`backend/src/schemas.py`):

```python
from datetime import date
from typing import Optional
from sqlmodel import SQLModel
from pydantic import Field

class TaskCreate(SQLModel):
    """Request model for POST /api/{user_id}/tasks"""
    title: str = Field(
        min_length=1,
        max_length=255,
        description="Task title (required)"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=5000,
        description="Extended task description (optional)"
    )
    priority: Optional[str] = Field(
        default="medium",
        description="Task priority level: low, medium, or high (optional, defaults to medium)"
    )
    # NEW: Due date support
    due_date: Optional[date] = Field(
        default=None,
        description="Task due date in ISO 8601 format (optional, nullable)"
    )

class TaskUpdate(SQLModel):
    """Request model for PUT /api/{user_id}/tasks/{id}"""
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
        description="Task title (optional)"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=5000,
        description="Extended task description (optional)"
    )
    priority: Optional[str] = Field(
        default=None,
        description="Task priority level: low, medium, or high (optional)"
    )
    # NEW: Due date support
    due_date: Optional[date] = Field(
        default=None,
        description="Task due date in ISO 8601 format (optional, nullable, set to null to clear)"
    )

class TaskResponse(SQLModel):
    """Response model for all GET/POST/PUT/PATCH endpoints"""
    id: int
    user_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    # NEW: Due date support
    due_date: Optional[date] = None
    is_overdue: bool = False  # Computed at runtime
    is_due_today: bool = False  # Computed at runtime
    days_until_due: Optional[int] = None  # Computed at runtime
    created_at: datetime
    updated_at: datetime
```

---

## Database Migration (Alembic)

**File**: `alembic/versions/XXXXXX_add_due_date_to_tasks.py`

```python
"""Add due_date column to tasks table"""
from alembic import op
import sqlalchemy as sa

# Revision identifiers used by Alembic
revision = 'xxxxxxxxxx'
down_revision = 'yyyyyyyyyy'  # Previous migration ID
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add due_date column as nullable DATE type
    op.add_column(
        'tasks',
        sa.Column('due_date', sa.Date(), nullable=True)
    )

    # Create composite index for efficient due date queries
    op.create_index(
        'idx_tasks_due_date',
        'tasks',
        ['user_id', 'due_date'],
        postgresql_where=sa.text('due_date IS NOT NULL')
    )

def downgrade() -> None:
    # Drop index first
    op.drop_index('idx_tasks_due_date', table_name='tasks')

    # Remove column
    op.drop_column('tasks', 'due_date')
```

---

## Data Validation Rules

### due_date Validation

**Constraint**: None (task can have due_date in past, present, or future)

**Rationale**: Users should be able to create tasks retroactively (existing tasks with past due dates become immediately overdue). Prevents artificial restrictions on date entry.

**Validation in Pydantic** (optional, for user experience):

```python
from pydantic import field_validator
from datetime import date

class TaskCreate(SQLModel):
    # ... other fields ...
    due_date: Optional[date] = None

    @field_validator('due_date', mode='before')
    @classmethod
    def validate_due_date(cls, v):
        if v is None:
            return None

        # Accept any valid date (past, present, future)
        # Future enhancement could add warnings for past dates
        if not isinstance(v, date):
            raise ValueError("due_date must be a valid date in ISO 8601 format")

        return v
```

---

## User Ownership & Isolation

**Enforcement**: All queries must include `WHERE user_id = $authenticated_user_id`.

**Impact on Due Date Features**:
- Filter/sort queries: `SELECT * FROM tasks WHERE user_id = ? AND due_date < ? ORDER BY due_date`
- Cannot view/modify due dates on other users' tasks
- Supports multi-user SaaS model with strict data isolation

---

## Backward Compatibility

**Existing Tasks**: All existing tasks have `due_date = NULL`. No data transformation required.

**Existing Queries**: Queries that don't reference `due_date` continue to work unchanged.

**API Changes**: `due_date` and computed fields are optional in responses; clients that don't use them are unaffected.

---

## Future Extensions

**Potential enhancements** (out of scope for MVP):

1. **Time component**: Extend to TIMESTAMP WITH TIME ZONE and add per-user timezone configuration
2. **Recurring due dates**: Add recurrence pattern support (e.g., "every Monday")
3. **Due date reminders**: Add notification system to alert users 1 day before/on due date
4. **Due date history**: Track changes to due_date over time
5. **Calendar view**: Display tasks in calendar UI organized by due_date

None of these require schema changes beyond what's already defined.

---

## Implementation Checklist

- [ ] Update Task model in `backend/src/models.py`
- [ ] Update TaskCreate, TaskUpdate, TaskResponse in `backend/src/schemas.py`
- [ ] Create Alembic migration
- [ ] Update task service methods to compute is_overdue, is_due_today, days_until_due
- [ ] Update API endpoints to support sort/filter query parameters
- [ ] Add database index migration
- [ ] Update frontend TaskForm component with date picker
- [ ] Update frontend TaskCard component with status display
- [ ] Update frontend TaskList component with sort/filter controls
- [ ] Add unit tests for due date validation
- [ ] Add integration tests for API endpoints with due dates
