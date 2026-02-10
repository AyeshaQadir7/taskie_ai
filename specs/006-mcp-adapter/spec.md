# Feature Specification: MCP Adapter for Todo Operations

**Feature Branch**: `006-mcp-adapter`
**Created**: 2026-02-01
**Status**: Draft
**Input**: User description: "Spec 6 MCP Adapter for Todo Operations"

## Overview

This specification defines stateless MCP (Model Context Protocol) tools that expose existing todo task functionality for invocation by AI agents. The MCP tools are thin wrappers around existing backend task logic, enforcing user isolation and providing deterministic, well-documented interfaces.

**Scope boundaries**:
- IN SCOPE: MCP server implementation, tool definitions, user ownership enforcement, database persistence via existing SQLModel models
- OUT OF SCOPE: AI reasoning, intent parsing, chat UI, conversation storage, task business logic modifications

## User Scenarios & Testing

### User Story 1 - Agent Creates a Task (Priority: P1)

An AI agent receives a user intent to create a task (e.g., "Create a task to buy groceries"), interprets the intent, and invokes the `add_task` MCP tool with the user's ID, task title, and optional description. The tool creates the task in the database and returns the created task's ID, status, and title.

**Why this priority**: Creating tasks is the foundational operation. All other agent scenarios depend on task creation capability.

**Independent Test**: Can be fully tested by invoking `add_task(user_id="user123", title="Buy groceries", description="Milk, eggs, bread")` and verifying:
- Task is persisted in the database with the user_id
- Tool returns task_id, status (default: pending), and title
- Subsequent `list_tasks` call includes the newly created task

**Acceptance Scenarios**:

1. **Given** an AI agent acts on behalf of user_id="user123", **When** invoke `add_task` with title and description, **Then** tool returns task_id, status="pending", title, and task is stored in DB
2. **Given** an AI agent acts on behalf of user_id="user123", **When** invoke `add_task` with only title (no description), **Then** tool returns task with description=null and status="pending"
3. **Given** an AI agent invokes `add_task` with empty or null title, **Then** tool returns error: "Title is required"
4. **Given** an AI agent invokes `add_task` with title > 255 characters, **Then** tool returns error: "Title must be 255 characters or less"

---

### User Story 2 - Agent Lists User's Tasks (Priority: P1)

An AI agent invokes the `list_tasks` MCP tool to retrieve all tasks owned by the authenticated user. The tool returns a filtered list of tasks, optionally filtered by status (all, pending, completed).

**Why this priority**: Agents must be able to list tasks to understand the user's workload, inform task creation decisions, and provide status updates to users.

**Independent Test**: Can be fully tested by invoking `list_tasks(user_id="user123", status="all")` and verifying:
- All tasks owned by user123 are returned
- No tasks from other users are visible
- Each task includes id, title, status, created_at, updated_at
- Empty array is returned if user has no tasks

**Acceptance Scenarios**:

1. **Given** user_id="user123" has 3 pending tasks, **When** invoke `list_tasks(user_id="user123", status="all")`, **Then** tool returns array of 3 tasks with complete metadata
2. **Given** user_id="user123" has 0 tasks, **When** invoke `list_tasks(user_id="user123")`, **Then** tool returns empty array `[]`
3. **Given** user_id="user123" has 2 pending and 1 completed task, **When** invoke `list_tasks(user_id="user123", status="pending")`, **Then** tool returns array of 2 pending tasks only
4. **Given** user_id="user456" exists with different tasks, **When** invoke `list_tasks(user_id="user123")`, **Then** tool returns only user123's tasks, not user456's
5. **Given** `list_tasks` is invoked with invalid status filter, **When** status is not in ["all", "pending", "completed"], **Then** tool returns error: "Invalid status filter. Must be 'all', 'pending', or 'completed'"

---

### User Story 3 - Agent Updates a Task (Priority: P2)

An AI agent invokes the `update_task` MCP tool to modify an existing task's title, description, or both. The tool verifies the user owns the task, updates the database record, and returns the updated task.

**Why this priority**: Agents frequently need to modify task details in response to user feedback. Important but not critical for initial MVP.

**Independent Test**: Can be fully tested by invoking `update_task(user_id="user123", task_id=42, title="New Title")` and verifying:
- Task is updated in the database if user_id matches task ownership
- Tool returns updated task with new title and updated_at timestamp
- Tool returns 404/error if task doesn't exist or belongs to another user

