# Implementation Plan: Task Due Dates & Deadlines

**Branch**: `009-task-due-dates` | **Date**: 2026-02-10 | **Spec**: [Task Due Dates & Deadlines](spec.md)
**Input**: Feature specification from `specs/009-task-due-dates/spec.md`

## Summary

Extend the existing Task model with a nullable `due_date` field to enable deadline tracking, overdue detection, and visual priority indicators. This feature adds temporal awareness to tasks without background jobs or notifications—all logic is database-driven and computed at runtime when tasks are retrieved. The implementation spans database schema migration, backend API enhancements (sorting/filtering by due_date), and frontend UI updates (due date picker, status labels, visual indicators). User ownership rules are respected; tasks remain isolated by user_id.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript with Next.js 16+ (frontend), PostgreSQL 14+
**Primary Dependencies**: FastAPI 0.104+, SQLModel 0.0.14+, Next.js 16+, Tailwind CSS, Pydantic v2
**Storage**: Neon Serverless PostgreSQL (extends existing schema)
**Testing**: pytest 7.4+, Jest (frontend)
**Target Platform**: Linux/Unix server (backend), Modern browsers (frontend)
**Project Type**: Web application (full-stack enhancement to existing app)
**Performance Goals**: Sub-200ms for single-task operations; sub-500ms for listing 100+ tasks; sorting/filtering by due_date adds O(1) database index overhead
**Constraints**: Stateless authentication (JWT), all queries scoped to authenticated user_id, timezone-aware date handling, no background jobs
**Scale/Scope**: Existing multi-user SaaS application (10k users, unlimited tasks per user); this feature is additive and doesn't affect existing task operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Spec-First Development
✅ **PASS**: Specification (spec.md) fully defines functional requirements (FR-001 through FR-013), user scenarios with acceptance criteria, success metrics, and key entities. No implementation details; all design decisions deferred to this plan.

### Strict Separation of Concerns
✅ **PASS**: Backend (FastAPI) handles data persistence and API contracts; Frontend (Next.js) handles UI rendering and user input; Database (PostgreSQL) enforces data integrity. No layer violates boundaries.

### User Ownership Enforcement
✅ **PASS**: Existing task ownership by user_id is preserved. FR-012 explicitly requires: "System MUST respect existing task ownership rules—users can only set/view due dates on their own tasks." All database queries filtered by user_id; API endpoints validate ownership before returning/modifying tasks.

### Deterministic Behavior
✅ **PASS**: All due date calculations are deterministic:
- Overdue: `due_date < TODAY`
- Due Today: `due_date = TODAY`
- Upcoming: `due_date > TODAY`
- No timezone ambiguity (see Assumptions section in spec and data-model.md)

### Stateless Architecture
✅ **PASS**: Due date status (overdue/due today/upcoming) is computed at query time, not cached in memory. Each API request reconstructs task list with current due date status independently.

### Technology Lock-In
✅ **PASS**: Uses approved technologies only: Python 3.11, FastAPI, SQLModel, PostgreSQL, Next.js, TypeScript. No experimental libraries or workarounds.

**Gate Status**: ✅ **GATE PASSED** - Plan respects all constitutional principles. User ownership enforced. Deterministic calculations. Technology stack fixed and justified.

## Project Structure

### Documentation (this feature)

```text
specs/009-task-due-dates/
├── spec.md                  # Feature specification (COMPLETE)
├── plan.md                  # This file
├── research.md              # Phase 0 research (generated below)
├── data-model.md            # Phase 1 data model & entities (generated below)
├── quickstart.md            # Phase 1 quickstart guide (generated below)
├── contracts/               # Phase 1 API contracts (generated below)
│   ├── openapi-tasks.yaml   # Task API schema with due_date
│   └── schemas.json         # Request/response models
└── checklists/
    └── requirements.md      # Quality validation (COMPLETE)
```

### Source Code Structure

This feature extends existing backend and frontend. Key areas affected:

**Backend** (`backend/src/`):
```text
models.py                   # Extend Task model with due_date field
schemas.py                  # Extend TaskCreate, TaskUpdate, TaskResponse with due_date
services.py                 # Add sorting and filtering by due_date logic
api/tasks.py                # Ensure due_date is returned in responses
```

**Frontend** (`frontend/src/`):
```text
components/
├── TaskForm.tsx            # Add due date picker to task creation/editing
├── TaskList.tsx            # Display due_date status (overdue, due today, etc.)
└── TaskCard.tsx            # Show visual indicators for due date status

utils/
└── dateUtils.ts            # Helper functions for due date display (countdown, status)
```

**Database** (`alembic/versions/`):
```text
XXXXXX_add_due_date_to_tasks.py  # Migration: Add due_date column to tasks table
```

**Structure Decision**: Full-stack enhancement to existing web application. All code under `backend/`, `frontend/`, and `alembic/` as appropriate. No new directories required; this feature integrates into the existing task CRUD layer.

## Complexity Tracking

> No constitutional violations. Feature is a straightforward extension of existing task model with no architectural conflicts.

---

## Phase 0: Research & Clarifications

**Status**: All technical details specified; no critical unknowns requiring research.

### Key Technical Decisions

#### 1. Due Date Column Type: DATE (not TIMESTAMP)

**Decision**: Use PostgreSQL `DATE` type for the `due_date` column. Store as a date-only value (no time component).

**Rationale**:
- Simplifies timezone handling—no need for UTC conversion of times
- Aligns with spec assumption: "Due dates are user-local dates (not specific times with timezone awareness)"
- Spec indicates future enhancement for time precision: "Initial implementation treats due dates as dates only (2026-02-14), not times (2026-02-14 15:30)"
- Efficient storage and indexing in PostgreSQL

**Specification Reference**: Assumptions section: "Due dates are assumed to be user-local dates. Initial implementation treats due dates as dates only."

**Alternative Rejected**: TIMESTAMP WITH TIME ZONE would add complexity without user-facing benefit at MVP stage.

---

#### 2. Null vs. Default: Nullable Column

**Decision**: Make `due_date` nullable (`NULL` in database). No default value.

**Rationale**:
- FR-005 explicitly requires: "System MUST support setting due_date as null (no due date) on tasks"
- Allows tasks to exist without deadlines (common case)
- User Stories 1 & 2 both describe editing tasks to clear due dates
- Maintains backward compatibility with existing tasks (migration adds column as NULL)

**Specification Reference**: FR-005, User Story 1 acceptance scenario 3: "Given I have a task with a due date, When I clear the due date (set to null), Then the task no longer has a due date"

**Alternative Rejected**: Default date (e.g., NULL) doesn't match user intent. Date values far in future would be misleading.

---

#### 3. Due Date Status Calculation: Computed at Query Time

**Decision**: Calculate `is_overdue` and `is_due_today` status dynamically when returning tasks. Do not store status in database.

**Rationale**:
- Avoids stale data (status would need updates on every day boundary)
- Spec constraint: "No background jobs required—all due date calculations are performed in the application layer when tasks are retrieved"
- Single source of truth: database stores only the fact (due_date), computed values derived at runtime
- Simpler migration (add one column, not multiple status fields)

**Specification Reference**: FR-002, FR-003: "System MUST calculate whether a task is overdue/due today based on comparing due_date to current date"

**Implementation**: Backend service layer computes status in Python; frontend computes status from API response using JavaScript Date APIs.

---

#### 4. Sorting and Filtering: Query-Level Operations

**Decision**: Implement sort by `due_date` and filter by status (overdue/due today/upcoming) at the database query level (SQL ORDER BY, WHERE clauses). API query parameters control behavior.

**Rationale**:
- Efficient for large task lists (database index on due_date)
- Reduces data transfer (filtered results only sent to frontend)
- Scalable as user task counts grow
- Spec requirement FR-006: "System MUST enable filtering and sorting tasks by due_date via API query parameters"

**API Query Parameters**:
- `sort=due_date` or `sort=-due_date` (ascending/descending)
- `filter=overdue|due_today|upcoming` (single value, not multi-select at initial MVP)

---

#### 5. Timezone Handling: Assume User's Browser Timezone

**Decision**: Store `due_date` as `DATE` (no timezone). When displaying, assume user's local timezone from browser. No explicit timezone column or conversion logic.

**Rationale**:
- Spec assumption: "Timezone-safe date handling" means treating dates as local, not forcing UTC
- Browser Date APIs (JavaScript) automatically use user's system timezone
- Avoids complexity of per-user timezone configuration at MVP stage
- Date-only (no time) avoids cross-midnight ambiguity

**Specification Reference**: Assumptions: "Due dates are assumed to be user-local dates. Implementation should store as DATE type or as DateTime at 00:00 UTC."

**Edge Case Handled**: "What happens when system's date changes (midnight passes)? Task status should update accordingly without requiring manual refresh." → Status is computed at query time, so new requests after midnight will see updated status automatically.

---

#### 6. Backward Compatibility: Additive Migration

**Decision**: Add `due_date` column as nullable; all existing tasks have NULL due_date. No data transformation required.

**Rationale**:
- Maintains existing task behavior (tasks without due dates are valid)
- Simple Alembic migration: `ALTER TABLE tasks ADD COLUMN due_date DATE NULL`
- No data loss or schema conflicts
- Existing API queries ignore due_date; only new code path uses it

---

## Phase 1: Design & Contracts

### 1.1 Data Model

