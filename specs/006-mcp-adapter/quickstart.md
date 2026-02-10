# Quickstart Guide: MCP Adapter for Todo Operations

**Date**: 2026-02-01 | **Feature**: [006-mcp-adapter](./spec.md) | **Phase**: 1 Design

## Overview

This guide walks through setting up and using the MCP Adapter server. The MCP Adapter exposes 5 task management tools (add_task, list_tasks, update_task, complete_task, delete_task) that AI agents can invoke.

---

## Installation

### Prerequisites
- Python 3.11+
- PostgreSQL (Neon Serverless or local instance)
- pip or poetry for dependency management

### Step 1: Clone or Create Project Structure

```bash
# Create mcp-server directory
mkdir -p mcp-server/src/tools
cd mcp-server
```

### Step 2: Install Dependencies

**Option A: Using pip**

```bash
pip install \
  mcp>=0.1.0 \
  sqlmodel>=0.0.14 \
  asyncpg>=0.29.0 \
  pydantic>=2.0.0 \
  python-dotenv>=1.0.0
```

**Option B: Using requirements.txt**

```bash
cat > requirements.txt << 'EOF'
mcp>=0.1.0
sqlmodel>=0.0.14
asyncpg>=0.29.0
pydantic>=2.0.0
python-dotenv>=1.0.0
pytest>=7.0.0
pytest-asyncio>=0.23.0
EOF

pip install -r requirements.txt
```

### Step 3: Configure Environment

Create `.env` file with database connection:

```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/todos
# Or for Neon Serverless:
# DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/todos
EOF
```

---

## Project Structure

```
mcp-server/
├── src/
│   ├── __init__.py
│   ├── main.py                    # MCP server entry point
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── add_task.py
│   │   ├── list_tasks.py
│   │   ├── update_task.py
│   │   ├── complete_task.py
│   │   └── delete_task.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── task.py                # Task SQLModel
│   │   └── schemas.py             # Pydantic schemas
│   ├── db/
│   │   ├── __init__.py
│   │   └── connection.py          # PostgreSQL connection pool
│   └── errors/
│       ├── __init__.py
│       └── handlers.py            # Error response utilities
├── tests/
│   ├── __init__.py
│   ├── test_add_task.py
│   ├── test_list_tasks.py
│   ├── test_update_task.py
│   ├── test_complete_task.py
│   ├── test_delete_task.py
│   └── conftest.py
├── README.md
├── requirements.txt
├── .env.example
└── pyproject.toml
```

---

## Starting the MCP Server

### Step 1: Start the Server

```bash
python src/main.py
```

**Expected output:**

```
MCP Adapter Server starting...
Database connection pool initialized (min: 5, max: 20)
MCP server listening on stdio
Tools registered: add_task, list_tasks, update_task, complete_task, delete_task
Ready for agent connections
```

### Step 2: Verify Server is Running

The server runs indefinitely, waiting for tool invocations from agents. It does not expose HTTP endpoints; it communicates via the MCP protocol over stdin/stdout.

---

## Using the MCP Tools

### Via MCP Client (Python Example)

```python
import asyncio
from mcp import Client
import json

async def main():
    # Connect to MCP server
    async with Client("python", ["src/main.py"]) as client:

        # Initialize tools
        await client.initialize()

        # Invoke add_task tool
        result = await client.call_tool("add_task", {
            "user_id": "user123",
            "title": "Buy groceries",
            "description": "Milk, eggs, bread"
        })

        print("Created task:", result)

        # Invoke list_tasks tool
        result = await client.call_tool("list_tasks", {
            "user_id": "user123",
            "status": "all"
        })

        print("User's tasks:", result)

asyncio.run(main())
```

### Via OpenAI Agents SDK (Example)

```python
from openai import OpenAI
import json

client = OpenAI(api_key="sk-...")

# Define tools from MCP adapter
tools = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Create a new task",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "title": {"type": "string"},
                    "description": {"type": "string"}
                },
                "required": ["user_id", "title"]
            }
        }
    },
    # ... other tools ...
]

# Use agent to call tools
messages = [
    {"role": "user", "content": "Create a task to buy groceries"}
]

response = client.chat.completions.create(
    model="gpt-4",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

# Agent will invoke tools (e.g., add_task) based on user intent
```

---

## Tool Invocation Examples

### Example 1: Create a Task

**Input:**
```json
{
  "user_id": "user123",
  "title": "Review project proposal",
  "description": "Read and comment on Q1 roadmap document"
}
```

