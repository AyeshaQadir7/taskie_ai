# Research: MCP Adapter for Todo Operations

**Date**: 2026-02-01 | **Feature**: [006-mcp-adapter](./spec.md) | **Status**: Phase 0 Complete

## Research Summary

This document consolidates findings from Phase 0 research on MCP SDK patterns, database design, error handling standards, and testing strategies for the MCP Adapter implementation.

---

## Topic 1: Official MCP SDK Best Practices

### Decision
Use the Official MCP SDK (https://github.com/modelcontextprotocol/python-sdk) for MCP server implementation.

### Rationale
- **Maintained by Anthropic**: Actively developed and supported for production use
- **Well-documented**: Comprehensive API documentation and examples
- **Agent compatibility**: Designed to work with Claude and other agent frameworks
- **Schema standardization**: Enforces consistent tool definitions and input/output contracts
- **Constitution alignment**: Explicitly required by Technology Lock-In principle (Principle X)

### Key Implementation Patterns
1. **Tool Definition**:
   ```python
   @server.call_tool()
   async def handle_add_task(arguments: dict) -> list:
       # Tool handler receives arguments as dict
       # Return list of [{"type": "text", "text": result_text}]
   ```

2. **Input Validation**:
   - MCP SDK validates against JSON Schema
   - Use Pydantic models for type-safe validation in handler
   - Return structured error if validation fails

3. **Error Handling**:
   - MCP SDK expects errors as exceptions
   - Tools should raise `ValueError` or custom exceptions
   - Server converts exceptions to MCP error responses

### Alternatives Considered & Rejected
- **LangChain tool definitions**: Would violate Constitution Principle X (Technology Lock-In); LangChain not in approved stack
- **Custom JSON-RPC protocol**: Would reinvent the wheel; Official MCP SDK already standardized

---

## Topic 2: Stateless Database Connection Pattern for MCP Tools

### Decision
Implement stateless database access using asyncpg connection pool with per-request acquire/release pattern.

### Rationale
- **Stateless principle**: Each tool invocation acquires connection, executes, releases
- **Connection pooling**: Efficient resource use across concurrent tool invocations
- **Isolation**: No transaction state spans multiple invocations
- **Failure recovery**: Connection errors are handled independently per tool call

### Implementation Pattern
```python
async def add_task_handler(arguments: dict, db_pool):
    # Acquire connection from pool
    async with db_pool.acquire() as conn:
        # Validate inputs
        user_id = arguments.get('user_id')
        title = arguments.get('title')

        # Execute query with user_id isolation
        result = await conn.execute(
            "INSERT INTO tasks (user_id, title, status, created_at) "
            "VALUES ($1, $2, 'pending', NOW()) "
            "RETURNING id, title, status, created_at",
            user_id, title
        )

        # Return result
        return {"task_id": result[0], "status": "pending", "title": title}
        # Connection automatically released when exiting context
```

### Alternatives Considered & Rejected
- **SQLAlchemy ORM**: More abstraction; adds complexity for simple CRUD operations
- **In-memory caching**: Violates stateless principle; could lead to stale data
- **Transaction spanning multiple tool calls**: Violates stateless principle; breaks isolation

---

## Topic 3: User Isolation & Ownership Enforcement

### Decision
Enforce user isolation at the database query level using `WHERE user_id = $user_id` filters on every operation.

### Rationale
- **Defense in depth**: Isolation enforced at database level, not just application logic
- **SQL injection prevention**: Parameterized queries prevent SQL injection
- **Constitutional requirement**: Principle IV (MCP-First Tooling) and Principle IV (User Isolation) mandate ownership enforcement
- **Consistency**: Same isolation pattern used across all 5 tools

### Implementation Pattern
```python
# List tasks - enforce user isolation
result = await conn.fetch(
    "SELECT id, title, description, status, created_at, updated_at "
    "FROM tasks "
    "WHERE user_id = $1 "
    "ORDER BY created_at DESC",
    user_id
)

# Update task - verify ownership before update
affected_rows = await conn.execute(
    "UPDATE tasks "
    "SET title = $2, description = $3, updated_at = NOW() "
    "WHERE id = $1 AND user_id = $4 "
    "RETURNING id",
    task_id, new_title, new_description, user_id
)

if affected_rows == 0:
    raise ValueError("Task not found or access denied")
```

### Alternatives Considered & Rejected
- **Application-level checks**: Could be bypassed if query logic is modified
- **Role-based access control (RBAC)**: Overkill for simple user isolation
- **No user_id parameter**: Would require authentication context in every tool call

---

## Topic 4: Structured Error Response Format

### Decision
All tool errors return a consistent JSON error format: `{ "error": "error_message" }`

### Rationale
- **Machine-readable**: Agents can parse errors programmatically
- **Simple and clear**: Single error field, no nested structures
- **Constitutional requirement**: Principle VII (Tool Invocation Discipline) specifies structured error handling
- **Consistent with spec**: Specification (FR-029) requires consistent error format

### Implementation Pattern
```python
async def add_task_handler(arguments: dict, db_pool):
    try:
        # Validate required fields
        user_id = arguments.get('user_id')
        title = arguments.get('title')

        if not user_id:
            raise ValueError("user_id is required")

        if not title:
            raise ValueError("Title is required")

        if len(title) > 255:
            raise ValueError("Title must be 255 characters or less")

        # Execute tool...

    except ValueError as e:
        return [{"type": "text", "text": f'{{"error": "{str(e)}"}}'}]
    except Exception as e:
        return [{"type": "text", "text": f'{{"error": "Database error: {str(e)}"}}'}]
```

### Error Categories Defined in Spec
- **Input validation errors** (FR-003, FR-015): "Title is required", "Title must be 255 characters or less"
- **Resource not found errors** (FR-016, FR-021, FR-025): "Task not found"
- **Authorization errors** (FR-016, FR-021, FR-025): "Task not found or access denied" (generic to prevent information leakage)
- **Database errors**: "Database connection failed" (generic)

### Alternatives Considered & Rejected
- **HTTP status codes**: MCP tools are not HTTP endpoints; status codes not applicable
- **Exception objects**: Agents would need to parse exception type; JSON is simpler
- **Nested error structure**: { "error": { "code": 400, "message": "..." } } adds complexity

---

## Topic 5: Testing Strategy for Stateless MCP Tools

### Decision
Implement two-level testing: unit tests with mocked database, integration tests with real PostgreSQL.

### Rationale
- **Unit tests**: Validate business logic, input validation, error handling without database dependency
- **Integration tests**: Verify end-to-end tool behavior, user isolation, database persistence
- **Speed vs. coverage**: Unit tests run fast (< 1s); integration tests run slower but catch real issues

### Unit Test Pattern (Mocked Database)
```python
# tests/test_add_task.py
import pytest
from unittest.mock import AsyncMock, patch
from src.tools.add_task import add_task_handler

@pytest.mark.asyncio
async def test_add_task_valid_input():
    mock_pool = AsyncMock()
    mock_conn = AsyncMock()
    mock_pool.acquire.return_value.__aenter__.return_value = mock_conn

    # Mock database execute
    mock_conn.execute.return_value = (42,)  # task_id

    arguments = {
        'user_id': 'user123',
        'title': 'Buy groceries',
        'description': 'Milk and eggs'
    }

    result = await add_task_handler(arguments, mock_pool)

    # Verify call was made with correct parameters
    mock_conn.execute.assert_called_once()
    assert result['task_id'] == 42
    assert result['status'] == 'pending'
```

### Integration Test Pattern (Real PostgreSQL)
```python
# tests/test_add_task_integration.py
@pytest.mark.asyncio
async def test_add_task_persists_to_database(db_pool):
    arguments = {
        'user_id': 'user123',
        'title': 'Buy groceries'
    }

    result = await add_task_handler(arguments, db_pool)
    task_id = result['task_id']

    # Verify task exists in database
    async with db_pool.acquire() as conn:
        task = await conn.fetchrow(
            "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
            task_id, 'user123'
        )

    assert task is not None
    assert task['title'] == 'Buy groceries'
```

### User Isolation Test Pattern
```python
# tests/test_user_isolation.py
@pytest.mark.asyncio
async def test_user_cannot_access_other_users_tasks(db_pool):
    # User A creates a task
    args_a = {'user_id': 'userA', 'title': 'Task A'}
    result_a = await add_task_handler(args_a, db_pool)
    task_id_a = result_a['task_id']

    # User B lists their tasks (should not see Task A)
    args_b = {'user_id': 'userB', 'status': 'all'}
    result_b = await list_tasks_handler(args_b, db_pool)

    # Verify User B's task list is empty
    assert len(result_b) == 0

    # User B cannot update User A's task
    update_args = {
        'user_id': 'userB',
        'task_id': task_id_a,
        'title': 'Hacked'
    }

    with pytest.raises(ValueError, match="Task not found or access denied"):
        await update_task_handler(update_args, db_pool)
```

### Alternatives Considered & Rejected
- **Unit tests only**: Would miss database interaction bugs and isolation issues
- **Integration tests only**: Would be slow and fragile; difficult to isolate individual failures
- **Manual testing**: Not reproducible; difficult to catch regressions

---

## Topic 6: Async/Await vs. Threading

### Decision
Use async/await pattern with asyncpg for I/O-efficient database access.

### Rationale
- **Concurrency without threads**: Single event loop handles multiple concurrent tool invocations
- **Resource efficiency**: No thread overhead; asyncio tasks are lightweight
- **Connection pooling**: Async connections can be reused across invocations
- **Python ecosystem alignment**: FastAPI, SQLAlchemy async, and MCP SDK all support async

### Implementation Pattern
```python
# MCP server startup
async def main():
    # Initialize connection pool
    db_pool = await asyncpg.create_pool(
        dsn=os.getenv('DATABASE_URL'),
        min_size=5,
        max_size=20,
        command_timeout=60
    )

    # Start MCP server
    server = Server("mcp-adapter")

    @server.call_tool()
    async def handle_add_task(arguments: dict):
        return await add_task_handler(arguments, db_pool)

    # MCP server loop
    async with server:
        await server.wait_for_shutdown()
```

### Alternatives Considered & Rejected
- **Threading**: Would require thread-safe database connections; more complexity
- **Sync (blocking) pattern**: Would block event loop; inefficient for concurrent invocations

---

## Topic 7: Schema & Migration Strategy

### Decision
No schema changes; use existing Task table from backend SQLModel.

### Rationale
- **Constitution alignment**: Spec explicitly states "no modification to existing task schemas"
- **Shared models**: MCP tools and FastAPI backend share same Task entity
- **Minimal duplication**: Reuse existing SQLModel definitions

### Existing Schema (from backend)
```python
# From backend Task model (SQLModel)
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str  # Foreign key to User
    title: str    # Max 255 characters
    description: Optional[str] = None
    status: str   # "pending" or "completed"
    created_at: datetime
    updated_at: datetime
```

### Migration Strategy
- No new migrations needed
- MCP tools use existing task table
- If schema changes needed in future, FastAPI backend will handle migrations

---

## Summary Table

| Topic | Decision | Key Implementation Detail |
|-------|----------|--------------------------|
| MCP SDK | Official MCP SDK | Use mcp package from Anthropic |
| Database | asyncpg connection pool | Stateless per-request acquire/release |
| User Isolation | WHERE user_id = $user_id | Enforced at database query level |
| Errors | JSON format { "error": "msg" } | Consistent across all tools |
| Testing | Unit + Integration tests | Mocked DB for units, real DB for integration |
| Concurrency | Async/await | asyncpg, asyncio, MCP SDK all async-native |
| Schema | No changes | Reuse existing Task table from backend |

---

## Next Steps

- **Phase 1**: Design outputs (data-model.md, contracts/, quickstart.md)
- **Implementation**: Begin tool handler development in order (list_tasks → add_task → update_task → complete_task → delete_task)
- **Testing**: Implement unit and integration tests for each tool