**Acceptance Scenarios**:

1. **Given** user_id="user123" owns task_id=42 with title="Old Title", **When** invoke `update_task(user_id="user123", task_id=42, title="New Title")`, **Then** tool returns updated task with title="New Title" and new updated_at timestamp
2. **Given** user_id="user123" owns task_id=42, **When** invoke `update_task(user_id="user123", task_id=42, description="New description")`, **Then** tool returns task with updated description
3. **Given** user_id="user456" does NOT own task_id=42 (owned by user123), **When** invoke `update_task(user_id="user456", task_id=42, title="Hacked")`, **Then** tool returns error: "Task not found or access denied"
4. **Given** task_id=999 does not exist, **When** invoke `update_task(user_id="user123", task_id=999, title="Update")`, **Then** tool returns error: "Task not found"
5. **Given** user owns task_id=42, **When** invoke `update_task` with new title > 255 characters, **Then** tool returns error: "Title must be 255 characters or less"

---

### User Story 4 - Agent Marks Task as Completed (Priority: P2)

An AI agent invokes the `complete_task` MCP tool to mark a task as completed. The tool updates the task status to "completed" and returns the updated task.

**Why this priority**: Agents need to update task status in response to user confirmation (e.g., "Mark groceries as done"). High priority for interactive chatbot use case.

