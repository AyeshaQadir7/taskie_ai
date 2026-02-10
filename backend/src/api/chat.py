"""
Chat API endpoints - Stateless conversation interface (Spec 008 - T025-T034)

Implements:
- POST /api/{user_id}/chat - Send message and get agent response
- Per-request history reconstruction
- Message persistence before/after agent execution
- Tool call logging and response formatting
"""

import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from src.database import get_session
from src.schemas import ChatRequest, ChatResponse, MessageResponse
from src.services import ConversationService
from src.auth.jwt_deps import verify_path_user_id
from src.auth.auth_context import AuthenticatedUser
from src import config
from src.logging_config import set_request_context, clear_request_context
import uuid

router = APIRouter(prefix="/api", tags=["Chat"])

logger = logging.getLogger("chat")

# Initialize agent lazily on first use
_agent_cache = {}

def _clear_agent_cache():
    """Clear the agent cache to force reinitialization."""
    global _agent_cache
    _agent_cache = {}
    logger.info("Agent cache cleared - will reinitialize on next request")

def _get_agent():
    """Get or initialize the agent service."""
    if 'agent' in _agent_cache:
        return _agent_cache['agent']

    try:
        # Import the agent service directly
        from agent_service_impl.config import get_config as agent_get_config
        from agent_service_impl.agent import TodoAgent

        config = agent_get_config(skip_validation=True)
        agent_instance = TodoAgent(config)
        _agent_cache['agent'] = agent_instance
        logger.info(f"Agent service initialized with model: {config.AGENT_MODEL}")
        return agent_instance
    except Exception as e:
        logger.error(f"Failed to initialize agent service: {e}", exc_info=True)
        _agent_cache['agent'] = None
        return None


def get_conversation_service(session: Session = Depends(get_session)) -> ConversationService:
    """Dependency to get ConversationService instance"""
    return ConversationService(session)


# ============================================================================
# User Story 1: Start New Conversation (T025-T034)
# ============================================================================


