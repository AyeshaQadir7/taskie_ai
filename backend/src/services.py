"""Business logic layer - TaskService and ConversationService for business logic"""
import logging
from datetime import datetime, timezone, date
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from src.models import Task, Conversation, Message
from src.schemas import TaskResponse

logger = logging.getLogger(__name__)


# ============================================================================
# DUE DATE HELPER FUNCTIONS (FEATURE 009: Task Due Dates & Deadlines)
# ============================================================================


def compute_task_status(task: Task) -> Dict[str, Any]:
    """
    Compute due date status fields for a task (is_overdue, is_due_today, days_until_due)

    Args:
        task: Task model instance

    Returns:
        Dictionary with computed status fields
    """
    today = date.today()

    is_overdue = False
    is_due_today = False
    days_until_due = None

    if task.due_date is not None:
        is_overdue = task.due_date < today
        is_due_today = task.due_date == today
        days_until_due = (task.due_date - today).days

    return {
        "is_overdue": is_overdue,
        "is_due_today": is_due_today,
        "days_until_due": days_until_due
    }


def format_task_response(task: Task) -> TaskResponse:
    """
    Convert Task model to TaskResponse with computed status fields

    Args:
        task: Task model instance

    Returns:
        TaskResponse model with all fields including computed status
    """
    status = compute_task_status(task)

    return TaskResponse(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        is_overdue=status["is_overdue"],
        is_due_today=status["is_due_today"],
        days_until_due=status["days_until_due"],
        created_at=task.created_at,
        updated_at=task.updated_at
    )


def validate_due_date(due_date: Optional[date]) -> bool:
    """
    Validate due date value (currently accepts any valid date)

    Args:
        due_date: Date value to validate

    Returns:
        True if valid, False otherwise
    """
    if due_date is None:
        return True

    if not isinstance(due_date, date):
        return False

    # Accept any date (past, present, future)
    return True


