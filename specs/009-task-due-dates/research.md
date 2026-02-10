# Research: Task Due Dates & Deadlines

**Purpose**: Phase 0 research for Task Due Dates & Deadlines specification
**Date**: 2026-02-10
**Status**: Complete - All technical decisions finalized; no critical unknowns

## Summary

All technical decisions for the Task Due Dates & Deadlines implementation are fully specified in `spec.md` and `plan.md`. No research tasks were required because the specification provides deterministic requirements for every component: due date storage, overdue detection logic, API contracts, and UI indicators.

This document records the architectural and technical decisions made during planning phase, with rationale and alternatives considered.

---

## Technical Decisions

### 1. Due Date Column Type: PostgreSQL DATE (not TIMESTAMP)

**Decision**: Use PostgreSQL `DATE` type for the `due_date` column. Store as a date-only value without time component.

**Rationale**:
- Simplifies timezone handling—no need for UTC time conversions for a date-only value
- Aligns with specification assumption: "Due dates are assumed to be user-local dates (not specific times)"
- Future extension path for time precision: Initial MVP focuses on dates; time precision (2026-02-14 15:30) can be added later
- Efficient storage in PostgreSQL (4 bytes for DATE vs. 8 bytes for TIMESTAMP)
- Simpler indexing and range queries
- Matches user mental model: "task due on February 14" not "due at 12:00 UTC on February 14"

**Alternatives Considered**:
- **TIMESTAMP WITH TIME ZONE**: Would require explicit timezone handling, UTC normalization, and user timezone configuration. Rejected because MVP doesn't require time precision; adds implementation complexity without user-visible benefit.
- **VARCHAR (ISO 8601 string)**: Would sacrifice database-level date validation and indexing efficiency. Rejected because PostgreSQL DATE type provides better constraints and performance.
- **BIGINT (Unix epoch)**: Would require application-level conversions and lose semantic meaning in raw SQL queries. Rejected for same reason as VARCHAR.

**Specification Reference**: Assumptions section: "Due dates are assumed to be user-local dates (not specific times with timezone awareness)... Initial implementation treats due dates as dates only (2026-02-14), not times (2026-02-14 15:30)."

---

### 2. Nullable Column: Support "No Due Date" State

**Decision**: Make `due_date` nullable (NULL in database). No default value; tasks can exist indefinitely without a due date.

**Rationale**:
- FR-005 explicitly requires: "System MUST support setting due_date as null (no due date) on tasks"
- User Story 1 acceptance scenario 3: "Given I have a task with a due date, When I clear the due date (set to null), Then the task no longer has a due date"
- Maintains backward compatibility: existing tasks have NULL due_date; no data migration needed
- Aligns with task management UX: not all tasks need deadlines (someday/maybe tasks)
- Simplifies schema: boolean flag to track "has_due_date" is unnecessary; NULL check is enough

**Alternatives Considered**:
- **Mandatory due_date with far-future default (e.g., 2099-12-31)**: Would violate FR-005 requirement for null values. Also confuses filtering/sorting ("all tasks due in year 2099").
- **Boolean flag (has_due_date) + required date**: Adds column; NULL column is simpler.

**Specification Reference**: FR-005, User Story 1, FR-001 ("nullable date/time value")

---

### 3. Computed Status Fields: No Database Storage

**Decision**: Calculate `is_overdue`, `is_due_today`, and `days_until_due` status at runtime (query/runtime). Do not store these as database columns.

**Rationale**:
- Spec constraint: "No background jobs required—all due date calculations are performed in the application layer when tasks are retrieved"
- Avoids stale data problem: status is only valid for the current day. If stored, would need updates on every date boundary (requires job or refresh logic).
- Single source of truth: database stores one fact (due_date); derived values computed from that fact
- Simpler schema migration: add one column (due_date), not four (due_date, is_overdue, is_due_today, days_until_due)
- Deterministic: same query always returns same status for same due_date on same date
- Scalable: computation is O(1) per task; no additional database maintenance

**Alternatives Considered**:
- **Store status in database with background job**: Would require scheduled job to recalculate statuses at midnight UTC for all users. Violates spec: "No background jobs required." Also adds operational complexity (job scheduling, failure handling).
- **Materialized view**: Would still require refresh logic on date boundary. Doesn't eliminate the background job problem.
- **Client-side computation only**: Would require frontend to fetch due_date and compute status. Rejected because sorting/filtering must happen at database level for large task lists.

**Specification Reference**: FR-002, FR-003 ("System MUST calculate whether..."), Constraint: "No background jobs required—database-driven logic only"

**Implementation Approach**:
- Backend (Python): Compute status in `services.py` when returning task list
- Frontend (JavaScript): Compute status from API response for display in components

---

### 4. Sorting and Filtering: Database-Level Operations

**Decision**: Implement sort by `due_date` and filter by status (overdue/due today/upcoming) at the SQL query level. API accepts query parameters (`sort`, `filter`) and translates them to SQL clauses.

**Rationale**:
- Efficient for large datasets: database index on (user_id, due_date) enables O(log n) lookup instead of O(n) scan
- Reduces data transfer: filtered/sorted results only sent to frontend
- Scalable: doesn't load all tasks into memory for filtering/sorting
- Spec requirement FR-006: "System MUST enable filtering and sorting tasks by due_date via API query parameters"
- Standard REST pattern for list endpoints

