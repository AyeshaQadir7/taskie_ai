# Data Model: MCP Adapter for Todo Operations

**Date**: 2026-02-01 | **Feature**: [006-mcp-adapter](./spec.md) | **Phase**: 1 Design

## Overview

The MCP Adapter uses a single Task entity, shared with the FastAPI backend. No new entities or schema changes are required. All operations enforce user isolation via user_id.

---

## Entity: Task

### Purpose
Represents a todo item owned by a user. MCP tools mutate and read this entity via parameterized SQL queries.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Integer (Primary Key) | Auto-generated, Unique | Task identifier returned to agents |
| `user_id` | String (Foreign Key) | Required, Non-null | Identifies task owner; used in all WHERE clauses |
| `title` | String | Required, Max 255 chars | Task name; provided by agent |
| `description` | String | Optional, Nullable | Additional task details; may be null |
| `status` | String (Enum) | "pending" or "completed" | Task state; default "pending"; modified by complete_task tool |
| `created_at` | Timestamp | Auto-set by database | ISO 8601 format; set at task creation |
| `updated_at` | Timestamp | Auto-updated | ISO 8601 format; updated on any modification |

### User Isolation Model

Every query includes `WHERE user_id = $user_id` filter:

```sql
-- Example: List tasks for user123
SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC;
-- Parameter: $1 = 'user123'
```

**Enforcement Level**: Database-level (not application-level)
**Benefit**: Prevents unauthorized access even if query logic is modified

### State Transitions

```
[Task Created]
      ↓
   pending
      ↓
   completed
```

- **Initial state**: `pending` (set by add_task tool)
- **Transition**: `pending` → `completed` (via complete_task tool)
- **Idempotent**: complete_task on already-completed task returns the task unchanged

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `user_id` | Required; non-empty string | "user_id is required" |
| `title` | Required; non-empty; max 255 chars | "Title is required" or "Title must be 255 characters or less" |
| `description` | Optional; max 5000 chars | "Description must be 5000 characters or less" |
| `status` | Enum: "pending", "completed" | "Invalid status" |
| `task_id` (for updates/deletes) | Required; must be integer; must exist; must belong to user | "task_id must be an integer" or "Task not found" |

---

## MCP Tool Data Flows

### Tool: add_task

**Input Schema**:
```json
{
  "user_id": "string (required)",
  "title": "string (required, max 255)",
  "description": "string (optional)"
}
```

**Validation**:
1. user_id is provided and non-empty → error if missing
2. title is provided and non-empty → error if missing
3. title length ≤ 255 → error if too long

**Database Operation**:
```sql
INSERT INTO tasks (user_id, title, description, status, created_at, updated_at)
VALUES ($1, $2, $3, 'pending', NOW(), NOW())
RETURNING id, title, status, created_at;
```

**Output Schema**:
```json
{
  "task_id": "integer",
  "title": "string",
  "status": "string (always 'pending')",
  "created_at": "ISO 8601 timestamp"
}
```

**State Change**: New row inserted in tasks table with user_id, title, description, status='pending'

---

### Tool: list_tasks

**Input Schema**:
```json
{
  "user_id": "string (required)",
  "status": "string (optional: 'all', 'pending', 'completed')"
}
```

**Validation**:
1. user_id is provided and non-empty → error if missing
2. status is 'all', 'pending', 'completed', or null → error if invalid

**Database Operation** (with status filter):
```sql
-- If status = 'all' or null:
SELECT id, title, description, status, created_at, updated_at
FROM tasks
WHERE user_id = $1
ORDER BY created_at DESC;

-- If status = 'pending':
SELECT id, title, description, status, created_at, updated_at
FROM tasks
WHERE user_id = $1 AND status = 'pending'
ORDER BY created_at DESC;

-- If status = 'completed':
SELECT id, title, description, status, created_at, updated_at
FROM tasks
WHERE user_id = $1 AND status = 'completed'
ORDER BY created_at DESC;
```

**Output Schema**:
```json
{
  "tasks": [
    {
      "id": "integer",
      "title": "string",
      "description": "string or null",
      "status": "string ('pending' or 'completed')",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ]
}
```

**State Change**: No state change (read-only operation)

---

### Tool: update_task

**Input Schema**:
```json
{
  "user_id": "string (required)",
  "task_id": "integer (required)",
  "title": "string (optional, max 255)",
  "description": "string (optional)"
}
```

**Validation**:
1. user_id is provided and non-empty → error if missing
2. task_id is provided and is an integer → error if missing or invalid type
3. title length ≤ 255 (if provided) → error if too long
4. At least one of title or description must be provided → error if neither

**Database Operation**:
```sql
-- Update both title and description (if both provided)
UPDATE tasks
SET title = $2, description = $3, updated_at = NOW()
WHERE id = $1 AND user_id = $4
RETURNING id, title, status, updated_at;

-- Update only title (if description not provided)
UPDATE tasks
SET title = $2, updated_at = NOW()
WHERE id = $1 AND user_id = $4
RETURNING id, title, status, updated_at;

-- Update only description (if title not provided)
UPDATE tasks
SET description = $2, updated_at = NOW()
WHERE id = $1 AND user_id = $4
RETURNING id, title, status, updated_at;
```