class TaskService:
    """Service class for task-related business logic with ownership validation"""

    def __init__(self, session: Session):
        """Initialize service with database session"""
        self.session = session

    def get_tasks_for_user(
        self,
        user_id: str,
        status: Optional[str] = None,
        sort: Optional[str] = None
    ) -> List[Task]:
        """
        Retrieve all tasks for a user, optionally filtered by status and sorted

        Args:
            user_id: Authenticated user ID
            status: Optional status filter ("incomplete" or "complete")
            sort: Optional sort parameter ("priority", "due_date", or "-due_date" for descending)

        Returns:
            List of Task objects owned by the user, sorted as requested
        """
        query = select(Task).where(Task.user_id == user_id)

        if status:
            query = query.where(Task.status == status)

        results = self.session.exec(query).all()

        # Apply sorting in Python to handle complex ordering rules
        if sort == "priority":
            # Priority order: high (3) > medium (2) > low (1)
            priority_order = {"high": 3, "medium": 2, "low": 1}
            results = sorted(
                results,
                key=lambda t: (-priority_order.get(t.priority, 2), -t.created_at.timestamp())
            )
            logger.info(f"Sorted {len(results)} tasks by priority for user {user_id}")
        elif sort == "due_date":
            # Sort by due_date ascending (earliest first), NULL values at end
            results = sorted(
                results,
                key=lambda t: (t.due_date is None, t.due_date, -t.created_at.timestamp())
            )
            logger.info(f"Sorted {len(results)} tasks by due_date (ascending) for user {user_id}")
        elif sort == "-due_date":
            # Sort by due_date descending (latest first), NULL values at end
            results = sorted(
                results,
                key=lambda t: (t.due_date is None, t.due_date is not None and -t.due_date.toordinal(), -t.created_at.timestamp())
            )
            logger.info(f"Sorted {len(results)} tasks by due_date (descending) for user {user_id}")
        else:
            # Default sort: newest first
            results = sorted(results, key=lambda t: -t.created_at.timestamp())

        return results

    def get_task_by_id(self, task_id: int, user_id: str) -> Optional[Task]:
        """
        Retrieve a single task by ID with ownership verification

        Args:
            task_id: Task ID to retrieve
            user_id: Authenticated user ID for ownership check

        Returns:
            Task object if found and owned by user, None otherwise
        """
        task = self.session.exec(
            select(Task).where(
                (Task.id == task_id) & (Task.user_id == user_id)
            )
        ).first()
        return task

    def create_task(
        self,
        user_id: str,
        title: str,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[date] = None
    ) -> Task:
        """
        Create a new task for a user

        Args:
            user_id: Authenticated user ID (task owner)
            title: Task title (required)
            description: Task description (optional)
            priority: Task priority level (optional, defaults to "medium")
            due_date: Task due date (optional, nullable)

        Returns:
            Created Task object with auto-generated ID and timestamps
        """
        now = datetime.now(timezone.utc)
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            status="incomplete",
            priority=priority or "medium",
            due_date=due_date,
            created_at=now,
            updated_at=now
        )
        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)
        logger.info(f"Created task {task.id} for user {user_id} with priority={task.priority}, due_date={due_date}")
        return task

    def update_task(
        self,
        task_id: int,
        user_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[date] = None,
        clear_due_date: bool = False
    ) -> Optional[Task]:
        """
        Update a task's title, description, priority, and/or due_date with ownership verification

        Args:
            task_id: Task ID to update
            user_id: Authenticated user ID for ownership check
            title: New title (optional)
            description: New description (optional)
            priority: New priority level (optional)
            due_date: New due date (optional)
            clear_due_date: If True, set due_date to NULL (optional)

        Returns:
            Updated Task object if found and owned by user, None otherwise
        """
        task = self.get_task_by_id(task_id, user_id)
        if not task:
            return None

        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if priority is not None:
            logger.info(f"Updated task {task_id} priority to {priority} for user {user_id}")
            task.priority = priority
        if clear_due_date:
            task.due_date = None
            logger.info(f"Cleared due date for task {task_id} for user {user_id}")
        elif due_date is not None:
            task.due_date = due_date
            logger.info(f"Updated task {task_id} due_date to {due_date} for user {user_id}")

        task.updated_at = datetime.now(timezone.utc)
        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)
        return task

    def delete_task(self, task_id: int, user_id: str) -> bool:
        """
        Delete a task with ownership verification

        Args:
            task_id: Task ID to delete
            user_id: Authenticated user ID for ownership check

        Returns:
            True if task was deleted, False if not found or not owned
        """
        task = self.get_task_by_id(task_id, user_id)
        if not task:
            return False

        self.session.delete(task)
        self.session.commit()
        return True

    def mark_complete(self, task_id: int, user_id: str) -> Optional[Task]:
        """
        Mark a task as complete with ownership verification

        Args:
            task_id: Task ID to mark complete
            user_id: Authenticated user ID for ownership check

        Returns:
            Updated Task object if found and owned by user, None otherwise
        """
        task = self.get_task_by_id(task_id, user_id)
        if not task:
            return None

        task.status = "complete"
        task.updated_at = datetime.now(timezone.utc)
        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)
        return task

    def mark_incomplete(self, task_id: int, user_id: str) -> Optional[Task]:
        """
        Mark a task as incomplete with ownership verification

        Args:
            task_id: Task ID to mark incomplete
            user_id: Authenticated user ID for ownership check

        Returns:
            Updated Task object if found and owned by user, None otherwise
        """
        task = self.get_task_by_id(task_id, user_id)
        if not task:
            return None

        task.status = "incomplete"
        task.updated_at = datetime.now(timezone.utc)
        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)
        return task

    def update_status(self, task_id: int, user_id: str, status: str) -> Optional[Task]:
        """
        Update task status with ownership verification

        Args:
            task_id: Task ID to update
            user_id: Authenticated user ID for ownership check
            status: New status ('complete' or 'incomplete')

        Returns:
            Updated Task object if found and owned by user, None otherwise
        """
        task = self.get_task_by_id(task_id, user_id)
        if not task:
            return None

        normalized_status = status.lower().strip()
        if normalized_status not in ["complete", "incomplete"]:
            raise ValueError("Status must be 'complete' or 'incomplete'")

        task.status = normalized_status
        task.updated_at = datetime.now(timezone.utc)
        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)

        action = "marked complete" if normalized_status == "complete" else "marked incomplete"
        logger.info(f"Task {task_id} {action} for user {user_id}")
        return task