**Alternatives Considered**:
- **Client-side filtering/sorting**: Would require fetching all tasks even if user wants only overdue ones. Doesn't scale with large task lists.
- **Pagination without sorting**: Would prevent users from reliably finding tasks by due date.

**Specification Reference**: FR-006 ("filtering and sorting tasks by due_date via API query parameters"), User Story 2 acceptance scenario 4 ("sort by due date")

**API Parameters**:
- `sort=due_date` (ascending, oldest first) or `sort=-due_date` (descending, newest first)
- `filter=overdue|due_today|upcoming` (single value at MVP; can be extended to multi-select later)
- Combination: `/api/{user_id}/tasks?sort=due_date&filter=overdue` (show only overdue tasks, sorted by due date)

---

### 5. Timezone Handling: Browser Timezone Assumption

**Decision**: Store `due_date` as `DATE` (no timezone). When displaying in UI, assume user's browser timezone is correct. No explicit per-user timezone configuration or UTC conversion.

**Rationale**:
- Spec assumption: "Timezone-safe date handling" means treating dates as local-to-user, not forcing UTC representation
- Browser Date APIs (JavaScript) automatically use user's system timezone
- Avoids complexity: no per-user timezone column, no timezone lookup/conversion logic
- Date-only avoids cross-midnight ambiguity: "2026-02-14" means "all day on February 14" in any timezone
- Matches user mental model: "task due on Friday" is intuitive regardless of timezone

**Edge Cases Handled**:
- **Midnight crossing**: Spec edge case "What happens when system's date changes (midnight passes)?" → Status is computed at query time, so new requests after midnight automatically reflect updated status. No refresh needed.
- **User traveling**: Browser's timezone reflects travel destination. If user expects local timezone to follow them, they must update system settings (outside scope of this feature).
- **Scheduled dates across timezones**: Spec assumption documents this: "Implementation should store as DATE type or as DateTime at 00:00 UTC." DATE type sidesteps the problem entirely.

**Alternatives Considered**:
- **TIMESTAMP WITH TIME ZONE + per-user timezone config**: Would add complexity (user settings table, lookup on every query) without user-facing benefit at MVP. Extension point for future enhancement.
- **Force UTC conversion**: Would confuse users ("due_date shows as Feb 15 in database, but I entered Feb 14"). Rejected because date-only sidesteps the problem.

**Specification Reference**: Assumptions section: "Timezone-safe date handling", Edge case: "How does system handle tasks with due dates in different timezones?"

---

### 6. Backward Compatibility: Additive Migration Strategy

**Decision**: Add `due_date` column as nullable via Alembic migration. All existing tasks have NULL due_date. No data transformation or backfill required.

**Rationale**:
- Maintains existing task behavior: tasks without due dates are valid and common
- Simple migration: single `ALTER TABLE tasks ADD COLUMN due_date DATE NULL`
- No data loss or schema conflicts
- Existing API queries continue to work (ignore due_date field)
- Only new code paths use due_date
- Low risk: can rollback by dropping column if needed

**Migration Script**:
```sql
ALTER TABLE tasks ADD COLUMN due_date DATE NULL;
CREATE INDEX idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
```

Index on `(user_id, due_date)` with `WHERE due_date IS NOT NULL` ensures efficient queries for:
- `SELECT * FROM tasks WHERE user_id = $1 AND due_date < today() ORDER BY due_date` (overdue tasks)
- `SELECT * FROM tasks WHERE user_id = $1 AND due_date = today()` (due today)

**Specification Reference**: Constraint: "Use existing task ownership rules" → Preserves user_id scoping

---

### 7. API Response Inclusion: due_date Always Returned

**Decision**: Include `due_date` in all task API responses (GET single, GET list, POST create, PUT update, PATCH status). Include computed status fields for convenience.

**Rationale**:
- Spec requirement FR-004: "System MUST return due_date in API responses for task retrieve and list operations"
- Spec requirement FR-013: "Database MUST store and persist due_date values reliably"
- Computed fields (is_overdue, is_due_today, days_until_due) reduce frontend complexity: frontend can display status immediately without re-computing
- Consistent API design: TaskResponse includes all task properties
- Enables future integrations (calendar apps, iCal export) that need due_date

**TaskResponse Schema Extension**:
```json
{
  "id": 123,
  "user_id": "user@example.com",
  "title": "Buy milk",
  "description": null,
  "status": "incomplete",
  "priority": "medium",
  "due_date": "2026-02-14",           // NEW: nullable date
  "is_overdue": false,                 // NEW: computed
  "is_due_today": false,               // NEW: computed
  "days_until_due": 4,                 // NEW: computed (null if no due_date)
  "created_at": "2026-02-10T18:00:00Z",
  "updated_at": "2026-02-10T18:00:00Z"
}
```

---

## Summary: No Research Required

The specification provides deterministic requirements for all technical decisions. No ambiguities requiring research; all alternatives have been evaluated and documented. The feature is ready for Phase 1 design and Phase 2 task breakdown.