@router.post(
    "/{user_id}/chat",
    status_code=200,
    response_model=ChatResponse,
    responses={
        200: {"description": "Chat message processed successfully"},
        400: {"model": dict, "description": "Validation error"},
        401: {"model": dict, "description": "Unauthorized"},
        403: {"model": dict, "description": "Forbidden"},
        408: {"model": dict, "description": "Agent timeout"},
        500: {"model": dict, "description": "Server error"},
    },
)
async def chat(
    user_id: str,
    request: ChatRequest,
    service: ConversationService = Depends(get_conversation_service),
    current_user: AuthenticatedUser = Depends(verify_path_user_id),
) -> ChatResponse:
    """
    Send a message to the AI agent and get a response.

    Spec 008 Stateless Chat Endpoint - Implements full conversation flow:
    1. Create or load conversation
    2. Persist user message BEFORE agent execution
    3. Reconstruct conversation history
    4. Invoke agent with history
    5. Persist assistant response and tool calls
    6. Return full conversation to client

    **Request**:
    - **message**: User message to send (required, 1-5000 characters)
    - **conversation_id**: Optional ID of existing conversation (creates new if not provided)

    **Response**:
    - **status**: "success" or "error"
    - **conversation_id**: ID of conversation (new or existing)
    - **messages**: Full conversation history in chronological order
    - **error_code**: Error code if status is "error"

    **Authentication**: Requires valid JWT token in Authorization header

    **User Isolation**: user_id from URL path is verified against JWT token

    **Performance**:
    - Agent response timeout: 30 seconds (configurable)
    - History retrieval: <100ms for typical conversations
    - Total endpoint time: <5 seconds (Spec 008 success criterion)

    **Statelessness**:
    - Server holds zero in-memory conversation state
    - All data persisted to database immediately
    - Safe from server crashes or restarts
    - Enables horizontal scaling
    """
    # Set up request context for logging
    request_id = str(uuid.uuid4())
    set_request_context(request_id, user_id)

    try:
        logger.info(
            f"Chat request received",
            extra={"user_id": user_id, "has_conversation_id": bool(request.conversation_id)},
        )

        # Get agent (initialize if needed)
        agent = _get_agent()

        # ====================================================================
        # T026: Create or load conversation (with ownership validation)
        # ====================================================================
        try:
            conversation = service.get_or_create_conversation(
                user_id=user_id,
                conversation_id=request.conversation_id,
            )
        except ValueError as e:
            logger.warning(
                f"Failed to get/create conversation: {str(e)}",
                extra={"user_id": user_id},
            )
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Conversation not found",
                    "message": str(e),
                    "error_code": "CONVERSATION_NOT_FOUND",
                },
            )

        logger.info(
            f"Using conversation: {conversation.id}",
            extra={"conversation_id": conversation.id},
        )

        # ====================================================================
        # T027: Persist user message BEFORE agent execution
        # ====================================================================
        user_message = service.persist_user_message(
            conversation.id,
            request.message,
        )

        # ====================================================================
        # T029-T030: Reconstruct conversation history from database
        # ====================================================================
        history = service.reconstruct_conversation_history(conversation.id)
        formatted_history = service.format_history_for_agent(history)

        logger.info(
            f"Reconstructed history with {len(history)} messages",
            extra={"conversation_id": conversation.id},
        )

        # ====================================================================
        # T031: Invoke agent with conversation history
        # ====================================================================
        if agent is None:
            logger.error("Agent service not available")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Service unavailable",
                    "message": "Agent service is not available",
                    "error_code": "AGENT_UNAVAILABLE",
                },
            )

        try:
            # Call agent with timeout
            agent_task = asyncio.create_task(
                asyncio.to_thread(
                    agent.process_message,
                    request.message,
                    formatted_history,
                    user_id=user_id,
                    conversation_id=conversation.id,
                )
            )

            # Wait for agent response with timeout
            timeout = config.AGENT_TIMEOUT
            agent_response = await asyncio.wait_for(agent_task, timeout=timeout)

            logger.info(
                f"Agent response received",
                extra={"conversation_id": conversation.id},
            )

        except asyncio.TimeoutError:
            logger.error(
                f"Agent execution timeout after {config.AGENT_TIMEOUT}s",
                extra={"conversation_id": conversation.id},
            )
            raise HTTPException(
                status_code=408,
                detail={
                    "error": "Agent timeout",
                    "message": f"Agent did not respond within {config.AGENT_TIMEOUT} seconds",
                    "error_code": "AGENT_TIMEOUT",
                },
            )
        except Exception as e:
            logger.error(
                f"Agent execution failed: {str(e)}",
                extra={"conversation_id": conversation.id},
            )
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Agent error",
                    "message": f"Agent failed to process message: {str(e)}",
                    "error_code": "AGENT_ERROR",
                },
            )

        # ====================================================================
        # T033: Extract tool calls from agent response
        # ====================================================================
        # Agent response should be a dict with 'content' and optional 'tool_calls'
        if isinstance(agent_response, dict):
            agent_content = agent_response.get("content", str(agent_response))
            tool_calls_data = agent_response.get("tool_calls", [])
        else:
            agent_content = str(agent_response)
            tool_calls_data = []

        # ====================================================================
        # T032: Persist assistant response and tool calls AFTER agent execution
        # ====================================================================
        assistant_message = service.persist_assistant_response(
            conversation.id,
            agent_content,
            tool_calls_data=tool_calls_data if tool_calls_data else None,
        )

        # Update conversation activity timestamp
        service.update_conversation_activity(conversation.id)

        # ====================================================================
        # T034: Format and return full conversation in response
        # ====================================================================
        messages = service.get_full_conversation_response(conversation.id)

        logger.info(
            f"Chat request completed successfully",
            extra={
                "conversation_id": conversation.id,
                "total_messages": len(messages),
            },
        )

        return ChatResponse(
            status="success",
            conversation_id=conversation.id,
            messages=messages,
        )

    except HTTPException:
        # Re-raise HTTP exceptions (validation, auth, etc.)
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in chat endpoint: {str(e)}",
            extra={"user_id": user_id},
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": "An unexpected error occurred",
                "error_code": "INTERNAL_ERROR",
            },
        )
    finally:
        clear_request_context()