# ============================================================================
# SPEC 008: CONVERSATION SERVICE (T028-T034)
# ============================================================================


class ConversationService:
    """
    Service to orchestrate stateless chat interactions.

    Spec 008 Design:
    - No in-memory state between requests
    - Per-request history reconstruction from database
    - ACID transaction guarantees via SQLAlchemy
    - User isolation via database constraints
    """

    def __init__(self, session: Session):
        """Initialize service with database session"""
        self.session = session

    def get_or_create_conversation(
        self,
        user_id: str,
        conversation_id: Optional[str] = None,
        title: Optional[str] = None,
    ) -> Conversation:
        """Get existing conversation or create new one (T026)"""
        from src.db import create_conversation, get_conversation

        if conversation_id:
            conversation = get_conversation(self.session, conversation_id, user_id)
            if not conversation:
                raise ValueError(
                    f"Conversation {conversation_id} not found or doesn't belong to this user"
                )
            logger.info(
                f"Retrieved existing conversation: {conversation_id}",
                extra={"user_id": user_id, "conversation_id": conversation_id},
            )
            return conversation
        else:
            conversation = create_conversation(self.session, user_id, title=title)
            logger.info(
                f"Created new conversation: {conversation.id}",
                extra={"user_id": user_id, "conversation_id": conversation.id},
            )
            return conversation

    def persist_user_message(
        self,
        conversation_id: str,
        message_content: str,
    ) -> Message:
        """Persist user message BEFORE agent execution (T027)"""
        from src.db import create_message

        message = create_message(
            self.session,
            conversation_id,
            role="user",
            content=message_content,
        )
        logger.info(
            f"Persisted user message before agent execution",
            extra={
                "conversation_id": conversation_id,
                "message_id": message.id,
                "content_length": len(message_content),
            },
        )
        return message

    def reconstruct_conversation_history(
        self,
        conversation_id: str,
        limit: int = None,
    ) -> List[Message]:
        """Reconstruct full conversation history from database (T029-T030)"""
        from src import config
        from src.db import get_conversation_history

        if limit is None:
            limit = config.MAX_HISTORY_MESSAGES

        history = get_conversation_history(self.session, conversation_id, limit=limit)
        logger.info(
            f"Reconstructed conversation history",
            extra={
                "conversation_id": conversation_id,
                "message_count": len(history),
            },
        )
        return history

    def format_history_for_agent(
        self,
        history: List[Message],
    ) -> List[Dict[str, str]]:
        """Format conversation history for agent input"""
        formatted = []
        for message in history:
            formatted.append({
                "role": message.role,
                "content": message.content,
            })
        return formatted

    def persist_assistant_response(
        self,
        conversation_id: str,
        agent_response: str,
        tool_calls_data: Optional[List[Dict[str, Any]]] = None,
    ) -> Message:
        """Persist assistant response and tool calls AFTER agent execution (T032-T033)"""
        from src.db import create_message, create_tool_call

        message = create_message(
            self.session,
            conversation_id,
            role="assistant",
            content=agent_response,
        )

        if tool_calls_data:
            for tool_call in tool_calls_data:
                create_tool_call(
                    self.session,
                    message.id,
                    tool_name=tool_call.get("tool_name", "unknown"),
                    parameters=tool_call.get("parameters", {}),
                    result=tool_call.get("result"),
                )
            logger.info(
                f"Persisted assistant response with {len(tool_calls_data)} tool calls",
                extra={
                    "conversation_id": conversation_id,
                    "message_id": message.id,
                    "tool_call_count": len(tool_calls_data),
                },
            )
        else:
            logger.info(
                f"Persisted assistant response (no tool calls)",
                extra={
                    "conversation_id": conversation_id,
                    "message_id": message.id,
                },
            )

        return message

    def update_conversation_activity(self, conversation_id: str) -> None:
        """Update conversation's updated_at timestamp"""
        from src.db import update_conversation_timestamp

        update_conversation_timestamp(self.session, conversation_id)

    def get_full_conversation_response(
        self,
        conversation_id: str,
    ) -> List:
        """Format full conversation for API response (T034)"""
        from src.db import get_conversation_messages_with_relationships
        from src.schemas import MessageResponse, ToolCallResponse

        messages_with_relationships = get_conversation_messages_with_relationships(
            self.session,
            conversation_id,
        )

        response_messages = []
        for msg in messages_with_relationships:
            response_messages.append(
                MessageResponse(
                    id=msg["id"],
                    role=msg["role"],
                    content=msg["content"],
                    created_at=datetime.fromisoformat(msg["created_at"]),
                    tool_calls=[
                        ToolCallResponse(
                            id=tc["id"],
                            tool_name=tc["tool_name"],
                            parameters=tc["parameters"],
                            result=tc["result"],
                            executed_at=datetime.fromisoformat(tc["executed_at"]),
                        )
                        for tc in msg["tool_calls"]
                    ],
                )
            )

        return response_messages


