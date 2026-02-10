"""Main TodoAgent class using OpenAI Agents SDK.

This agent uses the OpenAI Agents SDK with the Responses API to interpret
natural language requests and invoke MCP tools to manage tasks.

It follows the Taskie Constitution principles:
- Stateless per-message operation
- No direct database access (via MCP tools only)
- Explicit tool calls (traceable and auditable)
"""

import logging
import asyncio
from typing import Any, Optional

from agents import Agent, Runner, function_tool, RunContextWrapper, OpenAIChatCompletionsModel
from pydantic import BaseModel, ConfigDict, SkipValidation
from openai import AsyncOpenAI

from agent_service_impl.config import Config, get_config
from agent_service_impl.tools.tool_invoker import invoke_mcp_tool, ToolInvocationError
from agent_service_impl.tools.response_formatter import ResponseFormatter

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Add console handler if not already present
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)


# System prompt defining Taskie's personality and capabilities
SYSTEM_INSTRUCTIONS = """You are Taskie, a friendly and helpful task management assistant.

Your capabilities:
- Add new tasks to the user's list
- Show/list tasks (all, pending, or completed)
- Mark tasks as complete
- Update task titles or descriptions
- Delete tasks

Guidelines:
- Be concise and friendly
- Use the provided tools to manage tasks
- Confirm actions after completing them
- For greetings and small talk, respond naturally without using tools
- If the user asks for help, explain what you can do

IMPORTANT - Task Identification:
- Users may refer to tasks by ID (e.g., "task 5", "55") or by title (e.g., "task abc", "the groceries task")
- When a user mentions a task by TITLE (not a number), first call list_tasks to find the matching task ID, then perform the requested action
- When a user says "mark abc as complete" and abc is not a number, search for a task with title "abc" in the task list
- If multiple tasks match the title, ask the user to specify which one by ID

IMPORTANT - Conversation Context:
- Pay attention to the conversation history
- If the user previously mentioned a specific task (e.g., "show me task 55") and then says "mark it complete" or "delete it", use the task ID from the previous context
- Pronouns like "it", "that task", "this one" refer to the most recently discussed task
- Don't ask for task ID again if it was just mentioned in the conversation

Always extract task IDs as strings. If the user mentions "task 1" or "the first task", use "1" as the task_id.
"""

# Alias for backwards compatibility with tests
SYSTEM_PROMPT = SYSTEM_INSTRUCTIONS


