"""Integration tests for Task Due Dates & Deadlines API endpoints (FEATURE 009)"""
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

from main import app
from src.database import get_session
from src.models import User, Task
from src.services import TaskService


@pytest.fixture(name="session")
def session_fixture():
    """Create an in-memory SQLite database for testing"""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with mocked database session"""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override

    # Mock the authentication dependency
    from src.auth.jwt_deps import verify_path_user_id
    from src.auth.auth_context import AuthenticatedUser

    def verify_path_user_id_override(user_id: str):
        return AuthenticatedUser(user_id=user_id, email=f"{user_id}@example.com")

    app.dependency_overrides[verify_path_user_id] = verify_path_user_id_override

    client = TestClient(app)
    yield client

    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture(name="user")
def user_fixture(session: Session) -> User:
    """Create a test user"""
    user = User(
        id="test-user-001",
        email="test@example.com",
        password_hash="hashed_password",
        name="Test User"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


class TestCreateTaskWithDueDate:
    """Tests for creating tasks via API with due dates"""

    def test_post_create_task_with_due_date_returns_201(self, client: TestClient, user: User):
        """Test POST /api/{user_id}/tasks with due_date returns 201 with due_date in response"""
        due_date = date.today() + timedelta(days=5)

        response = client.post(
            f"/api/{user.id}/tasks",
            json={
                "title": "Task with due date",
                "description": "Test task",
                "priority": "high",
                "due_date": due_date.isoformat()
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Task with due date"
        assert data["due_date"] == due_date.isoformat()
        assert data["is_overdue"] is False
        assert data["is_due_today"] is False
        assert data["days_until_due"] == 5

    def test_post_create_task_without_due_date(self, client: TestClient, user: User):
        """Test creating task without due_date returns null for due_date"""
        response = client.post(
            f"/api/{user.id}/tasks",
            json={
                "title": "Task without due date",
                "priority": "medium"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["due_date"] is None
        assert data["is_overdue"] is False
        assert data["is_due_today"] is False
        assert data["days_until_due"] is None

    def test_post_create_overdue_task(self, client: TestClient, user: User):
        """Test creating task with past due date immediately marks as overdue"""
        past_date = date.today() - timedelta(days=3)

        response = client.post(
            f"/api/{user.id}/tasks",
            json={
                "title": "Already overdue task",
                "due_date": past_date.isoformat()
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["due_date"] == past_date.isoformat()
        assert data["is_overdue"] is True
        assert data["days_until_due"] == -3


class TestUpdateTaskDueDate:
    """Tests for updating task due dates via API"""

    @pytest.fixture
    def task_with_due_date(self, session: Session, user: User) -> Task:
        """Create a task with initial due date"""
        service = TaskService(session)
        return service.create_task(
            user_id=user.id,
            title="Task to update",
            due_date=date.today() + timedelta(days=1)
        )

    def test_put_update_task_due_date_returns_200(self, client: TestClient, user: User, task_with_due_date: Task):
        """Test PUT /api/{user_id}/tasks/{id} with due_date updates and returns 200"""
        new_due_date = date.today() + timedelta(days=10)

        response = client.put(
            f"/api/{user.id}/tasks/{task_with_due_date.id}",
            json={
                "due_date": new_due_date.isoformat()
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["due_date"] == new_due_date.isoformat()
        assert data["days_until_due"] == 10

    def test_put_clear_due_date_by_setting_null(self, client: TestClient, user: User, task_with_due_date: Task):
        """Test PUT with due_date=null clears the due date"""
        response = client.put(
            f"/api/{user.id}/tasks/{task_with_due_date.id}",
            json={
                "due_date": None
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["due_date"] is None
        assert data["is_overdue"] is False
        assert data["is_due_today"] is False
        assert data["days_until_due"] is None

    def test_put_update_other_field_preserves_due_date(self, client: TestClient, user: User, task_with_due_date: Task):
        """Test updating other fields preserves existing due_date"""
        original_due_date = task_with_due_date.due_date

        response = client.put(
            f"/api/{user.id}/tasks/{task_with_due_date.id}",
            json={
                "title": "Updated title"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated title"
        assert data["due_date"] == original_due_date.isoformat()


class TestGetTasksWithDueDate:
    """Tests for retrieving tasks with due date status via API"""

    @pytest.fixture
    def tasks_with_various_dates(self, session: Session, user: User):
        """Create multiple tasks with different due dates"""
        service = TaskService(session)
        overdue = service.create_task(
            user_id=user.id,
            title="Overdue task",
            due_date=date.today() - timedelta(days=2)
        )
        due_today = service.create_task(
            user_id=user.id,
            title="Due today task",
            due_date=date.today()
        )
        upcoming = service.create_task(
            user_id=user.id,
            title="Upcoming task",
            due_date=date.today() + timedelta(days=3)
        )
        no_date = service.create_task(
            user_id=user.id,
            title="No due date task"
        )
        return [overdue, due_today, upcoming, no_date]

    def test_get_task_returns_due_date_and_status(self, client: TestClient, user: User, tasks_with_various_dates):
        """Test GET /api/{user_id}/tasks/{id} returns due_date and status fields"""
        task = tasks_with_various_dates[0]  # overdue task

        response = client.get(f"/api/{user.id}/tasks/{task.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task.id
        assert data["due_date"] is not None
        assert data["is_overdue"] is True
        assert data["is_due_today"] is False
        assert data["days_until_due"] == -2

    def test_get_all_tasks_includes_due_date_status(self, client: TestClient, user: User, tasks_with_various_dates):
        """Test GET /api/{user_id}/tasks returns all tasks with due_date and status fields"""
        response = client.get(f"/api/{user.id}/tasks")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4

        # Check that all tasks have required fields
        for task in data:
            assert "due_date" in task
            assert "is_overdue" in task
            assert "is_due_today" in task
            assert "days_until_due" in task

        # Verify status values
        overdue_tasks = [t for t in data if t["is_overdue"]]
        due_today_tasks = [t for t in data if t["is_due_today"]]
        upcoming_tasks = [t for t in data if t["due_date"] and not t["is_overdue"] and not t["is_due_today"]]
        no_date_tasks = [t for t in data if t["due_date"] is None]

        assert len(overdue_tasks) == 1
        assert len(due_today_tasks) == 1
        assert len(upcoming_tasks) == 1
        assert len(no_date_tasks) == 1


class TestSortTasksByDueDate:
    """Tests for sorting tasks by due date via API"""

    @pytest.fixture
    def tasks_for_sorting(self, session: Session, user: User):
        """Create multiple tasks with different due dates for sorting tests"""
        service = TaskService(session)
        # Create tasks with intentionally mixed dates
        task1 = service.create_task(
            user_id=user.id,
            title="Task due in 5 days",
            due_date=date.today() + timedelta(days=5)
        )
        task2 = service.create_task(
            user_id=user.id,
            title="Task due in 2 days",
            due_date=date.today() + timedelta(days=2)
        )
        task3 = service.create_task(
            user_id=user.id,
            title="Task with no due date",
            due_date=None
        )
        task4 = service.create_task(
            user_id=user.id,
            title="Task due in 10 days",
            due_date=date.today() + timedelta(days=10)
        )
        task5 = service.create_task(
            user_id=user.id,
            title="Task due tomorrow",
            due_date=date.today() + timedelta(days=1)
        )
        return [task1, task2, task3, task4, task5]

    def test_sort_tasks_by_due_date_ascending(self, client: TestClient, user: User, tasks_for_sorting):
        """Test GET /api/{user_id}/tasks?sort=due_date sorts by earliest due date first, nulls last"""
        response = client.get(f"/api/{user.id}/tasks?sort=due_date")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5

        # Expected order: due tomorrow (1d), due in 2 days, due in 5 days, due in 10 days, no due date
        expected_order = [
            "Task due tomorrow",
            "Task due in 2 days",
            "Task due in 5 days",
            "Task due in 10 days",
            "Task with no due date"
        ]

        actual_order = [task["title"] for task in data]
        assert actual_order == expected_order

        # Verify null due_date is at the end
        assert data[-1]["due_date"] is None
        assert all(task["due_date"] is not None for task in data[:-1])

    def test_sort_tasks_by_due_date_descending(self, client: TestClient, user: User, tasks_for_sorting):
        """Test GET /api/{user_id}/tasks?sort=-due_date sorts by latest due date first, nulls last"""
        response = client.get(f"/api/{user.id}/tasks?sort=-due_date")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5

        # Expected order: due in 10 days, due in 5 days, due in 2 days, due tomorrow, no due date
        expected_order = [
            "Task due in 10 days",
            "Task due in 5 days",
            "Task due in 2 days",
            "Task due tomorrow",
            "Task with no due date"
        ]

        actual_order = [task["title"] for task in data]
        assert actual_order == expected_order

        # Verify null due_date is at the end
        assert data[-1]["due_date"] is None
        assert all(task["due_date"] is not None for task in data[:-1])
