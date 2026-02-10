"""
CRUD operations for Conversation model (T014)

Implements database operations for:
- Creating new conversations
- Retrieving conversations by ID
- Listing conversations for a user
- Updating conversation metadata (title, timestamp)
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import Session, select
from uuid import uuid4

from src.models import Conversation


def create_conversation(
    session: Session,
    user_id: str,
    title: Optional[str] = None,
    conversation_id: Optional[str] = None,
) -> Conversation:
    """
    Create a new conversation for a user.

    Spec 008 Design:
    - Creates conversation with auto-generated ID (UUID) if not provided
    - Sets created_at and updated_at to current UTC time
    - User isolation via foreign key constraint

    Args:
        session: Database session
        user_id: ID of user who owns this conversation
        title: Optional title for the conversation
        conversation_id: Optional ID (if not provided, generates UUID)

    Returns:
        Created Conversation object

    Raises:
        sqlalchemy.exc.IntegrityError: If user_id doesn't exist
    """
    conversation = Conversation(
        id=conversation_id or str(uuid4()),
        user_id=user_id,
        title=title,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


def get_conversation(
    session: Session,
    conversation_id: str,
    user_id: Optional[str] = None,
) -> Optional[Conversation]:
    """
    Get a conversation by ID with optional user isolation check.

    Spec 008 Design:
    - Enforces user ownership check if user_id provided
    - Prevents cross-user access via query filter
    - Returns None if conversation not found or doesn't belong to user

    Args:
        session: Database session
        conversation_id: ID of conversation to retrieve
        user_id: Optional user ID to verify ownership

    Returns:
        Conversation object or None if not found
    """
    statement = select(Conversation).where(Conversation.id == conversation_id)

    # Add user isolation filter if user_id provided
    if user_id:
        statement = statement.where(Conversation.user_id == user_id)

    return session.exec(statement).first()


def list_conversations(
    session: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 50,
) -> List[Conversation]:
    """
    List conversations for a user with pagination.

    Spec 008 Design:
    - Enforces user isolation via WHERE clause
    - Orders by updated_at DESC (most recent first)
    - Includes limit and skip for pagination

    Args:
        session: Database session
        user_id: ID of user whose conversations to retrieve
        skip: Number of conversations to skip (pagination)
        limit: Maximum number of conversations to return

    Returns:
        List of Conversation objects for the user
    """
    statement = (
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


def update_conversation_timestamp(
    session: Session,
    conversation_id: str,
) -> Optional[Conversation]:
    """
    Update conversation's updated_at timestamp.

    Spec 008 Design:
    - Automatically called when new message added to conversation
    - Moves conversation to top of user's conversation list
    - Uses database transaction for consistency

    Args:
        session: Database session
        conversation_id: ID of conversation to update

    Returns:
        Updated Conversation object or None if not found
    """
    conversation = session.exec(
        select(Conversation).where(Conversation.id == conversation_id)
    ).first()

    if conversation:
        conversation.updated_at = datetime.now(timezone.utc)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    return conversation


def delete_conversation(
    session: Session,
    conversation_id: str,
    user_id: str,
) -> bool:
    """
    Delete a conversation (with cascading delete of messages and tool_calls).

    Spec 008 Design:
    - Enforces user ownership check before deletion
    - Cascade delete ensures messages and tool_calls are deleted
    - Returns False if conversation not found or doesn't belong to user

    Args:
        session: Database session
        conversation_id: ID of conversation to delete
        user_id: ID of user (for ownership verification)

    Returns:
        True if deleted successfully, False if not found
    """
    conversation = session.exec(
        select(Conversation).where(
            (Conversation.id == conversation_id) & (Conversation.user_id == user_id)
        )
    ).first()

    if conversation:
        session.delete(conversation)
        session.commit()
        return True

    return False


def get_conversation_count(session: Session, user_id: str) -> int:
    """
    Get total count of conversations for a user.

    Useful for:
    - UI pagination
    - Monitoring conversation growth
    - Rate limiting per user

    Args:
        session: Database session
        user_id: ID of user whose conversations to count

    Returns:
        Total number of conversations for the user
    """
    statement = select(Conversation).where(Conversation.user_id == user_id)
    return session.exec(statement).all().__len__()
