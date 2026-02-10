"""
CRUD operations for Message model (T015)

Implements database operations for:
- Creating messages (user and assistant)
- Retrieving conversation history
- Getting specific messages by ID
- Listing messages with filtering
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import Session, select

from src.models import Message, Conversation


def create_message(
    session: Session,
    conversation_id: str,
    role: str,
    content: str,
) -> Message:
    """
    Create a new message in a conversation.

    Spec 008 Design:
    - User messages persisted BEFORE agent execution
    - Assistant messages persisted AFTER agent execution
    - Both cases use same function with role parameter
    - Automatic timestamp to prevent clock skew issues

    Args:
        session: Database session
        conversation_id: ID of conversation this message belongs to
        role: Message role ("user" or "assistant")
        content: Message text content

    Returns:
        Created Message object

    Raises:
        sqlalchemy.exc.IntegrityError: If conversation_id doesn't exist
    """
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        created_at=datetime.now(timezone.utc),
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


def get_message(
    session: Session,
    message_id: int,
) -> Optional[Message]:
    """
    Get a message by ID.

    Args:
        session: Database session
        message_id: ID of message to retrieve

    Returns:
        Message object or None if not found
    """
    return session.exec(select(Message).where(Message.id == message_id)).first()


def get_conversation_history(
    session: Session,
    conversation_id: str,
    limit: int = 100,
) -> List[Message]:
    """
    Reconstruct full conversation history for a given conversation.

    Spec 008 Design:
    - Core function for history reconstruction
    - Returns messages in chronological order (oldest first)
    - Used by agent to understand conversation context
    - Limit prevents loading extremely large conversations

    Args:
        session: Database session
        conversation_id: ID of conversation to retrieve history for
        limit: Maximum number of messages to retrieve (default 100)

    Returns:
        List of Message objects in chronological order
    """
    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
    )
    return session.exec(statement).all()


def get_conversation_messages_with_relationships(
    session: Session,
    conversation_id: str,
    limit: int = 100,
) -> List[dict]:
    """
    Get conversation history with relationships (tool calls).

    Spec 008 Design:
    - Returns messages with nested tool_calls for API responses
    - Used for formatting responses to client
    - Includes complete tool call audit trail

    Args:
        session: Database session
        conversation_id: ID of conversation
        limit: Maximum number of messages to retrieve

    Returns:
        List of message dictionaries with tool_calls nested
    """
    messages = get_conversation_history(session, conversation_id, limit)

    result = []
    for msg in messages:
        msg_dict = {
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
            "tool_calls": [
                {
                    "id": tc.id,
                    "tool_name": tc.tool_name,
                    "parameters": tc.parameters,
                    "result": tc.result,
                    "executed_at": tc.executed_at.isoformat(),
                }
                for tc in msg.tool_calls
            ],
        }
        result.append(msg_dict)

    return result


def list_conversation_messages(
    session: Session,
    conversation_id: str,
    skip: int = 0,
    limit: int = 50,
) -> List[Message]:
    """
    List messages for a conversation with pagination.

    Args:
        session: Database session
        conversation_id: ID of conversation
        skip: Number of messages to skip
        limit: Maximum number of messages to return

    Returns:
        List of Message objects
    """
    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


def get_conversation_message_count(
    session: Session,
    conversation_id: str,
) -> int:
    """
    Get total message count for a conversation.

    Useful for:
    - Pagination UI
    - Performance monitoring
    - Detecting very large conversations

    Args:
        session: Database session
        conversation_id: ID of conversation

    Returns:
        Total number of messages in conversation
    """
    statement = select(Message).where(Message.conversation_id == conversation_id)
    return len(session.exec(statement).all())


def get_latest_message(
    session: Session,
    conversation_id: str,
) -> Optional[Message]:
    """
    Get the most recent message in a conversation.

    Useful for:
    - Getting last assistant response
    - Checking if conversation has messages
    - Detecting conversation activity

    Args:
        session: Database session
        conversation_id: ID of conversation

    Returns:
        Latest Message object or None if conversation empty
    """
    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    return session.exec(statement).first()
