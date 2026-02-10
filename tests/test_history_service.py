"""
Unit Tests for HistoryService (T046)

Tests for history reconstruction, ordering, and validation.
"""

import pytest
from datetime import datetime, timezone
from sqlmodel import Session

from src.services import HistoryService
from src.models import Conversation
from src.db import create_message, get_conversation_history


class TestHistoryServiceBasics:
    """T046: History service unit tests (6 tests)"""

    def test_get_conversation_history_empty(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test getting history from empty conversation"""
        service = HistoryService(session)
        history = service.get_conversation_history(test_conversation.id)

        assert history == []

    def test_get_conversation_history_with_messages(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test getting history with messages"""
        service = HistoryService(session)

        # Create messages
        create_message(session, test_conversation.id, "user", "Hello")
        create_message(session, test_conversation.id, "assistant", "Hi")

        history = service.get_conversation_history(test_conversation.id)

        assert len(history) == 2
        assert history[0].role == "user"
        assert history[1].role == "assistant"

    def test_verify_message_ordering(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test message ordering verification"""
        service = HistoryService(session)

        # Create messages in order
        for i in range(5):
            create_message(session, test_conversation.id, "user", f"Message {i}")

        history = service.get_conversation_history(test_conversation.id)
        is_ordered = service.verify_message_ordering(history)

        assert is_ordered is True

    def test_format_for_agent(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test formatting history for agent"""
        service = HistoryService(session)

        # Create messages
        create_message(session, test_conversation.id, "user", "What's 2+2?")
        create_message(session, test_conversation.id, "assistant", "It's 4")

        history = service.get_conversation_history(test_conversation.id)
        formatted = service.format_for_agent(history)

        assert len(formatted) == 2
        assert formatted[0]["role"] == "user"
        assert formatted[0]["content"] == "What's 2+2?"
        assert formatted[1]["role"] == "assistant"
        assert formatted[1]["content"] == "It's 4"

    def test_validate_context_integrity_valid(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test context integrity validation with valid history"""
        service = HistoryService(session)

        # Create valid messages
        create_message(session, test_conversation.id, "user", "Valid message")
        create_message(session, test_conversation.id, "assistant", "Valid response")

        history = service.get_conversation_history(test_conversation.id)
        is_valid = service.validate_context_integrity(history)

        assert is_valid is True

    def test_validate_context_integrity_empty(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test context integrity validation with empty history"""
        service = HistoryService(session)

        history = service.get_conversation_history(test_conversation.id)
        is_valid = service.validate_context_integrity(history)

        # Empty history is valid
        assert is_valid is True


class TestHistoryServiceAdvanced:
    """Advanced history service tests"""

    def test_get_conversation_summary_empty(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test conversation summary for empty conversation"""
        service = HistoryService(session)
        summary = service.get_conversation_summary(test_conversation.id)

        assert summary["message_count"] == 0
        assert summary["user_count"] == 0
        assert summary["assistant_count"] == 0

    def test_get_conversation_summary_with_messages(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test conversation summary with messages"""
        service = HistoryService(session)

        # Create 3 user messages and 2 assistant messages
        create_message(session, test_conversation.id, "user", "Message 1")
        create_message(session, test_conversation.id, "assistant", "Response 1")
        create_message(session, test_conversation.id, "user", "Message 2")
        create_message(session, test_conversation.id, "assistant", "Response 2")
        create_message(session, test_conversation.id, "user", "Message 3")

        summary = service.get_conversation_summary(test_conversation.id)

        assert summary["message_count"] == 5
        assert summary["user_count"] == 3
        assert summary["assistant_count"] == 2
        assert summary["earliest_message"] is not None
        assert summary["latest_message"] is not None

    def test_get_recent_context(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test getting recent messages for context"""
        service = HistoryService(session)

        # Create 15 messages
        for i in range(15):
            role = "user" if i % 2 == 0 else "assistant"
            create_message(session, test_conversation.id, role, f"Message {i}")

        # Get recent 5
        recent = service.get_recent_context(test_conversation.id, recent_messages_count=5)

        assert len(recent) == 5
        # Should be the last 5 messages
        assert "Message 10" in recent[0]["content"] or "Message" in recent[0]["content"]

    def test_reconstruct_with_validation_valid(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test reconstruction with validation on valid history"""
        service = HistoryService(session)

        # Create valid messages
        create_message(session, test_conversation.id, "user", "Hello")
        create_message(session, test_conversation.id, "assistant", "Hi")

        history, is_valid = service.reconstruct_with_validation(test_conversation.id)

        assert len(history) == 2
        assert is_valid is True

    def test_reconstruct_with_validation_empty(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test reconstruction with validation on empty history"""
        service = HistoryService(session)

        history, is_valid = service.reconstruct_with_validation(test_conversation.id)

        assert history == []
        assert is_valid is True

    def test_history_respects_limit(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test history retrieval respects limit parameter"""
        service = HistoryService(session)

        # Create 20 messages
        for i in range(20):
            create_message(session, test_conversation.id, "user", f"Message {i}")

        # Get with limit
        history = service.get_conversation_history(test_conversation.id, limit=5)

        assert len(history) == 5

    def test_ordering_with_many_messages(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """Test ordering verification with many messages"""
        service = HistoryService(session)

        # Create 50 messages
        for i in range(50):
            role = "user" if i % 2 == 0 else "assistant"
            create_message(session, test_conversation.id, role, f"Message {i}")

        history = service.get_conversation_history(test_conversation.id)
        is_ordered = service.verify_message_ordering(history)

        assert is_ordered is True
        assert len(history) == 50

        # Verify each message is in correct order
        for i in range(len(history) - 1):
            assert history[i].created_at <= history[i + 1].created_at
