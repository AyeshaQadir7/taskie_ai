# Quick Start Guide: AI Agent Implementation

**Date**: 2026-02-02
**Feature**: Spec 007 - AI Agent & Tool-Selection Logic
**Purpose**: Get up and running with the agent in minimal steps

---

## Overview

This quickstart shows how to:
1. Set up the agent with OpenAI Agents SDK
2. Define tool functions
3. Configure MCP tool integration
4. Run sample agent interactions

---

## Prerequisites

- Python 3.13+
- OpenAI API key (gpt-4 or gpt-3.5-turbo)
- Spec 006 MCP server running (provides todo tools)
- `agent-service/` directory created

---

## Step 1: Install Dependencies

```bash
cd agent-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

**requirements.txt**:
```
openai>=1.0.0
pydantic>=2.0.0
httpx>=0.24.0
python-dotenv>=1.0.0
pytest>=7.0.0
pytest-asyncio>=0.23.0
```

---

## Step 2: Configure Environment

Create `.env`:
```
OPENAI_API_KEY=sk-...
MCP_TOOL_ENDPOINT=http://localhost:5000/mcp
USER_ID=user123
```

---

## Step 3: Define Tool Functions

File: `src/tools/tool_definitions.py`

```python
"""Tool definitions for OpenAI Agents SDK"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Create a new task with title and optional description",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Task title (max 255 characters)"
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional task description"
                    }
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "Retrieve user's tasks with optional status filter",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["all", "pending", "completed"],
                        "description": "Filter by status (default: all)"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "Mark a task as completed",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "ID of task to complete"
                    }
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update task title and/or description",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "ID of task to update"
                    },
                    "title": {
                        "type": "string",
                        "description": "New title (optional)"
                    },
                    "description": {
                        "type": "string",
                        "description": "New description (optional)"
                    }
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Delete a task",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "ID of task to delete"
                    }
                },
                "required": ["task_id"]
            }
        }
    }
]
```

---

## Step 4: Create Agent Class

File: `src/agent.py`

```python
"""AI Agent for todo management"""

import os
import json
from openai import OpenAI
from .tools.tool_definitions import TOOLS
from .tools.tool_invoker import invoke_mcp_tool

class TodoAgent:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4"
        self.user_id = os.getenv("USER_ID", "user123")
        self.tools = TOOLS

    def process_message(self, user_message: str) -> str:
        """Process user message and return agent response"""

        # System prompt
        system_prompt = """You are a helpful todo assistant. Your job is to:
1. Understand user intent (create task, list tasks, complete, update, delete)
2. Extract required parameters from the message
3. Invoke the appropriate tool
4. Return a friendly confirmation or explanation

## Tool Selection Rules:
- "add/create/new task" → add_task
- "list/show/view tasks" → list_tasks
- "complete/done/finish" → complete_task
- "update/change/edit" → update_task
- "delete/remove" → delete_task

## Important:
- For delete operations, ask for confirmation first
- If information is missing, ask the user
- Provide friendly messages with task names when possible
- Never make up information; only use what's provided or retrieved
"""

        messages = [
            {"role": "user", "content": user_message}
        ]

        # Call OpenAI with tools
        response = self.client.chat.completions.create(
            model=self.model,
            system=system_prompt,
            messages=messages,
            tools=self.tools,
            tool_choice="auto"
        )

        # Handle tool calls
        return self._handle_response(response, messages)

    def _handle_response(self, response, messages):
        """Process response and invoke tools if needed"""

        # If model wants to call a tool
        if response.choice[0].message.tool_calls:
            tool_calls = response.choice[0].message.tool_calls
            results = []

            for tool_call in tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)

                # Add user_id to all tool calls
                tool_args["user_id"] = self.user_id

                # Invoke MCP tool
                result = invoke_mcp_tool(tool_name, tool_args)
                results.append({
                    "tool_name": tool_name,
                    "result": result
                })

            # Get final response from model with tool results
            return self._format_response(tool_calls, results)

        # If model just provides text
        return response.choice[0].message.content

    def _format_response(self, tool_calls, results):
        """Format tool results into user message"""

        # Build response based on tool results
        responses = []
        for tool_result in results:
            tool_name = tool_result["tool_name"]
            result = tool_result["result"]

            if "error" in result:
                responses.append(
                    f"I couldn't perform that action: {result['error']}"
                )
            elif tool_name == "add_task":
                responses.append(
                    f"Got it! I've added '{result.get('title')}' to your tasks."
                )
            elif tool_name == "list_tasks":
                tasks = result.get("tasks", [])
                if not tasks:
                    responses.append("You don't have any tasks.")
                else:
                    responses.append(f"You have {len(tasks)} tasks:")
                    for i, task in enumerate(tasks, 1):
                        responses.append(
                            f"{i}. {task['title']} ({task['status']})"
                        )
            elif tool_name == "complete_task":
                responses.append(
                    f"Great! I've marked '{result.get('title')}' as done."
                )
            elif tool_name == "update_task":
                responses.append(
                    f"Updated! Task '{result.get('title')}' has been updated."
                )
            elif tool_name == "delete_task":
                responses.append(f"Deleted task {result.get('id')}.")

        return "\n".join(responses)


# Example usage
if __name__ == "__main__":
    agent = TodoAgent()

    # Test commands
    test_commands = [
        "Add task: Buy groceries",
        "Show my tasks",
        "Mark task 1 as done",
        "Update task 1 to 'Buy milk and eggs'",
    ]

    for command in test_commands:
        print(f"\nUser: {command}")
        response = agent.process_message(command)
        print(f"Agent: {response}")
```

---

## Step 5: Create Tool Invoker

File: `src/tools/tool_invoker.py`

```python
"""Invoke MCP tools via HTTP"""

import json
import httpx
import os

MCP_ENDPOINT = os.getenv("MCP_TOOL_ENDPOINT", "http://localhost:5000/mcp")

async def invoke_mcp_tool(tool_name: str, arguments: dict) -> dict:
    """Invoke an MCP tool and return result"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MCP_ENDPOINT}/tools/{tool_name}",
                json=arguments,
                timeout=5.0
            )

            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Tool error: {response.text}"}
    except Exception as e:
        return {"error": f"Failed to invoke tool: {str(e)}"}


