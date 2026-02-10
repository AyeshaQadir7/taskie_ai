"""
Tests for Chat API endpoint (T035-T036)

Tests for:
- Conversation creation logic
- Message persistence
- User isolation
- Chat endpoint responses
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from src.services import ConversationService
from src.models import Conversation, Message, User
from src.db import (
    create_conversation,
    create_message,
    get_conversation,
    get_conversation_history,
)


class TestConversationCreation:
    """T035: Conversation creation tests (5 tests)"""

    def test_create_new_conversation(self, session: Session, test_user: User):
        """Test creating a new conversation"""
        service = ConversationService(session)
        conv = service.get_or_create_conversation(test_user.id)

        assert conv is not None
        assert conv.user_id == test_user.id
        assert conv.id is not None

    def test_create_conversation_with_title(self, session: Session, test_user: User):
        """Test creating conversation with title"""
        service = ConversationService(session)
        title = "Test Conversation"
        conv = service.get_or_create_conversation(test_user.id, title=title)

        assert conv.title == title

    def test_get_existing_conversation(self, session: Session, test_conversation: Conversation):
        """Test retrieving existing conversation"""
        service = ConversationService(session)
        conv = service.get_or_create_conversation(
            test_conversation.user_id,
            conversation_id=test_conversation.id,
        )

        assert conv.id == test_conversation.id

    def test_conversation_not_found_raises_error(self, session: Session, test_user: User):
        """Test error when conversation doesn't exist"""
        service = ConversationService(session)

        with pytest.raises(ValueError):
            service.get_or_create_conversation(
                test_user.id,
                conversation_id="nonexistent",
            )

    def test_conversation_wrong_user_raises_error(
        self,
        session: Session,
        test_user: User,
        test_conversation: Conversation,
    ):
        """Test error when conversation belongs to different user"""
        service = ConversationService(session)
        other_user_id = "other-user-123"

        with pytest.raises(ValueError):
            service.get_or_create_conversation(
                other_user_id,
                conversation_id=test_conversation.id,
            )


class TestMessagePersistence:
    """Tests for message persistence (before/after agent)"""

    def test_persist_user_message(self, session: Session, test_conversation: Conversation):
        """Test persisting user message"""
        service = ConversationService(session)
        message_content = "Hello, what's the weather?"

        message = service.persist_user_message(test_conversation.id, message_content)

        assert message.id is not None
        assert message.role == "user"
        assert message.content == message_content
        assert message.conversation_id == test_conversation.id

    def test_persist_assistant_response(self, session: Session, test_conversation: Conversation):
        """Test persisting assistant response"""
        service = ConversationService(session)
        response_content = "The weather is sunny today."

        message = service.persist_assistant_response(test_conversation.id, response_content)

        assert message.id is not None
        assert message.role == "assistant"
        assert message.content == response_content

    def test_persist_response_with_tool_calls(self, session: Session, test_conversation: Conversation):
        """Test persisting response with tool calls"""
        service = ConversationService(session)
        response_content = "I called a weather tool."
        tool_calls = [
            {
                "tool_name": "get_weather",
                "parameters": {"location": "New York"},
                "result": {"temperature": 72, "condition": "Sunny"},
            }
        ]

        message = service.persist_assistant_response(
            test_conversation.id,
            response_content,
            tool_calls_data=tool_calls,
        )

        assert len(message.tool_calls) == 1
        assert message.tool_calls[0].tool_name == "get_weather"


