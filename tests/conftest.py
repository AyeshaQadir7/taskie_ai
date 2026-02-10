"""
Pytest configuration and fixtures for Spec 008 chat interface testing

Provides:
- Test database with SQLite for isolation
- FastAPI test client
- Authentication fixtures (JWT tokens)
- Chat endpoint fixtures (users, conversations, messages)
- Database cleanup between tests
"""

import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

# Set test environment
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["BETTER_AUTH_SECRET"] = "test-secret-key-minimum-32-characters-required"
os.environ["DEBUG"] = "true"

# Add backend directory to path for imports
import sys
from pathlib import Path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from main import app
from src.database import get_session
from src.models import User, Task, Conversation, Message, ToolCall
from src.auth.jwt_utils import create_access_token


@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    """Create test database session with in-memory SQLite"""
    # Create in-memory SQLite engine
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    SQLModel.metadata.create_all(engine)

    # Create session
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    """Create FastAPI test client with test database"""

    def get_session_override():
        return session

    # Override dependency
    app.dependency_overrides[get_session] = get_session_override

    client = TestClient(app)
    yield client

    # Clear overrides
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session) -> User:
    """Create a test user"""
    user = User(
        id="test-user-123",
        email="test@example.com",
        password_hash="hashed_password_placeholder",
        name="Test User",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="test_user_token")
def test_user_token_fixture(test_user: User) -> str:
    """Create a JWT token for test user"""
    return create_access_token(user_id=test_user.id, email=test_user.email)


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(test_user_token: str) -> dict:
    """Create authorization headers for test requests"""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture(name="test_conversation")
def test_conversation_fixture(session: Session, test_user: User) -> Conversation:
    """Create a test conversation"""
    conversation = Conversation(
        id="conv-test-123",
        user_id=test_user.id,
        title="Test Conversation",
    )
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


@pytest.fixture(name="test_message")
def test_message_fixture(session: Session, test_conversation: Conversation) -> Message:
    """Create a test message"""
    message = Message(
        conversation_id=test_conversation.id,
        role="user",
        content="Hello, how are you?",
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


@pytest.fixture(name="test_tool_call")
def test_tool_call_fixture(session: Session, test_message: Message) -> ToolCall:
    """Create a test tool call"""
    tool_call = ToolCall(
        message_id=test_message.id,
        tool_name="test_tool",
        parameters={"param1": "value1"},
        result={"success": True},
    )
    session.add(tool_call)
    session.commit()
    session.refresh(tool_call)
    return tool_call


@pytest.fixture(autouse=True)
def cleanup():
    """Clean up after each test"""
    yield
    # Cleanup happens automatically with in-memory SQLite


# Chat-specific test fixtures
@pytest.fixture(name="chat_request_payload")
def chat_request_payload_fixture() -> dict:
    """Create a sample chat request payload"""
    return {
        "message": "Hello, what's the weather like?",
        "conversation_id": None,  # For new conversation
    }


@pytest.fixture(name="chat_request_with_conversation")
def chat_request_with_conversation_fixture(test_conversation: Conversation) -> dict:
    """Create a chat request payload with existing conversation"""
    return {
        "message": "Follow-up question",
        "conversation_id": test_conversation.id,
    }


# Utility functions
def create_auth_headers(token: str) -> dict:
    """Helper to create auth headers from token"""
    return {"Authorization": f"Bearer {token}"}


def create_test_user(session: Session, user_id: str = None) -> User:
    """Helper to create a test user"""
    user = User(
        id=user_id or f"test-{os.urandom(4).hex()}",
        email=f"test-{os.urandom(4).hex()}@example.com",
        password_hash="hashed_password_placeholder",
        name="Test User",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_test_conversation(
    session: Session, user_id: str, conversation_id: str = None
) -> Conversation:
    """Helper to create a test conversation"""
    conversation = Conversation(
        id=conversation_id or f"conv-{os.urandom(4).hex()}",
        user_id=user_id,
        title="Test Conversation",
    )
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation
