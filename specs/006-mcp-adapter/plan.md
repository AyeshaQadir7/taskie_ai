# Implementation Plan: MCP Adapter for Todo Operations

**Branch**: `006-mcp-adapter` | **Date**: 2026-02-01 | **Spec**: [MCP Adapter Specification](./spec.md)
**Input**: Feature specification from `specs/006-mcp-adapter/spec.md`

## Summary

Build an independent MCP (Model Context Protocol) server that exposes existing todo task functionality as stateless tools for AI agent invocation. The MCP server will implement 5 tools (add_task, list_tasks, update_task, complete_task, delete_task) as thin adapters over the existing FastAPI backend's task models and services. All operations enforce user ownership via user_id and persist to PostgreSQL. The server will run independently and accept tool invocations from agents via the MCP protocol.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: Official MCP SDK (mcp), SQLModel (ORM access), pydantic (schema validation), asyncio (stateless async operations)
**Storage**: Neon Serverless PostgreSQL (existing database; no schema changes)
**Testing**: pytest (unit tests), pytest-asyncio (async test support)
**Target Platform**: Linux server (same as FastAPI backend)
**Project Type**: Service (MCP server independent from FastAPI backend)
**Performance Goals**: < 500ms response time for typical operations (list, create, update, complete, delete)
**Constraints**: Stateless (no in-memory state); all state mutations persist to database immediately
**Scale/Scope**: Support 5 MCP tools; handle concurrent agent requests; enforce user isolation on every operation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Spec-First Development (Principle I)
- ✅ PASS: Specification defines all 5 MCP tools with explicit inputs, outputs, and error cases
- ✅ PASS: All functional requirements (FR-001 through FR-031) are detailed and testable
- ✅ PASS: Success criteria are measurable and technology-agnostic

### Strict Separation of Concerns (Principle II)
- ✅ PASS: MCP tools are thin wrappers; no AI logic, no UI concerns
- ✅ PASS: Tools do not modify database directly; they call existing backend services
- ✅ PASS: AI agents invoke tools via MCP; agents do not access MCP server internals
- ⚠️ CLARIFICATION: Backend services (existing task models/logic) must be reusable by MCP layer
  - Design decision: MCP tools will use the same SQLModel Task model and existing service logic from the backend
  - This respects separation: tools are thin adapters, not reimplementation

### Stateless Architecture Enforcement (Principle III)
- ✅ PASS: MCP server will be stateless; all tool state persists to PostgreSQL
- ✅ PASS: No conversation history in MCP server; agents handle conversation persistence
- ✅ PASS: Each tool invocation includes user_id context; no reliance on prior requests

### MCP-First Tooling (Principle IV)
- ✅ PASS: All 5 tools are defined; agents will invoke only these tools
- ✅ PASS: Tools enforce user ownership on every operation
- ✅ PASS: No agent direct database access (enforced by MCP server design)

### Agent Autonomy with Guardrails (Principle V)
- ✅ PASS: Tools accept user_id parameter; agents decide when/which tools to invoke
- ✅ PASS: Tools validate inputs and return structured errors
- ✅ PASS: Complete_task and delete_task tools handle destructive operations safely

### Natural Language → Tool Mapping (Principle VI)
- ℹ️ NOTE: Not applicable to MCP server design; applies to agent layer
- ✅ PASS: Tool contracts are deterministic and discoverable via MCP schema

### Tool Invocation Discipline (Principle VII)
- ✅ PASS: Tools return structured responses with metadata
- ✅ PASS: Error handling is consistent (JSON error format)
- ✅ PASS: Tools do not hallucinate task IDs; agents provide task_id

### Conversation Integrity (Principle VIII)
- ℹ️ NOTE: Not applicable to MCP server; agents handle conversation persistence

### No Manual Coding (Principle IX)
- ✅ PASS: All code will be generated via Claude Code agents from this plan

### Technology Lock-In (Principle X)
- ✅ PASS: Official MCP SDK (mandatory per constitution)
- ✅ PASS: SQLModel ORM (same as backend)
- ✅ PASS: Neon Serverless PostgreSQL (existing database)
- ✅ PASS: No alternative technologies used

### Explicit Deliverables (Principle XI)
- ✅ PASS: MCP server code in `/mcp-server/`
- ✅ PASS: Tool implementations with user ownership enforcement
- ✅ PASS: Tool contracts documented in OpenAPI-style schema

**Constitution Check Result**: ✅ PASS – All principles satisfied; no violations or deviations required.

## Project Structure

### Documentation (this feature)

```text
specs/006-mcp-adapter/
├── spec.md                      # Feature specification
├── plan.md                       # This file (implementation plan)
├── research.md                   # Phase 0 research (TBD)
├── data-model.md                 # Phase 1 data model (TBD)
├── contracts/                    # Phase 1 MCP tool contracts (TBD)
│   ├── add_task.json
│   ├── list_tasks.json
│   ├── update_task.json
│   ├── complete_task.json
│   └── delete_task.json
├── quickstart.md                 # Phase 1 quickstart (TBD)
└── checklists/
    └── requirements.md           # Quality checklist (validated)
```

### Source Code (repository root)

```text
mcp-server/                        # New MCP server (independent from backend)
├── src/
│   ├── __init__.py
│   ├── main.py                   # MCP server entry point
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── add_task.py           # add_task tool handler
│   │   ├── list_tasks.py         # list_tasks tool handler
│   │   ├── update_task.py        # update_task tool handler
│   │   ├── complete_task.py      # complete_task tool handler
│   │   └── delete_task.py        # delete_task tool handler
│   ├── models/
│   │   ├── __init__.py
│   │   ├── task.py               # Task SQLModel (shared with backend)
│   │   └── schemas.py            # Pydantic schemas for tool I/O
│   ├── db/
│   │   ├── __init__.py
│   │   └── connection.py         # PostgreSQL connection pool
│   └── errors/
│       ├── __init__.py
│       └── handlers.py           # Standard error responses
├── tests/
│   ├── __init__.py
│   ├── test_add_task.py          # Tests for add_task tool
│   ├── test_list_tasks.py        # Tests for list_tasks tool
│   ├── test_update_task.py       # Tests for update_task tool
│   ├── test_complete_task.py     # Tests for complete_task tool
│   ├── test_delete_task.py       # Tests for delete_task tool
│   └── conftest.py               # pytest fixtures and setup
├── README.md                      # MCP server documentation
├── requirements.txt               # Python dependencies
├── pyproject.toml                 # Project metadata
└── .env.example                   # Environment variables template
```

**Structure Decision**:
- MCP server is a separate, independent service (not part of the FastAPI backend)
- Tools are organized by operation (add_task.py, list_tasks.py, etc.)
- Models are shared from backend where possible (Task SQLModel)
- Database connection is pooled and reused across tool invocations (stateless per-request design)
- Tests are organized by tool and cover positive, negative, and edge cases

## Implementation Phases

### Phase 0: Research & Dependency Analysis

**Outputs**: `research.md`

1. **MCP SDK Research**
   - Review Official MCP SDK documentation
   - Identify tool definition patterns and best practices
   - Evaluate schema validation approach (JSON Schema vs Pydantic)
   - Decision: Use Official MCP SDK with Pydantic for input validation

2. **Database Connection Strategy**
   - Evaluate connection pooling options (asyncpg connection pool, SQLAlchemy)
   - Determine stateless connection pattern (acquire connection, use, release)
   - Decision: Use asyncpg connection pool for direct SQL queries or SQLAlchemy async session for ORM

3. **Error Handling Standards**
   - Define structured error response format (JSON with error code and message)
   - Evaluate HTTP status code mapping for MCP (if applicable)
   - Decision: All errors return JSON: `{ "error": "error_message" }`

4. **Testing Strategy**
   - Integration tests against real PostgreSQL database (using test fixtures)
   - Mock database for unit tests of tool logic
   - Decision: Use pytest with pytest-asyncio for async test support

### Phase 1: Design & Contracts

**Outputs**: `data-model.md`, `contracts/`, `quickstart.md`

1. **Data Model Documentation** (`data-model.md`)
   - Document Task entity (fields, relationships, validation rules)
   - Document user_id scoping and ownership model
   - Define state transitions (pending → completed)

2. **MCP Tool Contracts** (`contracts/`)
   - Define tool schemas in JSON format (compatible with MCP SDK)
   - For each tool (add_task, list_tasks, update_task, complete_task, delete_task):
     - Input schema (required parameters, types, constraints)
     - Output schema (response fields, types)
     - Error schema (possible error messages)
   - Example: `add_task.json` will document:
     - Inputs: user_id (string), title (string), description (string, optional)
     - Outputs: task_id, status, title, created_at
     - Errors: "Title is required", "Title must be 255 characters or less"

3. **Quickstart Guide** (`quickstart.md`)
   - Install dependencies (mcp, sqlmodel, asyncpg)
   - Configure environment variables (DATABASE_URL)
   - Start MCP server
   - Example: invoke add_task tool via MCP client
   - Verify tool execution and database persistence

4. **Agent Context Update**
   - Update agent guidance with MCP tool definitions
   - Document tool invocation patterns for agents
   - Provide examples of tool usage (when to invoke, parameter mapping)

## Implementation Strategy

### Approach: Thin Wrapper Pattern

Each MCP tool will be a thin wrapper around existing backend logic:

```
Agent Intent → Tool Invocation → MCP Server → Tool Handler → Backend Service/SQLModel → PostgreSQL
```

1. **Tool Handler Responsibilities**:
   - Parse input parameters (user_id, task_id, title, description, status)
   - Call backend service or SQLModel ORM directly
   - Enforce user ownership (WHERE user_id = $user_id)
   - Return structured response or error

2. **Shared Resources**:
   - Task SQLModel model (shared from backend)
   - PostgreSQL connection pool (new, independent of backend)
   - Error handling utilities (new, shared across all tools)

3. **Stateless Design**:
   - No tool state persists in memory
   - Each tool invocation acquires database connection, executes operation, returns result
   - Database changes are committed immediately (no transaction context spanning multiple invocations)

### Tool Implementation Order

1. **list_tasks** (dependency for agents to understand workload)
2. **add_task** (core creation operation)
3. **update_task** (refinement operation)
4. **complete_task** (status transition)
5. **delete_task** (cleanup operation)

### Testing Strategy

Each tool will have:
- **Unit tests**: Mock database, test input validation and business logic
- **Integration tests**: Real PostgreSQL, test end-to-end tool invocation
- **Ownership tests**: Verify user isolation (user A cannot see/modify user B's tasks)
- **Edge case tests**: Invalid parameters, missing required fields, database errors

## Key Decisions

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| Official MCP SDK | Constitution requires it; well-maintained and documented | Custom MCP protocol implementation would be fragile |
| Separate mcp-server/ directory | Allows independent deployment and scaling | Embedding in FastAPI would violate separation of concerns |
| Async/await pattern | Efficient resource use; matches Python async ecosystem | Threaded approach would waste resources on I/O wait |
| Pydantic for input validation | Type-safe; integrates well with MCP SDK | Manual validation is error-prone |
| User-scoped queries (WHERE user_id = $user_id) | Enforces isolation at database level | Application-level checks could be bypassed if query is modified |
| Structured error responses (JSON) | Agents can parse errors programmatically | Human-readable errors would require agents to parse text |

## Complexity Tracking

> No Constitution Check violations or deviations required. All implementation follows constitutional principles.

---

**Next Phase**: Phase 1 design outputs (data-model.md, contracts/, quickstart.md) will be generated during execution.
