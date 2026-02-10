"""SQLModel definitions for Task, User, Conversation, Message, and ToolCall entities"""
from datetime import datetime, timezone, date
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON as SQLJSON


class User(SQLModel, table=True):
    """User model - represents a user"""
    __tablename__ = "users"

    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str = Field(max_length=255)
    name: Optional[str] = Field(default=None, max_length=255)


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

    # Due Date (NEW)
    due_date: Optional[date] = Field(default=None, index=True)

    # Timestamps (UTC)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class Conversation(SQLModel, table=True):
    """
    Conversation model - represents a multi-turn conversation with the AI agent.

    Spec 008 Design:
    - Stateless design: Server holds no in-memory conversation state
    - Per-request reconstruction: History fully reconstructed from database each request
    - User isolation: Foreign key constraint ensures user can only access own conversations
    - Timestamps track conversation lifecycle for audit trail
    """
    __tablename__ = "conversations"

    # Primary Key
    id: Optional[str] = Field(default=None, primary_key=True)  # UUID string for distributed generation

    # Foreign Key: User who owns this conversation
    user_id: str = Field(foreign_key="users.id", index=True)

    # Conversation metadata
    title: Optional[str] = Field(default=None, max_length=255)

    # Timestamps (UTC)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    messages: list["Message"] = Relationship(back_populates="conversation")


class Message(SQLModel, table=True):
    """
    Message model - represents a single message in a conversation.

    Spec 008 Design:
    - Stateless persistence: User messages persisted BEFORE agent execution
    - Assistant responses persisted AFTER agent execution
    - ACID transaction guarantees prevent message loss on failure
    - Role field distinguishes user vs assistant messages for history reconstruction
    """
    __tablename__ = "messages"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Key: Conversation this message belongs to
    conversation_id: str = Field(foreign_key="conversations.id", index=True)

    # Message content
    role: str = Field(index=True)  # Enum: "user" | "assistant"
    content: str  # Full message text

    # Timestamps (UTC)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    conversation: Conversation = Relationship(back_populates="messages")
    tool_calls: list["ToolCall"] = Relationship(back_populates="message")


class ToolCall(SQLModel, table=True):
    """
    ToolCall model - represents a tool call made by the agent during message processing.

    Spec 008 Design:
    - Complete audit trail: All tool calls logged with parameters and results
    - JSONB storage: PostgreSQL JSONB for arbitrary tool parameters and results
    - Traceability: Links tool call to specific message and message to conversation
    - Immutable record: Once created, tool calls are read-only for compliance
    """
    __tablename__ = "tool_calls"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Key: Message that generated this tool call
    message_id: int = Field(foreign_key="messages.id", index=True)

    # Tool information
    tool_name: str = Field(index=True)  # Name of the tool called (e.g., "get_weather", "search_web")

    # Tool execution details
    # Using Column with JSON type for PostgreSQL JSONB support
    parameters: dict = Field(default_factory=dict, sa_column=Column(SQLJSON))  # Input parameters to tool
    result: Optional[dict] = Field(default=None, sa_column=Column(SQLJSON))  # Tool execution result

    # Timestamps (UTC)
    executed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    message: Message = Relationship(back_populates="tool_calls")