**Output Schema**:
```json
{
  "id": "integer",
  "title": "string",
  "status": "string",
  "updated_at": "ISO 8601 timestamp"
}
```

**State Change**: Modifies task row (title and/or description); updates updated_at timestamp. No change to user_id or status.

**Ownership Check**: `WHERE ... AND user_id = $4` ensures only task owner can update. Returns 0 affected rows if user doesn't own task → error "Task not found or access denied"

---

### Tool: complete_task

**Input Schema**:
```json
{
  "user_id": "string (required)",
  "task_id": "integer (required)"
}
```

**Validation**:
1. user_id is provided and non-empty → error if missing
2. task_id is provided and is an integer → error if missing or invalid type

**Database Operation**:
```sql
UPDATE tasks
SET status = 'completed', updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING id, title, status, updated_at;
```

**Output Schema**:
```json
{
  "id": "integer",
  "title": "string",
  "status": "string (always 'completed')",
  "updated_at": "ISO 8601 timestamp"
}
```

**State Change**: Sets status = 'completed'; updates updated_at timestamp. Idempotent: completing an already-completed task returns the same result.

**Ownership Check**: `WHERE ... AND user_id = $2` ensures only task owner can complete. Returns 0 affected rows if user doesn't own task → error "Task not found or access denied"

---

### Tool: delete_task

**Input Schema**:
```json
{
  "user_id": "string (required)",
  "task_id": "integer (required)"
}
```

**Validation**:
1. user_id is provided and non-empty → error if missing
2. task_id is provided and is an integer → error if missing or invalid type

**Database Operation**:
```sql
DELETE FROM tasks
WHERE id = $1 AND user_id = $2
RETURNING id;
```

**Output Schema**:
```json
{
  "id": "integer",
  "status": "deleted"
}
```

**State Change**: Removes task row from database. Subsequent queries will not return this task.

**Ownership Check**: `WHERE ... AND user_id = $2` ensures only task owner can delete. Returns 0 affected rows if user doesn't own task → error "Task not found or access denied"

**Idempotency**: Deleting an already-deleted task returns error "Task not found" (not 0 affected rows, but an explicit error)

---

## Relationships & Dependencies

### Task ↔ User (Implicit)

- **Cardinality**: One user : Many tasks
- **Foreign Key**: user_id in tasks table
- **Enforcement**: Not a SQL foreign key constraint (User table may be in auth service); enforced by MCP tools via parameterized queries

### No Other Relationships

Tasks do not have dependencies on other entities. No nested entities, no comments, no attachments, no task categories.

---

## Timestamps & Timezone Handling

- **Database Timezone**: UTC (PostgreSQL default)
- **Timestamp Format**: ISO 8601 (e.g., "2026-02-01T12:34:56.000000Z")
- **created_at**: Set once at task creation; never modified
- **updated_at**: Set at creation; updated whenever task is modified (title, description, status)

---

## Persistence & Atomicity

### Per-Tool Atomicity

Each tool operation is atomic at the SQL level:

- **add_task**: Single INSERT statement; either succeeds (task created) or fails (returns error)
- **list_tasks**: Single SELECT statement; returns consistent snapshot
- **update_task**: Single UPDATE statement; either succeeds (task updated) or fails (returns error)
- **complete_task**: Single UPDATE statement; either succeeds (status changed) or fails (returns error)
- **delete_task**: Single DELETE statement; either succeeds (task deleted) or fails (returns error)

### No Multi-Tool Transactions

MCP tools are stateless; no transaction context spans multiple tool invocations. Each tool is independent.

---

## Error Conditions & State Consistency

| Condition | Error | State Impact |
|-----------|-------|--------------|
| user_id missing | "user_id is required" | No state change |
| task_id missing (for update/delete) | "task_id must be an integer" | No state change |
| title missing (for add_task) | "Title is required" | No state change |
| title > 255 chars | "Title must be 255 characters or less" | No state change |
| Task not found | "Task not found" | No state change |
| Task owned by other user | "Task not found or access denied" | No state change |
| Database connection error | "Database connection failed" | No state change |

All errors leave database in consistent state (no partial writes, no orphaned rows).

---

## Query Performance Considerations

| Query | Index Strategy | Expected Performance |
|-------|-----------------|----------------------|
| list_tasks: SELECT ... WHERE user_id = $1 | Index on (user_id, created_at) | O(log n); < 100ms for 10k tasks |
| add_task: INSERT ... | Primary key auto-increment | O(1); < 50ms |
| update_task: UPDATE ... WHERE id = $1 AND user_id = $2 | Primary key on id; index on user_id | O(log n); < 100ms |
| complete_task: UPDATE ... WHERE id = $1 AND user_id = $2 | Primary key on id; index on user_id | O(log n); < 100ms |
| delete_task: DELETE ... WHERE id = $1 AND user_id = $2 | Primary key on id; index on user_id | O(log n); < 100ms |

Note: Index creation is responsibility of backend; MCP tools assume indexes exist.

---

## Next Steps

- Generate MCP tool contracts (data/contracts/)
- Implement tool handlers using this data model
- Write tests verifying data model constraints