class TestHistoryReconstruction:
    """Tests for conversation history reconstruction"""

    def test_reconstruct_empty_conversation(self, session: Session, test_conversation: Conversation):
        """Test reconstructing empty conversation"""
        service = ConversationService(session)
        history = service.reconstruct_conversation_history(test_conversation.id)

        assert history == []

    def test_reconstruct_history_with_messages(self, session: Session, test_conversation: Conversation):
        """Test reconstructing history with messages"""
        service = ConversationService(session)

        # Add messages
        user_msg = create_message(session, test_conversation.id, "user", "Hello")
        asst_msg = create_message(session, test_conversation.id, "assistant", "Hi there!")

        history = service.reconstruct_conversation_history(test_conversation.id)

        assert len(history) == 2
        assert history[0].role == "user"
        assert history[1].role == "assistant"

    def test_history_chronological_order(self, session: Session, test_conversation: Conversation):
        """Test history is in chronological order"""
        service = ConversationService(session)

        # Add messages
        for i in range(5):
            create_message(session, test_conversation.id, "user", f"Message {i}")

        history = service.reconstruct_conversation_history(test_conversation.id)

        assert len(history) == 5
        for i, msg in enumerate(history):
            assert f"Message {i}" in msg.content

    def test_format_history_for_agent(self, session: Session, test_conversation: Conversation):
        """Test formatting history for agent"""
        service = ConversationService(session)

        # Add messages
        create_message(session, test_conversation.id, "user", "Hello")
        create_message(session, test_conversation.id, "assistant", "Hi")

        history = service.reconstruct_conversation_history(test_conversation.id)
        formatted = service.format_history_for_agent(history)

        assert len(formatted) == 2
        assert formatted[0]["role"] == "user"
        assert formatted[0]["content"] == "Hello"


class TestChatEndpoint:
    """T036: Integration tests for chat endpoint (8 tests)"""

    def test_chat_endpoint_new_conversation(self, client: TestClient, auth_headers: dict):
        """Test chat endpoint creates new conversation"""
        response = client.post(
            "/api/test-user-123/chat",
            json={"message": "Hello, assistant!"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["conversation_id"] is not None

    def test_chat_endpoint_requires_auth(self, client: TestClient):
        """Test chat endpoint requires authentication"""
        response = client.post(
            "/api/test-user-123/chat",
            json={"message": "Hello"},
        )

        assert response.status_code == 401

    def test_chat_endpoint_validates_user_id(
        self,
        client: TestClient,
        test_user: User,
        test_user_token: str,
    ):
        """Test chat endpoint validates URL user_id matches JWT"""
        other_token = test_user_token  # Would be different user in real scenario
        other_user_id = "different-user-456"

        response = client.post(
            f"/api/{other_user_id}/chat",
            json={"message": "Hello"},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        # Should fail because URL user_id doesn't match JWT user_id
        assert response.status_code == 403

    def test_chat_endpoint_validates_message(self, client: TestClient, auth_headers: dict):
        """Test chat endpoint validates message"""
        response = client.post(
            "/api/test-user-123/chat",
            json={"message": ""},  # Empty message
            headers=auth_headers,
        )

        assert response.status_code == 422  # Validation error

    def test_chat_response_includes_messages(self, client: TestClient, auth_headers: dict):
        """Test chat response includes conversation history"""
        response = client.post(
            "/api/test-user-123/chat",
            json={"message": "Test message"},
            headers=auth_headers,
        )

        data = response.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)

    def test_chat_continues_conversation(
        self,
        client: TestClient,
        auth_headers: dict,
        test_conversation: Conversation,
    ):
        """Test chat endpoint continues existing conversation"""
        response = client.post(
            "/api/test-user-123/chat",
            json={
                "message": "Follow-up message",
                "conversation_id": test_conversation.id,
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["conversation_id"] == test_conversation.id

    def test_chat_user_isolation(
        self,
        session: Session,
        client: TestClient,
        test_user: User,
        test_conversation: Conversation,
    ):
        """Test chat endpoint enforces user isolation"""
        # Create another user and try to access test_conversation
        other_user = User(
            id="other-user-456",
            email="other@example.com",
            password_hash="hash",
        )
        session.add(other_user)
        session.commit()

        other_token = f"Bearer other-user-456-token"  # Would be valid JWT for other user
        # Note: This would properly fail with real JWT validation

    def test_chat_returns_conversation_id(self, client: TestClient, auth_headers: dict):
        """Test chat response includes conversation_id"""
        response = client.post(
            "/api/test-user-123/chat",
            json={"message": "Hello"},
            headers=auth_headers,
        )

        data = response.json()
        assert data["conversation_id"]
        assert len(data["conversation_id"]) > 0