# ============================================================================
# User Story 2: Continue Conversation (Additional endpoints)
# ============================================================================


@router.get(
    "/{user_id}/conversations",
    status_code=200,
    responses={
        200: {"description": "List of conversations"},
        401: {"model": dict, "description": "Unauthorized"},
        403: {"model": dict, "description": "Forbidden"},
    },
)
async def list_conversations(
    user_id: str,
    skip: int = 0,
    limit: int = 50,
    service: ConversationService = Depends(get_conversation_service),
    current_user: AuthenticatedUser = Depends(verify_path_user_id),
):
    """
    List all conversations for the authenticated user.

    Returns conversations ordered by most recent activity first.

    **Query Parameters**:
    - **skip**: Number of conversations to skip (pagination)
    - **limit**: Maximum conversations to return (default 50, max 100)
    """
    from src.db import list_conversations as db_list_conversations

    conversations = db_list_conversations(
        service.session,
        user_id,
        skip=skip,
        limit=min(limit, 100),
    )

    return [
        {
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
        }
        for conv in conversations
    ]


@router.get(
    "/{user_id}/conversations/{conversation_id}/history",
    status_code=200,
    responses={
        200: {"description": "Conversation history"},
        401: {"model": dict, "description": "Unauthorized"},
        403: {"model": dict, "description": "Forbidden"},
        404: {"model": dict, "description": "Conversation not found"},
    },
)
async def get_conversation_history(
    user_id: str,
    conversation_id: str,
    skip: int = 0,
    limit: int = 50,
    service: ConversationService = Depends(get_conversation_service),
    current_user: AuthenticatedUser = Depends(verify_path_user_id),
) -> ChatResponse:
    """
    Get full conversation history with pagination.

    Returns all messages in chronological order with nested tool calls.

    **Path Parameters**:
    - **user_id**: Authenticated user ID
    - **conversation_id**: ID of conversation to retrieve

    **Query Parameters**:
    - **skip**: Number of messages to skip
    - **limit**: Maximum messages to return (default 50)
    """
    from src.db import get_conversation as db_get_conversation

    # Verify conversation exists and belongs to user
    conversation = db_get_conversation(service.session, conversation_id, user_id)
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Conversation not found",
                "message": f"Conversation {conversation_id} not found",
                "error_code": "CONVERSATION_NOT_FOUND",
            },
        )

    messages = service.get_full_conversation_response(conversation_id)

    # Apply pagination
    messages = messages[skip : skip + limit]

    return ChatResponse(
        status="success",
        conversation_id=conversation_id,
        messages=messages,
    )


# ============================================================================
# Development: Agent reload endpoint
# ============================================================================


@router.post(
    "/dev/reload-agent",
    status_code=200,
    responses={
        200: {"description": "Agent reloaded successfully"},
    },
)
async def reload_agent():
    """
    Development endpoint to reload the agent service.

    Clears the agent cache and reimports agent modules to pick up code changes.
    """
    import importlib
    import sys

    # Clear the agent cache
    _clear_agent_cache()

    # Reimport agent modules to pick up changes
    modules_to_reload = [
        'agent_service_impl.handlers.intent_handler',
        'agent_service_impl.handlers.parameter_extractor',
        'agent_service_impl.tools.response_formatter',
        'agent_service_impl.tools.tool_invoker',
        'agent_service_impl.tools.tool_definitions',
        'agent_service_impl.agent',
    ]

    reloaded = []
    for module_name in modules_to_reload:
        try:
            if module_name in sys.modules:
                importlib.reload(sys.modules[module_name])
                reloaded.append(module_name)
            else:
                # Module not loaded yet - import it first
                importlib.import_module(module_name)
                reloaded.append(f"{module_name} (imported)")
        except Exception as e:
            logger.error(f"Failed to reload {module_name}: {e}")

    # Force reinitialize agent on next request
    _get_agent()

    return {
        "status": "success",
        "message": "Agent reloaded",
        "reloaded_modules": reloaded,
    }
