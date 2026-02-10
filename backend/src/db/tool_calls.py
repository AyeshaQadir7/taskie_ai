"""
CRUD operations for ToolCall model (T016)

Implements database operations for:
- Creating tool call records from agent execution
- Retrieving tool calls for audit trail
- Listing tool calls with filtering
- Querying tool execution history
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import Session, select

from src.models import ToolCall


def create_tool_call(
    session: Session,
    message_id: int,
    tool_name: str,
    parameters: dict,
    result: Optional[dict] = None,
) -> ToolCall:
    """
    Create a tool call record.

    Spec 008 Design:
    - Created during or immediately after agent execution
    - Persists both input parameters and execution result
    - Immutable record for compliance and audit trail
    - JSONB storage for arbitrary tool payloads

    Args:
        session: Database session
        message_id: ID of message that triggered this tool call
        tool_name: Name of the tool called (e.g., "get_weather")
        parameters: Input parameters to the tool (JSONB)
        result: Tool execution result (JSONB), can be None if not yet executed

    Returns:
        Created ToolCall object

    Raises:
        sqlalchemy.exc.IntegrityError: If message_id doesn't exist
    """
    tool_call = ToolCall(
        message_id=message_id,
        tool_name=tool_name,
        parameters=parameters,
        result=result,
        executed_at=datetime.now(timezone.utc),
    )
    session.add(tool_call)
    session.commit()
    session.refresh(tool_call)
    return tool_call


def get_tool_call(
    session: Session,
    tool_call_id: int,
) -> Optional[ToolCall]:
    """
    Get a tool call by ID.

    Args:
        session: Database session
        tool_call_id: ID of tool call to retrieve

    Returns:
        ToolCall object or None if not found
    """
    return session.exec(select(ToolCall).where(ToolCall.id == tool_call_id)).first()


def get_tool_calls_for_message(
    session: Session,
    message_id: int,
) -> List[ToolCall]:
    """
    Get all tool calls for a specific message.

    Spec 008 Design:
    - Used to retrieve tool calls included in a message response
    - Included in API response for client visibility
    - Part of conversation history

    Args:
        session: Database session
        message_id: ID of message to get tool calls for

    Returns:
        List of ToolCall objects for this message
    """
    statement = select(ToolCall).where(ToolCall.message_id == message_id)
    return session.exec(statement).all()


def get_tool_calls_for_conversation(
    session: Session,
    conversation_id: str,
) -> List[dict]:
    """
    Get all tool calls for a conversation with message and conversation context.

    Spec 008 Design:
    - Used for conversation audit trail
    - Shows all tools used during conversation
    - Useful for analyzing conversation patterns

    Args:
        session: Database session
        conversation_id: ID of conversation to get tool calls for

    Returns:
        List of tool call dictionaries with context
    """
    from src.models import Message

    statement = (
        select(ToolCall, Message)
        .join(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(ToolCall.executed_at.desc())
    )

    results = session.exec(statement).all()

    return [
        {
            "tool_call_id": tc.id,
            "message_id": tc.message_id,
            "tool_name": tc.tool_name,
            "parameters": tc.parameters,
            "result": tc.result,
            "executed_at": tc.executed_at.isoformat(),
            "message_role": msg.role,
            "message_content": msg.content,
        }
        for tc, msg in results
    ]


def get_tool_calls_by_name(
    session: Session,
    conversation_id: str,
    tool_name: str,
) -> List[ToolCall]:
    """
    Get all calls to a specific tool in a conversation.

    Useful for:
    - Analyzing tool usage patterns
    - Debugging specific tool behavior
    - Generating tool usage statistics

    Args:
        session: Database session
        conversation_id: ID of conversation
        tool_name: Name of tool to filter by

    Returns:
        List of ToolCall objects for the specified tool
    """
    from src.models import Message

    statement = (
        select(ToolCall)
        .join(Message)
        .where(
            (Message.conversation_id == conversation_id)
            & (ToolCall.tool_name == tool_name)
        )
        .order_by(ToolCall.executed_at.desc())
    )

    return session.exec(statement).all()


def update_tool_call_result(
    session: Session,
    tool_call_id: int,
    result: dict,
) -> Optional[ToolCall]:
    """
    Update tool call result (if result wasn't available at creation time).

    Use case:
    - Tool calls with async results
    - Deferred result processing

    Args:
        session: Database session
        tool_call_id: ID of tool call to update
        result: Result dictionary to set

    Returns:
        Updated ToolCall object or None if not found
    """
    tool_call = session.exec(select(ToolCall).where(ToolCall.id == tool_call_id)).first()

    if tool_call:
        tool_call.result = result
        session.add(tool_call)
        session.commit()
        session.refresh(tool_call)

    return tool_call


def get_tool_execution_stats(
    session: Session,
    conversation_id: str,
) -> dict:
    """
    Get statistics about tool execution in a conversation.

    Returns:
    - Total tool calls made
    - Unique tools used
    - Tool call frequency breakdown
    - Success/failure counts (if tracked in result)

    Args:
        session: Database session
        conversation_id: ID of conversation

    Returns:
        Dictionary with execution statistics
    """
    tool_calls = get_tool_calls_for_conversation(session, conversation_id)

    tool_names = {}
    for tc in tool_calls:
        tool_name = tc["tool_name"]
        tool_names[tool_name] = tool_names.get(tool_name, 0) + 1

    return {
        "total_tool_calls": len(tool_calls),
        "unique_tools": len(tool_names),
        "tools_used": tool_names,
    }
