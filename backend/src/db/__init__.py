"""
Database CRUD operations module

Exposes all database operations for:
- Conversations (create, retrieve, list, update, delete)
- Messages (create, retrieve, reconstruct history)
- ToolCalls (create, retrieve, query with filtering)
"""

from src.db.conversations import (
    create_conversation,
    get_conversation,
    list_conversations,
    update_conversation_timestamp,
    delete_conversation,
    get_conversation_count,
)

from src.db.messages import (
    create_message,
    get_message,
    get_conversation_history,
    get_conversation_messages_with_relationships,
    list_conversation_messages,
    get_conversation_message_count,
    get_latest_message,
)

from src.db.tool_calls import (
    create_tool_call,
    get_tool_call,
    get_tool_calls_for_message,
    get_tool_calls_for_conversation,
    get_tool_calls_by_name,
    update_tool_call_result,
    get_tool_execution_stats,
)

__all__ = [
    # Conversations
    "create_conversation",
    "get_conversation",
    "list_conversations",
    "update_conversation_timestamp",
    "delete_conversation",
    "get_conversation_count",
    # Messages
    "create_message",
    "get_message",
    "get_conversation_history",
    "get_conversation_messages_with_relationships",
    "list_conversation_messages",
    "get_conversation_message_count",
    "get_latest_message",
    # ToolCalls
    "create_tool_call",
    "get_tool_call",
    "get_tool_calls_for_message",
    "get_tool_calls_for_conversation",
    "get_tool_calls_by_name",
    "update_tool_call_result",
    "get_tool_execution_stats",
]