**Output:**
```json
{
  "task_id": 42,
  "title": "Review project proposal",
  "status": "pending",
  "created_at": "2026-02-01T15:30:00Z"
}
```

### Example 2: List All Tasks

**Input:**
```json
{
  "user_id": "user123"
}
```

**Output:**
```json
{
  "tasks": [
    {
      "id": 42,
      "title": "Review project proposal",
      "description": "Read and comment on Q1 roadmap document",
      "status": "pending",
      "created_at": "2026-02-01T15:30:00Z",
      "updated_at": "2026-02-01T15:30:00Z"
    },
    {
      "id": 41,
      "title": "Attend team standup",
      "description": null,
      "status": "completed",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-01T14:00:00Z"
    }
  ]
}
```

### Example 3: Complete a Task

**Input:**
```json
{
  "user_id": "user123",
  "task_id": 42
}
```

**Output:**
```json
{
  "id": 42,
  "title": "Review project proposal",
  "status": "completed",
  "updated_at": "2026-02-01T16:00:00Z"
}
```

### Example 4: Update a Task

**Input:**
```json
{
  "user_id": "user123",
  "task_id": 42,
  "title": "Review and approve project proposal"
}
```

**Output:**
```json
{
  "id": 42,
  "title": "Review and approve project proposal",
  "status": "pending",
  "updated_at": "2026-02-01T16:05:00Z"
}
```

### Example 5: Delete a Task

**Input:**
```json
{
  "user_id": "user123",
  "task_id": 42
}
```

**Output:**
```json
{
  "id": 42,
  "status": "deleted"
}
```

---

## Verifying Functionality

### Unit Tests

```bash
# Run all unit tests
pytest tests/ -v

# Run specific tool tests
pytest tests/test_add_task.py -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

### Integration Tests

```bash
# Ensure PostgreSQL is running and DATABASE_URL is set
pytest tests/ -m integration -v
```

### Manual Testing

```bash
# Start MCP server
python src/main.py &

# Create test script
python << 'EOF'
import asyncio
from mcp import Client

async def test():
    async with Client("python", ["src/main.py"]) as client:
        await client.initialize()

        # Test add_task
        result = await client.call_tool("add_task", {
            "user_id": "test_user",
            "title": "Test task"
        })
        print("✓ add_task:", result)

        # Test list_tasks
        result = await client.call_tool("list_tasks", {
            "user_id": "test_user"
        })
        print("✓ list_tasks:", result)

asyncio.run(test())
EOF

# Kill MCP server
kill %1
```

---

## User Ownership Enforcement

All tools enforce user isolation:

```python
# User A creates a task
result_a = await client.call_tool("add_task", {
    "user_id": "userA",
    "title": "Task A"
})
task_id = result_a["task_id"]

# User B attempts to see Task A (should not appear in list)
result_b = await client.call_tool("list_tasks", {
    "user_id": "userB"
})
# result_b["tasks"] will be empty

# User B attempts to update Task A (should fail)
try:
    await client.call_tool("update_task", {
        "user_id": "userB",
        "task_id": task_id,
        "title": "Hacked"
    })
except Exception as e:
    print("✓ Access denied:", e)  # "Task not found or access denied"
```

---

## Database Schema

The MCP Adapter uses the existing Task table from the backend:

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for user_id queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

---

## Error Handling

All tool errors return structured JSON:

```json
{
  "error": "error_message"
}
```

**Common Errors:**
- `"user_id is required"` - Missing user_id parameter
- `"Title is required"` - Missing title in add_task
- `"Title must be 255 characters or less"` - Title too long
- `"task_id must be an integer"` - Invalid task_id type
- `"Task not found or access denied"` - Task doesn't exist or user doesn't own it
- `"Database connection failed"` - PostgreSQL connection error

---

## Performance Considerations

- **Response time target**: < 500ms for typical operations
- **Connection pooling**: 5-20 connections in pool (configurable)
- **Statefulness**: Completely stateless; safe to run multiple instances
- **Concurrency**: Supports unlimited concurrent agent invocations

---

## Next Steps

1. **Implement tool handlers** (add_task.py, list_tasks.py, etc.)
2. **Write tests** for each tool
3. **Deploy MCP server** as independent service
4. **Integrate with agent** (OpenAI Agents SDK or Claude)
5. **Monitor performance** and adjust connection pool size as needed

For detailed implementation info, see [Data Model](./data-model.md) and [Tool Contracts](./contracts/).
