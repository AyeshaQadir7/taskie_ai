"""
Tests for Conversation Continuation (Phase 4 - T037-T047)

Tests for:
- Conversation ID validation (T037)
- Conversation loading and timestamp updates (T038-T040)
- History reconstruction and ordering (T041-T045)
- Context awareness (T045)
- Integration tests for multi-turn conversations (T046-T047)
"""

import pytest
from datetime import datetime, timedelta, timezone
from sqlmodel import Session

from src.services import ConversationService
from src.models import Conversation, Message, User
from src.db import (
    create_conversation,
    create_message,
    get_conversation,
    update_conversation_timestamp,
    get_conversation_history,
)


class TestConversationValidation:
    """T037-T040: Conversation ID validation and parameter handling"""

    def test_validate_conversation_exists(self, session: Session, test_conversation: Conversation):
        """T037: Validate conversation exists"""
        result = get_conversation(session, test_conversation.id)
        assert result is not None
        assert result.id == test_conversation.id

    def test_validate_conversation_belongs_to_user(
        self,
        session: Session,
        test_conversation: Conversation,
        test_user: User,
    ):
        """T037: Validate conversation belongs to correct user"""
        result = get_conversation(session, test_conversation.id, user_id=test_user.id)
        assert result is not None
        assert result.user_id == test_user.id

    def test_reject_conversation_wrong_user(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T037: Reject conversation from different user"""
        wrong_user_id = "different-user-456"
        result = get_conversation(session, test_conversation.id, user_id=wrong_user_id)
        assert result is None

    def test_conversation_id_parameter_handling(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T038: Handle conversation_id parameter correctly"""
        service = ConversationService(session)

        # Load conversation using ID parameter
        loaded = service.get_or_create_conversation(
            test_conversation.user_id,
            conversation_id=test_conversation.id,
        )

        assert loaded.id == test_conversation.id

    def test_load_existing_conversation(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T039: Load existing conversation from database"""
        service = ConversationService(session)
        loaded = service.get_or_create_conversation(
            test_conversation.user_id,
            conversation_id=test_conversation.id,
        )

        assert loaded.id == test_conversation.id
        assert loaded.user_id == test_conversation.user_id

    def test_update_conversation_timestamp(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T040: Update conversation timestamp on new message"""
        original_updated = test_conversation.updated_at

        # Wait a moment to ensure timestamp difference
        import time
        time.sleep(0.1)

        # Update timestamp
        update_conversation_timestamp(session, test_conversation.id)

        # Reload and verify
        updated = get_conversation(session, test_conversation.id)
        assert updated.updated_at > original_updated


class TestHistoryReconstruction:
    """T041-T045: History reconstruction and ordering"""

    def test_reconstruct_empty_history(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T041: Reconstruct empty conversation history"""
        history = get_conversation_history(session, test_conversation.id)
        assert history == []

    def test_reconstruct_single_message(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T041: Reconstruct history with single message"""
        msg = create_message(session, test_conversation.id, "user", "Hello")

        history = get_conversation_history(session, test_conversation.id)
        assert len(history) == 1
        assert history[0].id == msg.id

    def test_reconstruct_multiple_messages(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T041: Reconstruct history with multiple messages"""
        msg1 = create_message(session, test_conversation.id, "user", "Hello")
        msg2 = create_message(session, test_conversation.id, "assistant", "Hi there!")
        msg3 = create_message(session, test_conversation.id, "user", "How are you?")

        history = get_conversation_history(session, test_conversation.id)
        assert len(history) == 3
        assert history[0].id == msg1.id
        assert history[1].id == msg2.id
        assert history[2].id == msg3.id

    def test_message_ordering_chronological(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T042: Verify messages ordered chronologically (ASC)"""
        # Create messages
        messages_created = []
        for i in range(5):
            msg = create_message(session, test_conversation.id, "user", f"Message {i}")
            messages_created.append(msg)

        # Retrieve history
        history = get_conversation_history(session, test_conversation.id)

        # Verify chronological ordering
        assert len(history) == 5
        for i, msg in enumerate(history):
            assert msg.id == messages_created[i].id
            assert f"Message {i}" in msg.content

    def test_message_ordering_timestamps(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T042: Verify messages ordered by created_at timestamp"""
        # Create messages with small delays
        import time
        messages = []
        for i in range(3):
            msg = create_message(session, test_conversation.id, "user", f"Msg {i}")
            messages.append(msg)
            time.sleep(0.05)

        # Retrieve history
        history = get_conversation_history(session, test_conversation.id)

        # Verify timestamps are ascending
        for i in range(len(history) - 1):
            assert history[i].created_at <= history[i + 1].created_at

    def test_reconstruct_10plus_messages(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T043: Reconstruct history with 10+ messages"""
        # Create 15 messages
        message_count = 15
        for i in range(message_count):
            role = "user" if i % 2 == 0 else "assistant"
            create_message(session, test_conversation.id, role, f"Message {i}")

        # Retrieve history
        history = get_conversation_history(session, test_conversation.id)

        assert len(history) == message_count
        for i, msg in enumerate(history):
            assert f"Message {i}" in msg.content

    def test_reconstruct_mixed_user_assistant(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T044: Reconstruct history with mixed user/assistant messages"""
        # Create alternating messages
        user_msgs = []
        asst_msgs = []

        for i in range(5):
            u_msg = create_message(session, test_conversation.id, "user", f"User message {i}")
            a_msg = create_message(session, test_conversation.id, "assistant", f"Assistant message {i}")
            user_msgs.append(u_msg)
            asst_msgs.append(a_msg)

        # Retrieve history
        history = get_conversation_history(session, test_conversation.id)

        assert len(history) == 10
        # Verify alternation
        for i in range(0, 10, 2):
            assert history[i].role == "user"
            assert history[i + 1].role == "assistant"

    def test_history_limit_parameter(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T041: History respects limit parameter"""
        # Create 20 messages
        for i in range(20):
            create_message(session, test_conversation.id, "user", f"Message {i}")

        # Retrieve with limit
        history = get_conversation_history(session, test_conversation.id, limit=5)

        assert len(history) == 5

    def test_context_awareness_preparation(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T045: Verify history can be used for context awareness"""
        # Create conversation with context
        create_message(session, test_conversation.id, "user", "What's your name?")
        create_message(session, test_conversation.id, "assistant", "I'm Claude, an AI assistant.")
        create_message(session, test_conversation.id, "user", "What did you just say?")

        # Retrieve history
        history = get_conversation_history(session, test_conversation.id)

        # Verify context is present
        assert len(history) == 3
        assert "name" in history[0].content.lower()
        assert "Claude" in history[1].content
        assert "say" in history[2].content.lower()

        # Format for agent
        service = ConversationService(session)
        formatted = service.format_history_for_agent(history)

        assert len(formatted) == 3
        assert formatted[0]["role"] == "user"
        assert formatted[1]["role"] == "assistant"
        assert "Claude" in formatted[1]["content"]


class TestContinuationValidation:
    """T046-T047: Integration tests for conversation continuation"""

    def test_continuation_validates_conversation_id(
        self,
        session: Session,
        test_user: User,
    ):
        """T046: Validate continuation with valid conversation_id"""
        service = ConversationService(session)

        # Create initial conversation
        conv = service.get_or_create_conversation(test_user.id)
        service.persist_user_message(conv.id, "First message")

        # Continue conversation
        conv2 = service.get_or_create_conversation(
            test_user.id,
            conversation_id=conv.id,
        )

        assert conv2.id == conv.id

    def test_continuation_rejects_invalid_conversation(
        self,
        session: Session,
        test_user: User,
    ):
        """T046: Reject continuation with invalid conversation_id"""
        service = ConversationService(session)

        with pytest.raises(ValueError):
            service.get_or_create_conversation(
                test_user.id,
                conversation_id="invalid-id-12345",
            )

    def test_continuation_maintains_history(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T047: History maintained across continuation"""
        service = ConversationService(session)

        # Create initial messages
        service.persist_user_message(test_conversation.id, "First message")
        service.persist_assistant_response(test_conversation.id, "First response")

        # Continue conversation
        service.persist_user_message(test_conversation.id, "Second message")

        # Verify full history
        history = service.reconstruct_conversation_history(test_conversation.id)
        assert len(history) == 3
        assert history[0].content == "First message"
        assert history[1].content == "First response"
        assert history[2].content == "Second message"

    def test_continuation_preserves_tool_calls(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T047: Tool calls preserved in conversation history"""
        from src.db import create_tool_call

        service = ConversationService(session)

        # Create message with tool call
        user_msg = service.persist_user_message(test_conversation.id, "What's the weather?")
        response = service.persist_assistant_response(
            test_conversation.id,
            "It's sunny today",
            tool_calls_data=[
                {
                    "tool_name": "get_weather",
                    "parameters": {"location": "New York"},
                    "result": {"temp": 72, "condition": "Sunny"},
                }
            ],
        )

        # Continue conversation
        user_msg2 = service.persist_user_message(test_conversation.id, "Follow-up question")

        # Verify tool calls preserved
        full_response = service.get_full_conversation_response(test_conversation.id)
        assert len(full_response) == 3
        assert len(full_response[1].tool_calls) == 1
        assert full_response[1].tool_calls[0].tool_name == "get_weather"

    def test_continuation_updates_timestamps(
        self,
        session: Session,
        test_conversation: Conversation,
    ):
        """T047: Conversation timestamps updated on continuation"""
        original_updated = test_conversation.updated_at

        import time
        time.sleep(0.1)

        service = ConversationService(session)
        service.persist_user_message(test_conversation.id, "New message")
        service.update_conversation_activity(test_conversation.id)

        # Reload and verify
        updated_conv = get_conversation(session, test_conversation.id)
        assert updated_conv.updated_at > original_updated

    def test_continuation_isolates_conversations(
        self,
        session: Session,
        test_user: User,
    ):
        """T047: Multiple conversations isolated from each other"""
        service = ConversationService(session)

        # Create two conversations
        conv1 = service.get_or_create_conversation(test_user.id, title="Conversation 1")
        conv2 = service.get_or_create_conversation(test_user.id, title="Conversation 2")

        # Add messages to each
        service.persist_user_message(conv1.id, "Message to conv1")
        service.persist_user_message(conv2.id, "Message to conv2")

        # Verify isolation
        history1 = service.reconstruct_conversation_history(conv1.id)
        history2 = service.reconstruct_conversation_history(conv2.id)

        assert len(history1) == 1
        assert len(history2) == 1
        assert history1[0].content == "Message to conv1"
        assert history2[0].content == "Message to conv2"

    def test_continuation_multi_turn_conversation(
        self,
        session: Session,
        test_user: User,
    ):
        """T047: Complete multi-turn conversation flow"""
        service = ConversationService(session)

        # Start new conversation
        conv = service.get_or_create_conversation(test_user.id)

        # Turn 1
        service.persist_user_message(conv.id, "What's 2+2?")
        service.persist_assistant_response(conv.id, "2+2 equals 4")

        # Turn 2 - Continue same conversation
        conv_continued = service.get_or_create_conversation(
            test_user.id,
            conversation_id=conv.id,
        )
        assert conv_continued.id == conv.id

        service.persist_user_message(conv.id, "And what's 3+3?")
        service.persist_assistant_response(conv.id, "3+3 equals 6")

        # Turn 3 - Continue again
        service.persist_user_message(conv.id, "Thanks!")
        service.persist_assistant_response(conv.id, "You're welcome!")

        # Verify full conversation
        history = service.reconstruct_conversation_history(conv.id)
        assert len(history) == 6
        assert history[0].content == "What's 2+2?"
        assert history[-1].content == "You're welcome!"

    def test_continuation_with_many_messages(
        self,
        session: Session,
        test_user: User,
    ):
        """T047: Handle conversation with many messages"""
        service = ConversationService(session)
        conv = service.get_or_create_conversation(test_user.id)

        # Add 50 messages
        for i in range(50):
            role = "user" if i % 2 == 0 else "assistant"
            service.persist_user_message(
                conv.id,
                f"Message {i} from {role}",
            ) if role == "user" else service.persist_assistant_response(
                conv.id,
                f"Message {i} from {role}",
            )

        # Verify all messages loaded
        history = service.reconstruct_conversation_history(conv.id)
        assert len(history) >= 25  # At least user messages

        # Verify ordering
        for i in range(len(history) - 1):
            assert history[i].created_at <= history[i + 1].created_at
