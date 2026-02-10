# Quickstart: Implementing Task Due Dates & Deadlines

**Purpose**: Developer guide for implementing the Task Due Dates & Deadlines feature
**Date**: 2026-02-10

---

## Overview

This feature extends the existing Task model with due date support, enabling deadline tracking, overdue detection, and visual priority indicators. Implementation spans three layers:

1. **Database**: Add `due_date` column to `tasks` table
2. **Backend API**: Extend Task schemas and services to handle due_date; add sorting/filtering
3. **Frontend UI**: Add date picker, status labels, and sort/filter controls

---

## Database Layer

### Step 1: Create Alembic Migration

Run the migration to add the `due_date` column:

```bash
cd backend
alembic upgrade head
```

Or manually create migration:
```bash
alembic revision --autogenerate -m "add_due_date_to_tasks"
```

**Migration SQL**:
```sql
ALTER TABLE tasks ADD COLUMN due_date DATE NULL;
CREATE INDEX idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
```

### Step 2: Verify Schema

Connect to your Neon database and verify:

```sql
-- Check column was added
\d tasks
-- Expected output includes: due_date | date | null

-- Check index was created
\di idx_tasks_due_date
-- Expected output: idx_tasks_due_date (user_id, due_date) WHERE due_date IS NOT NULL
```

---

## Backend API Layer

### Step 1: Update Task Model

Edit `backend/src/models.py`:

```python
from datetime import date
from typing import Optional

class Task(SQLModel, table=True):
    """Task model - represents a single to-do item owned by a user"""
    __tablename__ = "tasks"

    # ... existing fields ...

    # NEW: Due Date Support
    due_date: Optional[date] = Field(default=None, index=True)
```

### Step 2: Update Pydantic Schemas

Edit `backend/src/schemas.py`:

```python
from datetime import date
from typing import Optional

class TaskCreate(SQLModel):
    """Request model for POST /api/{user_id}/tasks"""
    # ... existing fields ...
    due_date: Optional[date] = Field(
        default=None,
        description="Task due date in ISO 8601 format (optional, nullable)"
    )

class TaskUpdate(SQLModel):
    """Request model for PUT /api/{user_id}/tasks/{id}"""
    # ... existing fields ...
    due_date: Optional[date] = Field(
        default=None,
        description="Task due date in ISO 8601 format (optional, nullable, set to null to clear)"
    )

class TaskResponse(SQLModel):
    """Response model for all GET/POST/PUT/PATCH endpoints"""
    # ... existing fields ...
    due_date: Optional[date] = None
    is_overdue: bool = False  # Computed at runtime
    is_due_today: bool = False  # Computed at runtime
    days_until_due: Optional[int] = None  # Computed at runtime
```

### Step 3: Add Service Methods for Due Date Computation

Edit `backend/src/services.py`:

```python
from datetime import date, timedelta

def compute_task_status(task: Task) -> dict:
    """Compute due date status fields for a task"""
    today = date.today()

    is_overdue = False
    is_due_today = False
    days_until_due = None

    if task.due_date is not None:
        is_overdue = task.due_date < today
        is_due_today = task.due_date == today
        days_until_due = (task.due_date - today).days

    return {
        "is_overdue": is_overdue,
        "is_due_today": is_due_today,
        "days_until_due": days_until_due
    }

def format_task_response(task: Task) -> TaskResponse:
    """Convert Task model to TaskResponse with computed status fields"""
    status = compute_task_status(task)

    return TaskResponse(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        is_overdue=status["is_overdue"],
        is_due_today=status["is_due_today"],
        days_until_due=status["days_until_due"],
        created_at=task.created_at,
        updated_at=task.updated_at
    )
```

### Step 4: Update API Endpoints

Edit `backend/src/api/tasks.py`:

**GET /api/{user_id}/tasks** - Add sorting and filtering:

```python
from sqlalchemy import select, and_
from datetime import date

@app.get("/api/{user_id}/tasks")
async def list_tasks(
    user_id: str,
    sort: Optional[str] = None,  # "due_date" or "-due_date"
    filter: Optional[str] = None,  # "overdue", "due_today", or "upcoming"
):
    """List tasks with optional sorting by due_date and filtering by status"""

    today = date.today()
    query = select(Task).where(Task.user_id == user_id)

    # Apply filter
    if filter == "overdue":
        query = query.where(
            and_(Task.due_date.isnot(None), Task.due_date < today)
        )
    elif filter == "due_today":
        query = query.where(Task.due_date == today)
    elif filter == "upcoming":
        query = query.where(
            and_(Task.due_date.isnot(None), Task.due_date > today)
        )

    # Apply sort
    if sort == "due_date":
        query = query.order_by(Task.due_date.asc())
    elif sort == "-due_date":
        query = query.order_by(Task.due_date.desc())

    tasks = session.exec(query).all()
    return [format_task_response(task) for task in tasks]
```

**POST /api/{user_id}/tasks** - Accept due_date:

```python
@app.post("/api/{user_id}/tasks", response_model=TaskResponse)
async def create_task(user_id: str, task_create: TaskCreate):
    """Create a new task with optional due_date"""

    task = Task(
        user_id=user_id,
        title=task_create.title,
        description=task_create.description,
        priority=task_create.priority,
        due_date=task_create.due_date  # NEW: Include due_date
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return format_task_response(task)
```

**PUT /api/{user_id}/tasks/{id}** - Update due_date:

```python
@app.put("/api/{user_id}/tasks/{id}", response_model=TaskResponse)
async def update_task(user_id: str, id: int, task_update: TaskUpdate):
    """Update an existing task, including due_date"""

    task = session.get(Task, {"id": id, "user_id": user_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.priority is not None:
        task.priority = task_update.priority
    if "due_date" in task_update.dict():  # Allows setting to None
        task.due_date = task_update.due_date  # NEW: Update due_date

    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)
    return format_task_response(task)
```

---

## Frontend UI Layer

### Step 1: Add Due Date Picker to TaskForm

Edit `frontend/src/components/TaskForm.tsx`:

```tsx
import { useState } from 'react';

export function TaskForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');  // NEW: Due date state

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title,
      description,
      priority,
      due_date: dueDate || null  // NEW: Include due_date
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      {/* NEW: Due date picker */}
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        placeholder="Due date (optional)"
      />

      <button type="submit">Save Task</button>
    </form>
  );
}
```

### Step 2: Update TaskCard to Display Due Date Status

Edit `frontend/src/components/TaskCard.tsx`:

```tsx
export function TaskCard({ task, onDelete, onUpdate }) {
  const getDueStatusBadge = () => {
    if (!task.due_date) return null;

    if (task.is_overdue) {
      return <span className="badge badge-red">Overdue</span>;
    } else if (task.is_due_today) {
      return <span className="badge badge-orange">Due Today</span>;
    } else if (task.days_until_due !== null && task.days_until_due > 0) {
      return <span className="badge badge-gray">Due in {task.days_until_due} days</span>;
    }

    return null;
  };

  const getCardClassName = () => {
    const base = 'task-card';
    if (task.is_overdue) return `${base} overdue`;
    if (task.is_due_today) return `${base} due-today`;
    return base;
  };

  return (
    <div className={getCardClassName()}>
      <div className="task-header">
        <h3>{task.title}</h3>
        {getDueStatusBadge()}  {/* NEW: Display due status */}
      </div>

      {task.description && <p>{task.description}</p>}

      <div className="task-meta">
        <span className="priority">{task.priority}</span>
        {task.due_date && <span className="due-date">{task.due_date}</span>}  {/* NEW */}
      </div>

      <div className="task-actions">
        <button onClick={() => onUpdate(task)}>Edit</button>
        <button onClick={() => onDelete(task.id)}>Delete</button>
      </div>
    </div>
  );
}
```

### Step 3: Add Sort/Filter Controls to TaskList

Edit `frontend/src/components/TaskList.tsx`:

```tsx
import { useState, useEffect } from 'react';

export function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [sort, setSort] = useState('');  // NEW: Sort state
  const [filter, setFilter] = useState('');  // NEW: Filter state

  useEffect(() => {
    const fetchTasks = async () => {
      const params = new URLSearchParams();
      if (sort) params.append('sort', sort);
      if (filter) params.append('filter', filter);

      const response = await fetch(`/api/{user_id}/tasks?${params}`);
      const data = await response.json();
      setTasks(data);
    };

    fetchTasks();
  }, [sort, filter]);  // Refetch when sort/filter changes

  return (
    <div className="task-list-container">
      {/* NEW: Sort/Filter controls */}
      <div className="task-list-controls">
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort By</option>
          <option value="due_date">Due Date (Earliest First)</option>
          <option value="-due_date">Due Date (Latest First)</option>
        </select>

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Show All</option>
          <option value="overdue">Overdue Only</option>
          <option value="due_today">Due Today Only</option>
          <option value="upcoming">Upcoming Only</option>
        </select>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

---

## Testing

### Backend Tests

Create `backend/tests/test_due_dates.py`:

```python
import pytest
from datetime import date, timedelta
from src.models import Task
from src.schemas import TaskCreate, TaskResponse

def test_create_task_with_due_date(session, user_id):
    """Test creating a task with a due date"""
    task_data = TaskCreate(
        title="Test task",
        due_date=date.today() + timedelta(days=5)
    )

    task = Task(
        user_id=user_id,
        title=task_data.title,
        due_date=task_data.due_date
    )
    session.add(task)
    session.commit()

    assert task.due_date == date.today() + timedelta(days=5)

def test_compute_overdue_status():
    """Test overdue task detection"""
    task = Task(
        user_id="user1",
        title="Test",
        due_date=date.today() - timedelta(days=1)
    )

    status = compute_task_status(task)
    assert status["is_overdue"] is True
    assert status["is_due_today"] is False
    assert status["days_until_due"] == -1

def test_filter_overdue_tasks(session, user_id):
    """Test filtering overdue tasks"""
    today = date.today()

    # Create tasks with different due dates
    overdue = Task(user_id=user_id, title="Overdue", due_date=today - timedelta(days=1))
    due_today = Task(user_id=user_id, title="Today", due_date=today)
    upcoming = Task(user_id=user_id, title="Upcoming", due_date=today + timedelta(days=1))

    session.add_all([overdue, due_today, upcoming])
    session.commit()

    # Query overdue tasks
    query = select(Task).where(
        and_(Task.user_id == user_id, Task.due_date < today)
    )
    results = session.exec(query).all()

    assert len(results) == 1
    assert results[0].title == "Overdue"
```

### Frontend Tests (Jest)

Create `frontend/tests/TaskCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { TaskCard } from '../components/TaskCard';
import { isoDateString } from '../utils/dateUtils';

describe('TaskCard', () => {
  it('displays overdue badge for past due dates', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      due_date: isoDateString(new Date(Date.now() - 86400000)),  // Yesterday
      is_overdue: true,
      is_due_today: false,
      days_until_due: -1
    };

    render(<TaskCard task={task} />);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('displays Due Today badge for today', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      due_date: isoDateString(new Date()),
      is_overdue: false,
      is_due_today: true,
      days_until_due: 0
    };

    render(<TaskCard task={task} />);

    expect(screen.getByText('Due Today')).toBeInTheDocument();
  });
});
```

---

## Deployment Checklist

- [ ] Database migration applied to production
- [ ] Backend models and schemas updated
- [ ] API endpoints tested with due_date parameters
- [ ] Frontend components updated and styled
- [ ] Sort/filter controls tested
- [ ] Integration tests passing (end-to-end task creation with due date)
- [ ] Manual QA: Create task with due date → verify saved → verify sorting/filtering
- [ ] Manual QA: Verify due status displays correctly after date changes
- [ ] Documentation updated (API docs, user guide)
- [ ] Performance tested (ensure index helps with large task lists)

---

## Common Issues & Troubleshooting

**Issue**: Due date not persisting after update
- Check: TaskUpdate schema includes due_date field
- Check: API endpoint properly handles due_date in request body
- Check: Database migration was applied successfully

**Issue**: Sorting by due date is slow
- Check: Index `idx_tasks_due_date` exists and is being used
- Run: `EXPLAIN ANALYZE SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date` to verify index usage

**Issue**: Due status not updating after midnight
- Expected behavior: Status is computed at query time, so new requests after midnight will reflect updated status
- No action needed; this is correct behavior

---

## Next Steps

1. Run database migration
2. Update backend models and API
3. Update frontend components
4. Run tests
5. Deploy to staging
6. Manual QA and user acceptance testing
7. Deploy to production