See `data-model.md` for full entity definitions and relationships.

**Task Entity Extension**:
```
Task (existing model)
├── Fields (existing):
│   ├── id: int (primary key)
│   ├── user_id: str (foreign key, required)
│   ├── title: str (required)
│   ├── description: str (optional)
│   ├── status: str (incomplete|complete)
│   ├── priority: str (low|medium|high)
│   ├── created_at: datetime UTC
│   └── updated_at: datetime UTC
│
└── Fields (NEW):
    └── due_date: date (nullable) ← ADDITION

Computed Fields (not stored):
├── is_overdue: bool = due_date != null && due_date < today()
├── is_due_today: bool = due_date != null && due_date == today()
└── days_until_due: int = due_date != null ? (due_date - today()).days : null
```

---

### 1.2 API Contracts

See `contracts/openapi-tasks.yaml` for full OpenAPI 3.1 specification.

**Key Endpoints (Modified)**:

1. **POST /api/{user_id}/tasks** (Create task with optional due_date)
   - Request: TaskCreate schema now includes optional `due_date: date`
   - Response: TaskResponse schema now includes `due_date: date | null`

2. **PUT /api/{user_id}/tasks/{id}** (Update task including due_date)
   - Request: TaskUpdate schema now includes optional `due_date: date | null`
   - Response: TaskResponse schema now includes `due_date: date | null`

3. **GET /api/{user_id}/tasks** (List tasks with sorting/filtering)
   - Query parameters (new):
     - `sort=due_date` or `sort=-due_date` (optional, sorts by due date ascending/descending)
     - `filter=overdue|due_today|upcoming` (optional, filters by due status)
   - Response: Array of TaskResponse; each includes `due_date` and computed status fields

4. **GET /api/{user_id}/tasks/{id}** (Get single task)
   - Response: TaskResponse includes `due_date` and computed status fields

5. **PATCH /api/{user_id}/tasks/{id}/status** (Mark complete/incomplete)
   - Unchanged; due_date preserved

---

### 1.3 Request/Response Schemas

**TaskCreate** (extended):
```json
{
  "title": "string (required, 1-255 chars)",
  "description": "string (optional, max 5000 chars)",
  "priority": "string (optional: low|medium|high, default: medium)",
  "due_date": "date ISO 8601 (optional, nullable)"
}
```

**TaskUpdate** (extended):
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "priority": "string (optional: low|medium|high)",
  "due_date": "date ISO 8601 (optional, nullable, set to null to clear)"
}
```

**TaskResponse** (extended):
```json
{
  "id": "int",
  "user_id": "string",
  "title": "string",
  "description": "string | null",
  "status": "string (incomplete|complete)",
  "priority": "string (low|medium|high)",
  "due_date": "date ISO 8601 | null",
  "is_overdue": "boolean (computed)",
  "is_due_today": "boolean (computed)",
  "days_until_due": "int | null (computed)",
  "created_at": "datetime ISO 8601",
  "updated_at": "datetime ISO 8601"
}
```

---

### 1.4 Frontend Components

**TaskForm Component** (extended):
- Add date input field (HTML5 `<input type="date">`)
- Label: "Due Date (optional)"
- Validation: Date must not be in the past (optional, can allow past dates for existing tasks)
- Integration: Pass `due_date` to create/update API calls

**TaskCard Component** (extended):
- Display due_date if present
- Show visual indicator:
  - Red background/badge if `is_overdue`
  - Orange/yellow if `is_due_today`
  - Gray if upcoming (`days_until_due > 1`)
- Show label: "Overdue", "Due Today", or "Due in X days"
- If no due_date, show nothing (or "No due date")

**TaskList Component** (modified):
- Add sort/filter UI controls
- Sort button: "Sort by Due Date" (toggle ascending/descending)
- Filter button: "Show Overdue", "Show Due Today", "Show All" (radio buttons)
- Pass `sort` and `filter` query parameters to API

---

### 1.5 Database Migration

**Alembic Migration Script**:
```sql
ALTER TABLE tasks ADD COLUMN due_date DATE NULL;
CREATE INDEX idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
```

Index on `(user_id, due_date)` enables efficient filtering and sorting by user and due date.

---

## Phase 1 Outputs

- ✅ data-model.md - Extended Task entity with due_date field
- ✅ contracts/openapi-tasks.yaml - Full API specification
- ✅ contracts/schemas.json - Request/response models with due_date
- ✅ quickstart.md - Developer guide for implementing due dates
- ✅ plan.md (this file) - Architecture and technical decisions

---

## Complexity Tracking

> No constitutional violations or deviations from fixed technology stack.

| Area | Complexity | Justification |
|------|-----------|---------------|
| None | - | Feature is a straightforward field addition with computed status fields. No new technologies or architecture required. |