# Context class to pass configuration to tools
class AgentContext(BaseModel):
    """Context passed to agent tools."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    config: SkipValidation[Any]  # Skip validation to avoid module reload issues in tests
    user_id: str


# Define function tools using @function_tool decorator
@function_tool
async def add_task(
    ctx: RunContextWrapper[AgentContext],
    title: str,
    description: Optional[str] = None
) -> str:
    """Create a new task with a title and optional description.

    Args:
        title: Task title (required, max 255 characters)
        description: Task description (optional, max 2000 characters)
    """
    logger.info(f"add_task called with title='{title}', description='{description}'")

    try:
        result = await invoke_mcp_tool(
            tool_name="add_task",
            arguments={"title": title, "description": description},
            config=ctx.context.config,
            user_id=ctx.context.user_id,
        )

        if result.get("status") == "success":
            task = result.get("result", {})
            return f"Successfully added task '{title}' with ID {task.get('id', 'unknown')}."
        else:
            error = result.get("error", "Unknown error")
            return f"Failed to add task: {error}"

    except ToolInvocationError as e:
        logger.error(f"Tool invocation error: {e}")
        return f"Failed to add task: {str(e)}"


@function_tool
async def find_task_by_title(
    ctx: RunContextWrapper[AgentContext],
    title: str
) -> str:
    """Find a task by its title and return its ID. Use this when the user refers to a task by name instead of ID.

    Args:
        title: The title (or partial title) of the task to find
    """
    logger.info(f"find_task_by_title called with title='{title}'")

    try:
        result = await invoke_mcp_tool(
            tool_name="list_tasks",
            arguments={"status": "all"},
            config=ctx.context.config,
            user_id=ctx.context.user_id,
        )

        if result.get("status") == "success":
            tasks = result.get("result", {}).get("tasks", [])
            title_lower = title.lower()

            # Find exact match first
            exact_matches = [t for t in tasks if t.get("title", "").lower() == title_lower]
            if len(exact_matches) == 1:
                task = exact_matches[0]
                return f"Found task: ID={task.get('id')}, Title='{task.get('title')}', Status={task.get('status')}"

            # Find partial matches
            partial_matches = [t for t in tasks if title_lower in t.get("title", "").lower()]
            if len(partial_matches) == 1:
                task = partial_matches[0]
                return f"Found task: ID={task.get('id')}, Title='{task.get('title')}', Status={task.get('status')}"
            elif len(partial_matches) > 1:
                matches_str = "\n".join([f"- [{t.get('id')}] {t.get('title')}" for t in partial_matches])
                return f"Multiple tasks match '{title}':\n{matches_str}\nPlease specify which task by ID."
            else:
                return f"No task found with title containing '{title}'."
        else:
            error = result.get("error", "Unknown error")
            return f"Failed to search tasks: {error}"

    except ToolInvocationError as e:
        logger.error(f"Tool invocation error: {e}")
        return f"Failed to search tasks: {str(e)}"


@function_tool
async def list_tasks(
    ctx: RunContextWrapper[AgentContext],
    status: Optional[str] = None
) -> str:
    """List tasks with optional status filter.

    Args:
        status: Filter by status - 'pending', 'completed', or 'all' (default: all)
    """
    status = status or "all"
    logger.info(f"list_tasks called with status='{status}'")

    try:
        result = await invoke_mcp_tool(
            tool_name="list_tasks",
            arguments={"status": status},
            config=ctx.context.config,
            user_id=ctx.context.user_id,
        )

        if result.get("status") == "success":
            tasks = result.get("result", {}).get("tasks", [])
            if not tasks:
                return f"You have no {status} tasks." if status != "all" else "You have no tasks."

            task_list = []
            for task in tasks:
                task_status = "✓" if task.get("status") == "completed" else "-"
                task_list.append(
                    f"{task_status} [{task.get('id')}] {task.get('title')}"
                )
            return f"You have {len(tasks)} task(s):\n" + "\n".join(task_list)
        else:
            error = result.get("error", "Unknown error")
            return f"Failed to list tasks: {error}"

    except ToolInvocationError as e:
        logger.error(f"Tool invocation error: {e}")
        return f"Failed to list tasks: {str(e)}"


@function_tool
async def complete_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: str
) -> str:
    """Mark a task as completed.

    Args:
        task_id: The ID of the task to complete
    """
    logger.info(f"complete_task called with task_id='{task_id}'")

    try:
        result = await invoke_mcp_tool(
            tool_name="complete_task",
            arguments={"task_id": task_id},
            config=ctx.context.config,
            user_id=ctx.context.user_id,
        )

        if result.get("status") == "success":
            task = result.get("result", {})
            title = task.get("title", f"Task {task_id}")
            return f"Great! I've marked '{title}' as done."
        else:
            error_code = result.get("error_code", "")
            if error_code == "not_found":
                return f"I couldn't find task {task_id}. Would you like me to list your tasks?"
            error = result.get("error", "Unknown error")
            return f"Failed to complete task: {error}"

    except ToolInvocationError as e:
        logger.error(f"Tool invocation error: {e}")
        return f"Failed to complete task: {str(e)}"


@function_tool
async def update_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None
) -> str:
    """Update a task's title and/or description.

    Args:
        task_id: The ID of the task to update
        title: New task title (optional, max 255 characters)
        description: New task description (optional, max 2000 characters)
    """
    logger.info(f"update_task called with task_id='{task_id}', title='{title}', description='{description}'")

    arguments = {"task_id": task_id}
    if title:
        arguments["title"] = title
    if description:
        arguments["description"] = description

    try:
        result = await invoke_mcp_tool(
            tool_name="update_task",
            arguments=arguments,
            config=ctx.context.config,
            user_id=ctx.context.user_id,
        )

        if result.get("status") == "success":
            task = result.get("result", {})
            return f"Updated! Task {task_id} has been changed."
        else:
            error_code = result.get("error_code", "")
            if error_code == "not_found":
                return f"I couldn't find task {task_id}. Would you like me to list your tasks?"
            error = result.get("error", "Unknown error")
            return f"Failed to update task: {error}"

    except ToolInvocationError as e:
        logger.error(f"Tool invocation error: {e}")
        return f"Failed to update task: {str(e)}"


@function_tool
async def delete_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: str
) -> str:
    """Delete a task by ID.

    Args:
        task_id: The ID of the task to delete
    """
    logger.info(f"delete_task called with task_id='{task_id}'")

    try:
        result = await invoke_mcp_tool(
            tool_name="delete_task",
            arguments={"task_id": task_id},
            config=ctx.context.config,
            user_id=ctx.context.user_id,
        )

        if result.get("status") == "success":
            return f"Done! I've deleted task {task_id}."
        else:
            error_code = result.get("error_code", "")
            if error_code == "not_found":
                return f"I couldn't find task {task_id}. It may have already been deleted."
            error = result.get("error", "Unknown error")
            return f"Failed to delete task: {error}"

    except ToolInvocationError as e:
        logger.error(f"Tool invocation error: {e}")
        return f"Failed to delete task: {str(e)}"


class TodoAgent:
    """Natural language todo command agent using OpenAI Agents SDK.

    Uses the OpenAI Agents SDK with Responses API to process user messages,
    determine intent via function calling, and invoke MCP tools.

    Attributes:
        config: Configuration object
        model: OpenAI model to use (e.g., "gpt-4")
        agent: OpenAI Agents SDK Agent instance
    """

    def __init__(self, config: Optional[Config] = None):
        """Initialize the agent.

        Args:
            config: Configuration object (uses get_config() if not provided)
        """
        self.config = config or get_config()

        # Create OpenRouter client
        openrouter_client = AsyncOpenAI(
            api_key=self.config.OPENROUTER_API_KEY,
            base_url=self.config.OPENROUTER_BASE_URL,
        )

        # Create model using OpenRouter
        self.model = OpenAIChatCompletionsModel(
            model=self.config.AGENT_MODEL,
            openai_client=openrouter_client,
        )

        # Create the Agent with tools
        self.agent = Agent(
            name="Taskie",
            instructions=SYSTEM_INSTRUCTIONS,
            model=self.model,
            tools=[add_task, find_task_by_title, list_tasks, complete_task, update_task, delete_task],
        )

        # Store tool definitions for compatibility with tests
        self.tool_definitions = [
            {"type": "function", "function": {"name": "add_task"}},
            {"type": "function", "function": {"name": "find_task_by_title"}},
            {"type": "function", "function": {"name": "list_tasks"}},
            {"type": "function", "function": {"name": "complete_task"}},
            {"type": "function", "function": {"name": "update_task"}},
            {"type": "function", "function": {"name": "delete_task"}},
        ]

    def process_message(
        self,
        message: str,
        history: list = None,
        *,
        user_id: str = None,
        conversation_id: str = None
    ) -> str:
        """Process a user message and return an agent response.

        This is the main entry point for the agent. It uses the OpenAI
        Agents SDK to process the message with function calling.

        Args:
            message: User input message
            history: Optional conversation history
            user_id: Optional user ID for context
            conversation_id: Optional conversation ID for context

        Returns:
            Agent response message (friendly text for user)
        """
        try:
            logger.info(f"Received message: {message}")

            # Create context for tools
            context = AgentContext(
                config=self.config,
                user_id=user_id or self.config.USER_ID,
            )

            # Run the agent synchronously
            result = Runner.run_sync(
                self.agent,
                message,
                context=context,
            )

            response = result.final_output
            logger.info(f"Agent response: {response[:100]}..." if len(response) > 100 else f"Agent response: {response}")

            return response

        except Exception as e:
            logger.exception(f"Error processing message: {e}")
            return f"I'm having trouble right now. Please try again. Error: {str(e)}"

    async def process_message_async(
        self,
        message: str,
        history: list = None,
        *,
        user_id: str = None,
        conversation_id: str = None
    ) -> str:
        """Process a user message asynchronously.

        Args:
            message: User input message
            history: Optional conversation history
            user_id: Optional user ID for context
            conversation_id: Optional conversation ID for context

        Returns:
            Agent response message (friendly text for user)
        """
        try:
            logger.info(f"Received message (async): {message}")

            # Create context for tools
            context = AgentContext(
                config=self.config,
                user_id=user_id or self.config.USER_ID,
            )

            # Run the agent asynchronously
            result = await Runner.run(
                self.agent,
                message,
                context=context,
            )

            response = result.final_output
            logger.info(f"Agent response: {response[:100]}..." if len(response) > 100 else f"Agent response: {response}")

            return response

        except Exception as e:
            logger.exception(f"Error processing message: {e}")
            return f"I'm having trouble right now. Please try again. Error: {str(e)}"