# ============================================================================
# HISTORY SERVICE (T041-T045)
# ============================================================================


class HistoryService:
    """
    Service to manage conversation history reconstruction.

    Spec 008 Design:
    - Reconstruct full history per request
    - Maintain chronological order
    - Format for agent consumption
    - Validate context integrity
    """

    def __init__(self, session: Session):
        """Initialize service with database session"""
        self.session = session

    def get_conversation_history(
        self,
        conversation_id: str,
        limit: int = None,
    ) -> list:
        """
        Get conversation history in chronological order (T041).

        Spec 008 Design:
        - Core function for history reconstruction
        - Returns messages in oldest-first order
        - Used by agent to understand context
        - Respects limit for very large conversations

        Args:
            conversation_id: ID of conversation
            limit: Maximum messages to retrieve (defaults to config.MAX_HISTORY_MESSAGES)

        Returns:
            List of Message objects in chronological order (ASC by created_at)
        """
        from src.db import get_conversation_history as db_get_history
        from src import config

        if limit is None:
            limit = config.MAX_HISTORY_MESSAGES

        history = db_get_history(self.session, conversation_id, limit=limit)

        logger.info(
            f"Retrieved conversation history",
            extra={
                "conversation_id": conversation_id,
                "message_count": len(history),
            },
        )

        return history

    def verify_message_ordering(self, history: list) -> bool:
        """
        Verify messages are in chronological order (T042).

        Spec 008 Design:
        - Validates messages ordered by created_at ASC
        - Ensures consistent history reconstruction
        - Returns True if valid, False otherwise

        Args:
            history: List of Message objects to verify

        Returns:
            True if ordered correctly, False otherwise
        """
        if len(history) <= 1:
            return True

        for i in range(len(history) - 1):
            if history[i].created_at > history[i + 1].created_at:
                logger.warning(
                    f"Messages out of order: {history[i].id} after {history[i + 1].id}",
                )
                return False

        return True

    def format_for_agent(self, history: list) -> list:
        """
        Format conversation history for agent input (T030, T045).

        Spec 008 Design:
        - Converts database messages to agent-compatible format
        - Each message has 'role' (user/assistant) and 'content'
        - Maintains chronological ordering
        - Provides context for agent reasoning

        Args:
            history: List of Message objects from database

        Returns:
            List of dicts with 'role' and 'content' keys for agent
        """
        formatted = []
        for message in history:
            formatted.append({
                "role": message.role,
                "content": message.content,
            })

        logger.debug(
            f"Formatted {len(formatted)} messages for agent context",
        )

        return formatted

    def validate_context_integrity(self, history: list) -> bool:
        """
        Validate conversation history integrity for agent context (T045).

        Spec 008 Design:
        - Checks that messages exist and are readable
        - Verifies roles are valid (user/assistant)
        - Ensures content is present
        - Returns True if context valid, False otherwise

        Args:
            history: List of Message objects to validate

        Returns:
            True if context is valid, False otherwise
        """
        if not history:
            # Empty history is valid (new conversation)
            return True

        for msg in history:
            # Check message has required fields
            if not msg.id or not msg.role or not msg.content:
                logger.warning(f"Invalid message: missing required fields")
                return False

            # Check role is valid
            if msg.role not in ("user", "assistant"):
                logger.warning(f"Invalid message role: {msg.role}")
                return False

            # Check content is non-empty string
            if not isinstance(msg.content, str) or len(msg.content.strip()) == 0:
                logger.warning(f"Invalid message content: empty or not string")
                return False

        logger.debug(f"Context integrity validated for {len(history)} messages")
        return True

    def get_conversation_summary(self, conversation_id: str) -> dict:
        """
        Get summary statistics about conversation history.

        Useful for monitoring and validation.

        Args:
            conversation_id: ID of conversation

        Returns:
            Dictionary with:
            - message_count: Total messages
            - user_count: User messages
            - assistant_count: Assistant messages
            - earliest_message: Timestamp of first message
            - latest_message: Timestamp of last message
            - conversation_duration: Elapsed time
        """
        history = self.get_conversation_history(conversation_id)

        if not history:
            return {
                "message_count": 0,
                "user_count": 0,
                "assistant_count": 0,
                "earliest_message": None,
                "latest_message": None,
                "conversation_duration": None,
            }

        user_msgs = [m for m in history if m.role == "user"]
        asst_msgs = [m for m in history if m.role == "assistant"]

        earliest = history[0].created_at
        latest = history[-1].created_at
        duration = latest - earliest

        return {
            "message_count": len(history),
            "user_count": len(user_msgs),
            "assistant_count": len(asst_msgs),
            "earliest_message": earliest.isoformat(),
            "latest_message": latest.isoformat(),
            "conversation_duration": str(duration),
        }

    def get_recent_context(
        self,
        conversation_id: str,
        recent_messages_count: int = 10,
    ) -> list:
        """
        Get recent messages for agent context (alternative to full history).

        Useful for long conversations to reduce context size.

        Args:
            conversation_id: ID of conversation
            recent_messages_count: Number of recent messages to retrieve

        Returns:
            List of recent messages formatted for agent
        """
        history = self.get_conversation_history(conversation_id, limit=recent_messages_count)
        formatted = self.format_for_agent(history)

        logger.debug(
            f"Retrieved {len(formatted)} recent messages for context",
            extra={"conversation_id": conversation_id},
        )

        return formatted

    def reconstruct_with_validation(self, conversation_id: str) -> tuple:
        """
        Reconstruct history and validate integrity.

        Returns tuple of (history, is_valid).

        Args:
            conversation_id: ID of conversation

        Returns:
            Tuple of (Message list, validity boolean)
        """
        history = self.get_conversation_history(conversation_id)

        # Verify ordering
        if not self.verify_message_ordering(history):
            logger.error(f"History ordering verification failed")
            return history, False

        # Validate context
        if not self.validate_context_integrity(history):
            logger.error(f"Context integrity validation failed")
            return history, False

        logger.info(f"History reconstruction validated successfully")
        return history, True