def invoke_mcp_tool(tool_name: str, arguments: dict) -> dict:
    """Synchronous wrapper for tool invocation"""

    try:
        with httpx.Client() as client:
            response = client.post(
                f"{MCP_ENDPOINT}/tools/{tool_name}",
                json=arguments,
                timeout=5.0
            )

            if response.status_code == 200:
                result = response.json()
                # If result is JSON string, parse it
                if isinstance(result, str):
                    return json.loads(result)
                return result
            else:
                return {"error": f"Tool error: {response.text}"}
    except Exception as e:
        return {"error": f"Failed to invoke tool: {str(e)}"}
```

---

## Step 6: Test the Agent

Create `test_agent_quickstart.py`:

```python
"""Quick test of agent functionality"""

import sys
sys.path.insert(0, 'src')

from agent import TodoAgent

def test_agent():
    agent = TodoAgent()

    # Test 1: Add task
    print("\n=== Test 1: Add Task ===")
    response = agent.process_message("Add task: Buy groceries")
    print(f"Agent: {response}")
    assert "added" in response.lower()

    # Test 2: List tasks
    print("\n=== Test 2: List Tasks ===")
    response = agent.process_message("Show my tasks")
    print(f"Agent: {response}")

    # Test 3: Update task
    print("\n=== Test 3: Update Task ===")
    response = agent.process_message("Update task 1 to urgent")
    print(f"Agent: {response}")

    # Test 4: Complete task
    print("\n=== Test 4: Complete Task ===")
    response = agent.process_message("Mark task 1 done")
    print(f"Agent: {response}")

    # Test 5: Delete task (with confirmation)
    print("\n=== Test 5: Delete Task ===")
    response = agent.process_message("Delete task 1")
    print(f"Agent: {response}")

    print("\n=== All Tests Complete ===")

if __name__ == "__main__":
    test_agent()
```

Run tests:
```bash
python test_agent_quickstart.py
```

---

## Step 7: Deploy

```bash
# Start MCP server (in separate terminal)
cd mcp-server
python src/main.py

# Start agent service
cd agent-service
python -m uvicorn src.main:app --reload  # If using FastAPI
# OR
python src/agent.py  # If using CLI
```

---

## Example Interactions

### Example 1: Create and List

```
User: "Add task: Learn Python"
Agent: "Got it! I've added 'Learn Python' to your tasks."

User: "What are my tasks?"
Agent: "You have 1 tasks:
1. Learn Python (pending)"
```

### Example 2: Update and Complete

```
User: "Update task 1 to 'Learn Python - Advanced'"
Agent: "Updated! Task 'Learn Python - Advanced' has been updated."

User: "Mark it done"
Agent: "Great! I've marked 'Learn Python - Advanced' as done."
```

### Example 3: Error Handling

```
User: "Mark task 999 done"
Agent: "I couldn't perform that action: Task not found or access denied"

User: "Add task: " (incomplete)
Agent: "What's the task?"
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "OpenAI API key not found" | Set OPENAI_API_KEY in .env |
| "Connection refused to MCP server" | Start MCP server first (port 5000) |
| "Tool call failed" | Check MCP server logs |
| "Intent not recognized" | Try more explicit language |

---

## Next Steps

1. Run integration tests: `pytest tests/ -v`
2. Deploy agent service: See deployment guide
3. Connect to chat UI or CLI
4. Monitor performance and collect feedback

---

**Quickstart Complete!** 🎉

For detailed documentation, see:
- `spec.md`: Feature specification
- `plan.md`: Implementation plan
- `data-model.md`: Agent design model
