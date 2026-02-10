"""Pydantic request and response models"""
from datetime import datetime, date
from typing import Optional, List, Any
from sqlmodel import SQLModel
from pydantic import Field, EmailStr, field_validator


class TaskCreate(SQLModel):
    """Request model for POST /api/{user_id}/tasks"""
    title: str = Field(
        min_length=1,
        max_length=255,
        description="Task title (required)"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=5000,
        description="Extended task description (optional)"
    )
    priority: Optional[str] = Field(
        default="medium",
        description="Task priority level: low, medium, or high (optional, defaults to medium)"
    )
    due_date: Optional[date] = Field(
        default=None,
        description="Task due date in ISO 8601 format (optional, nullable)"
    )

    @field_validator('priority', mode='before')
    @classmethod
    def normalize_priority(cls, v):
        if v is None:
            return "medium"
        if isinstance(v, str):
            normalized = v.lower().strip()
            if normalized not in ["low", "medium", "high"]:
                raise ValueError("Priority must be 'low', 'medium', or 'high'")
            return normalized
        raise ValueError("Priority must be a string")


class TaskUpdate(SQLModel):
    """Request model for PUT /api/{user_id}/tasks/{id}"""
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
        description="Task title (optional)"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=5000,
        description="Extended task description (optional)"
    )
    priority: Optional[str] = Field(
        default=None,
        description="Task priority level: low, medium, or high (optional)"
    )
    due_date: Optional[date] = Field(
        default=None,
        description="Task due date in ISO 8601 format (optional, nullable, set to null to clear)"
    )

    @field_validator('priority', mode='before')
    @classmethod
    def normalize_priority(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            normalized = v.lower().strip()
            if normalized not in ["low", "medium", "high"]:
                raise ValueError("Priority must be 'low', 'medium', or 'high'")
            return normalized
        raise ValueError("Priority must be a string")


class TaskResponse(SQLModel):
    """Response model for all GET/POST/PUT/PATCH endpoints"""
    id: int
    user_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[date] = None
    is_overdue: bool = False
    is_due_today: bool = False
    days_until_due: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class ErrorResponse(SQLModel):
    """Standard error response for all error cases"""
    error: str


class SignUpRequest(SQLModel):
    """Request model for POST /auth/signup"""
    email: EmailStr = Field(description="User email address (must be unique)")
    password: str = Field(
        min_length=8,
        max_length=72,
        description="Password (8-72 characters for bcrypt compatibility)"
    )
    name: str = Field(
        min_length=1,
        max_length=255,
        description="User display name"
    )


class SignInRequest(SQLModel):
    """Request model for POST /auth/signin"""
    email: EmailStr = Field(description="User email address")
    password: str = Field(description="User password")


class UserResponse(SQLModel):
    """Response model for user data"""
    id: str
    email: str
    name: Optional[str] = None


class AuthTokenResponse(SQLModel):
    """Response model for authentication endpoints"""
    user: UserResponse
    token: str
    token_type: str = "Bearer"
    expires_in: int  # Seconds until token expiration


class SignOutResponse(SQLModel):
    """Response model for POST /auth/signout"""
    message: str
    status: str


class TaskStatusUpdate(SQLModel):
    """Request model for PATCH /api/{user_id}/tasks/{id}/status"""
    status: str = Field(
        description="Task status: 'complete' or 'incomplete'"
    )

    @property
    def is_complete(self) -> bool:
        """Check if status is complete"""
        return self.status.lower() == "complete"


# ============================================================================
# SPEC 008: CHAT INTERFACE MODELS (T021-T023)
# ============================================================================


class ToolCallResponse(SQLModel):
    """Response model for a tool call made by the agent"""
    id: int = Field(description="Tool call ID")
    tool_name: str = Field(description="Name of the tool called")
    parameters: dict = Field(default_factory=dict, description="Input parameters to the tool")
    result: Optional[dict] = Field(default=None, description="Tool execution result")
    executed_at: datetime = Field(description="When the tool was executed")


class MessageResponse(SQLModel):
    """Response model for a message in conversation (T023)

    Spec 008 Design:
    - Includes message ID, role, content, and timestamp
    - Tool calls nested for complete response information
    - Ordered by created_at for history reconstruction
    """
    id: int = Field(description="Message ID")
    role: str = Field(description="Message role: 'user' or 'assistant'")
    content: str = Field(description="Message text content")
    created_at: datetime = Field(description="When message was created (UTC)")
    tool_calls: List[ToolCallResponse] = Field(
        default_factory=list,
        description="Tool calls made during this message (for assistant messages)"
    )


class ChatRequest(SQLModel):
    """Request model for POST /api/{user_id}/chat (T021)

    Spec 008 Design:
    - Message is required
    - Conversation ID is optional (creates new if not provided)
    - Stateless API: no in-memory state maintained
    """
    message: str = Field(
        min_length=1,
        max_length=5000,
        description="User message to send to the agent"
    )
    conversation_id: Optional[str] = Field(
        default=None,
        description="Optional ID of existing conversation (creates new if not provided)"
    )


class ChatResponse(SQLModel):
    """Response model for POST /api/{user_id}/chat (T022)

    Spec 008 Design:
    - Returns status, conversation ID, and full message history
    - Message history includes all user and assistant messages
    - Tool calls visible in assistant message responses
    - Error codes provided on failure for debugging
    """
    status: str = Field(description="Response status: 'success' or 'error'")
    conversation_id: str = Field(description="ID of the conversation (new or existing)")
    messages: List[MessageResponse] = Field(
        default_factory=list,
        description="Full conversation history in chronological order"
    )
    error_code: Optional[str] = Field(
        default=None,
        description="Error code if status is 'error'"
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Human-readable error message if status is 'error'"
    )


class ConversationListItem(SQLModel):
    """Response model for conversation list endpoint"""
    id: str = Field(description="Conversation ID")
    title: Optional[str] = Field(description="Conversation title (auto-generated or user-set)")
    created_at: datetime = Field(description="When conversation was created")
    updated_at: datetime = Field(description="When conversation was last updated")
    message_count: int = Field(description="Number of messages in conversation")
