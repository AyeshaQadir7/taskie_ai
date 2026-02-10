"""Unit tests for Task Due Dates & Deadlines feature (FEATURE 009)"""
import pytest
from datetime import datetime, date, timedelta, timezone
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool

from src.models import User, Task
from src.services import TaskService, compute_task_status, format_task_response
from src.schemas import TaskResponse


@pytest.fixture(name="session")
def session_fixture():
    """Create an in-memory SQLite database for testing"""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Create all tables
    from src.models import SQLModel
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


@pytest.fixture(name="user")
def user_fixture(session: Session) -> User:
    """Create a test user"""
    user = User(
        id="test-user-001",
        email="test@example.com",
        password_hash="hashed_password_here",
        name="Test User"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


class TestDueDateCreation:
    """Tests for creating tasks with due dates"""

    def test_create_task_with_due_date(self, session: Session, user: User):
        """Test creating a task with a due_date persists to database"""
        service = TaskService(session)
        due_date = date.today() + timedelta(days=5)

        task = service.create_task(
            user_id=user.id,
            title="Task with due date",
            description="Test task",
            priority="high",
            due_date=due_date
        )

        assert task.id is not None
        assert task.due_date == due_date
        assert task.user_id == user.id
        assert task.title == "Task with due date"

        # Verify persistence by querying database
        retrieved_task = service.get_task_by_id(task.id, user.id)
        assert retrieved_task is not None
        assert retrieved_task.due_date == due_date

    def test_create_task_without_due_date(self, session: Session, user: User):
        """Test creating a task without due_date stores NULL"""
        service = TaskService(session)

        task = service.create_task(
            user_id=user.id,
            title="Task without due date",
            priority="medium"
        )

        assert task.id is not None
        assert task.due_date is None
        assert task.user_id == user.id

    def test_create_task_with_past_due_date(self, session: Session, user: User):
        """Test creating task with past due date is allowed"""
        service = TaskService(session)
        past_date = date.today() - timedelta(days=10)

        task = service.create_task(
            user_id=user.id,
            title="Overdue task",
            due_date=past_date
        )

        assert task.due_date == past_date


class TestDueDateUpdate:
    """Tests for updating task due dates"""

    def test_update_task_add_due_date(self, session: Session, user: User):
        """Test adding due_date to existing task"""
        service = TaskService(session)

        # Create task without due date
        task = service.create_task(
            user_id=user.id,
            title="Task to update",
            priority="medium"
        )
        assert task.due_date is None

        # Add due date
        new_due_date = date.today() + timedelta(days=3)
        updated_task = service.update_task(
            task_id=task.id,
            user_id=user.id,
            due_date=new_due_date
        )

        assert updated_task is not None
        assert updated_task.due_date == new_due_date

        # Verify persistence
        retrieved = service.get_task_by_id(task.id, user.id)
        assert retrieved.due_date == new_due_date

    def test_update_task_change_due_date(self, session: Session, user: User):
        """Test changing an existing due_date"""
        service = TaskService(session)
        original_date = date.today() + timedelta(days=1)
        new_date = date.today() + timedelta(days=10)

        # Create task with due date
        task = service.create_task(
            user_id=user.id,
            title="Task with changeable due date",
            due_date=original_date
        )
        assert task.due_date == original_date

        # Update due date
        updated_task = service.update_task(
            task_id=task.id,
            user_id=user.id,
            due_date=new_date
        )

        assert updated_task.due_date == new_date

    def test_update_task_clear_due_date(self, session: Session, user: User):
        """Test clearing due_date by setting to NULL"""
        service = TaskService(session)
        due_date = date.today() + timedelta(days=5)

        # Create task with due date
        task = service.create_task(
            user_id=user.id,
            title="Task to clear due date",
            due_date=due_date
        )
        assert task.due_date == due_date

        # Clear due date using clear_due_date flag
        updated_task = service.update_task(
            task_id=task.id,
            user_id=user.id,
            clear_due_date=True
        )

        assert updated_task is not None
        assert updated_task.due_date is None

        # Verify persistence
        retrieved = service.get_task_by_id(task.id, user.id)
        assert retrieved.due_date is None


class TestDueDateStatusComputation:
    """Tests for computing due date status"""

    def test_compute_task_status_overdue(self):
        """Test is_overdue is True for past due dates"""
        past_date = date.today() - timedelta(days=5)
        task = Task(
            id=1,
            user_id="user1",
            title="Overdue task",
            due_date=past_date,
            status="incomplete"
        )

        status = compute_task_status(task)
        assert status["is_overdue"] is True
        assert status["is_due_today"] is False
        assert status["days_until_due"] == -5

    def test_compute_task_status_due_today(self):
        """Test is_due_today is True when due_date is today"""
        today = date.today()
        task = Task(
            id=1,
            user_id="user1",
            title="Due today task",
            due_date=today,
            status="incomplete"
        )

        status = compute_task_status(task)
        assert status["is_overdue"] is False
        assert status["is_due_today"] is True
        assert status["days_until_due"] == 0

    def test_compute_task_status_upcoming(self):
        """Test status for future due dates"""
        future_date = date.today() + timedelta(days=3)
        task = Task(
            id=1,
            user_id="user1",
            title="Upcoming task",
            due_date=future_date,
            status="incomplete"
        )

        status = compute_task_status(task)
        assert status["is_overdue"] is False
        assert status["is_due_today"] is False
        assert status["days_until_due"] == 3

    def test_compute_task_status_no_due_date(self):
        """Test status when task has no due_date"""
        task = Task(
            id=1,
            user_id="user1",
            title="Task without due date",
            due_date=None,
            status="incomplete"
        )

        status = compute_task_status(task)
        assert status["is_overdue"] is False
        assert status["is_due_today"] is False
        assert status["days_until_due"] is None


class TestTaskResponseFormatting:
    """Tests for TaskResponse formatting with computed fields"""

    def test_format_task_response_includes_all_fields(self):
        """Test that format_task_response includes all fields and computed status"""
        task = Task(
            id=1,
            user_id="user1",
            title="Test task",
            description="Test description",
            status="incomplete",
            priority="high",
            due_date=date.today() + timedelta(days=2),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        response = format_task_response(task)

        assert isinstance(response, TaskResponse)
        assert response.id == 1
        assert response.title == "Test task"
        assert response.due_date == task.due_date
        assert response.is_overdue is False
        assert response.is_due_today is False
        assert response.days_until_due == 2

    def test_format_task_response_overdue_indicator(self):
        """Test that overdue tasks have correct indicators"""
        task = Task(
            id=1,
            user_id="user1",
            title="Overdue task",
            status="incomplete",
            priority="medium",
            due_date=date.today() - timedelta(days=2),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        response = format_task_response(task)

        assert response.is_overdue is True
        assert response.is_due_today is False
        assert response.days_until_due == -2