**Independent Test**: Can be fully tested by invoking `complete_task(user_id="user123", task_id=42)` and verifying:
- Task status changes from "pending" to "completed" in the database
- Tool returns task with status="completed" and updated_at timestamp
- User ownership is enforced (user cannot complete another user's task)

**Acceptance Scenarios**:

1. **Given** user_id="user123" owns task_id=42 with status="pending", **When** invoke `complete_task(user_id="user123", task_id=42)`, **Then** tool returns task with status="completed" and new updated_at
2. **Given** task_id=42 is already completed, **When** invoke `complete_task(user_id="user123", task_id=42)`, **Then** tool returns task with status="completed" (idempotent)
3. **Given** user_id="user456" does NOT own task_id=42, **When** invoke `complete_task(user_id="user456", task_id=42)`, **Then** tool returns error: "Task not found or access denied"
4. **Given** task_id=999 does not exist, **When** invoke `complete_task(user_id="user123", task_id=999)`, **Then** tool returns error: "Task not found"

---

### User Story 5 - Agent Deletes a Task (Priority: P3)

An AI agent invokes the `delete_task` MCP tool to remove a task. The tool verifies user ownership, removes the task from the database, and returns confirmation.

**Why this priority**: Users may request task deletion. Lower priority than create/list/complete, but important for full task lifecycle support.

**Independent Test**: Can be fully tested by invoking `delete_task(user_id="user123", task_id=42)` and verifying:
- Task is removed from the database
- Subsequent `list_tasks` call does not include the deleted task
- Subsequent `delete_task` call for the same task_id returns 404
- User ownership is enforced

**Acceptance Scenarios**:

1. **Given** user_id="user123" owns task_id=42, **When** invoke `delete_task(user_id="user123", task_id=42)`, **Then** tool returns confirmation and task is removed from database
2. **Given** task_id=42 was deleted, **When** invoke `delete_task(user_id="user123", task_id=42)` again, **Then** tool returns error: "Task not found"
3. **Given** user_id="user456" does NOT own task_id=42, **When** invoke `delete_task(user_id="user456", task_id=42)`, **Then** tool returns error: "Task not found or access denied"
4. **Given** task_id=999 does not exist, **When** invoke `delete_task(user_id="user123", task_id=999)`, **Then** tool returns error: "Task not found"

---

### Edge Cases

- What happens if the database connection fails during a tool invocation? Tools must return a structured error indicating "Database connection failed"
- What happens if a tool is invoked with missing required parameters? Tools must return error: "[parameter] is required"
- What happens if user_id is not provided or is empty? Tools must return error: "user_id is required"
- What happens if task_id is not a valid integer? Tools must return error: "task_id must be an integer"

## Requirements

### Functional Requirements

**MCP Tool: add_task**
- **FR-001**: Tool MUST accept inputs: user_id (string, required), title (string, required), description (string, optional)
- **FR-002**: Tool MUST create a task record in the database with status = "pending" and return task_id, status, title
- **FR-003**: Tool MUST validate that title is not empty and <= 255 characters
- **FR-004**: Tool MUST associate the created task with the provided user_id
- **FR-005**: Tool MUST return structured error if validation fails

**MCP Tool: list_tasks**
- **FR-006**: Tool MUST accept inputs: user_id (string, required), status (string, optional: "all" | "pending" | "completed")
- **FR-007**: Tool MUST return only tasks owned by the specified user_id
- **FR-008**: Tool MUST filter tasks by status if provided; default to "all"
- **FR-009**: Tool MUST return empty array if user has no tasks
- **FR-010**: Tool MUST return each task with: id, title, description, status, created_at, updated_at

**MCP Tool: update_task**
- **FR-011**: Tool MUST accept inputs: user_id (string, required), task_id (int, required), title (string, optional), description (string, optional)
- **FR-012**: Tool MUST verify that user_id owns task_id before updating
- **FR-013**: Tool MUST update only provided fields (title and/or description)
- **FR-014**: Tool MUST update the updated_at timestamp when task is modified
- **FR-015**: Tool MUST validate title <= 255 characters if provided
- **FR-016**: Tool MUST return error if task not found or user does not own task

**MCP Tool: complete_task**
- **FR-017**: Tool MUST accept inputs: user_id (string, required), task_id (int, required)
- **FR-018**: Tool MUST verify that user_id owns task_id before updating
- **FR-019**: Tool MUST update task status to "completed"
- **FR-020**: Tool MUST be idempotent (completing an already-completed task returns the same result)
- **FR-021**: Tool MUST return error if task not found or user does not own task

**MCP Tool: delete_task**
- **FR-022**: Tool MUST accept inputs: user_id (string, required), task_id (int, required)
- **FR-023**: Tool MUST verify that user_id owns task_id before deletion
- **FR-024**: Tool MUST remove the task record from the database
- **FR-025**: Tool MUST return error if task not found or user does not own task
- **FR-026**: Tool MUST return 404 on subsequent attempts to delete the same task_id

**Cross-Cutting Requirements**
- **FR-027**: All tools MUST be stateless (no in-process state; all operations persist to database)
- **FR-028**: All tools MUST enforce user isolation; tasks from other users must never be visible or modifiable
- **FR-029**: All tools MUST return structured errors in a consistent format: `{ "error": "error_message" }`
- **FR-030**: All tools MUST include input/output schemas in MCP tool definitions
- **FR-031**: MCP server MUST be independent and reusable by multiple agents/clients

### Key Entities

- **Task**: Represents a todo item. Attributes: id (int, primary key), user_id (string, foreign key), title (string, max 255), description (string, nullable), status (enum: pending|completed), created_at (timestamp), updated_at (timestamp)
- **User**: Implicit in all tool invocations via user_id parameter. Tools do not create or modify users; user_id is supplied by agents/API layer

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 5 MCP tools (add_task, list_tasks, update_task, complete_task, delete_task) are fully functional and accessible via MCP server
- **SC-002**: All tools enforce user ownership; tasks from other users cannot be accessed or modified
- **SC-003**: Tools provide stable, documented JSON schemas for inputs and outputs
- **SC-004**: MCP server runs independently and accepts tool invocation requests from agents
- **SC-005**: All tool invocations result in persistent database state changes (no in-memory-only updates)
- **SC-006**: Error handling is consistent and predictable; all errors return structured JSON with error message
- **SC-007**: Tool response times are < 500ms for typical operations (list, create, update, complete, delete)

## Assumptions

1. **Existing task schema**: The SQLModel Task model defined in the backend is sufficient for MCP tool implementation; no schema changes required
2. **User authentication**: user_id is provided by the requesting agent/API layer; MCP tools do not validate JWT or perform authentication
3. **Database connectivity**: Database connection is managed by the backend; MCP tools use the same connection pool
4. **Error message format**: Agents and clients expect structured JSON errors; response format is standardized
5. **Timestamp handling**: created_at and updated_at timestamps are managed by the database (e.g., PostgreSQL NOW() function)
6. **Status enum**: Task status is limited to "pending" and "completed"; no other statuses are supported in Phase 3

## Notes

- MCP tools are thin wrappers; all business logic (validation, authorization) is inherited from existing backend services
- MCP server is independent and can be deployed separately from the web backend
- Tools are designed for agent consumption; response format prioritizes machine readability over human readability
- No conversation or message history is stored by MCP tools; agents handle conversation persistence
