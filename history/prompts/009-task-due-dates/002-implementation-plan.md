---
id: phr-009-002
title: Implementation plan for due dates
stage: plan
date: 2026-02-10
surface: claude-code
model: claude-haiku-4-5-20251001
feature: task-due-dates
branch: 009-task-due-dates
user: claude-code
command: /sp.plan
labels: [planning, architecture, data-model, api-contracts]
links:
  spec: /specs/009-task-due-dates/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/009-task-due-dates/plan.md
  - specs/009-task-due-dates/research.md
  - specs/009-task-due-dates/data-model.md
  - specs/009-task-due-dates/quickstart.md
  - specs/009-task-due-dates/contracts/openapi-tasks.yaml
tests: []
---

## Prompt

User invoked `/sp.plan` with the following planning context:

**Input**: Feature specification from SPEC-009 (Task Due Dates & Deadlines)

**User's outline** (high-level planning notes):
```
Plan for Spec 6 (Due Dates)

1. Extend Task model with due_date field
2. Update task create/update APIs to accept due_date
3. Implement overdue detection logic (now > due_date)
4. Add sorting by due_date
5. Expose due date status in API responses
6. Update frontend to display:
   - Due Today
   - Overdue
   - Optional countdown
7. Validate behavior across timezones

Exit Criteria:
- Tasks correctly track due dates
- Overdue tasks are consistently highlighted
- Sorting and filtering work as expected
```

## Response snapshot

Generated a comprehensive implementation plan with:
- Complete Technical Context filled in (Python 3.11, FastAPI, PostgreSQL, Next.js, pytest, Jest)
- Constitutional Check passing on all 6 principles (Spec-First, Separation of Concerns, User Ownership, Deterministic Behavior, Stateless Architecture, Technology Lock-In)
- Phase 0 Research documenting 7 key technical decisions:
  1. Use PostgreSQL DATE type (not TIMESTAMP)
  2. Nullable column to support "no due date" state
  3. Computed status fields (is_overdue, is_due_today, days_until_due) at runtime
  4. Database-level sorting/filtering with query parameters
  5. Browser timezone assumption (no per-user timezone config)
  6. Backward-compatible additive migration
  7. Include due_date in all API responses
- Phase 1 Data Model defining:
  - Extended Task entity with due_date: Optional[date]
  - Indexes for efficient queries (composite index on user_id, due_date)
  - Computed fields for status
  - SQLModel definitions with full validation
  - Alembic migration script for database schema change
- Phase 1 API Contracts in OpenAPI 3.1 format:
  - GET /api/{user_id}/tasks with sort/filter query parameters
  - POST /api/{user_id}/tasks accepting due_date in request
  - PUT /api/{user_id}/tasks/{id} supporting due_date updates
  - TaskResponse schema includes due_date and computed status fields
- Phase 1 Quickstart guide with implementation steps for:
  - Database: Alembic migration
  - Backend: Models, schemas, services, endpoints
  - Frontend: TaskForm (date picker), TaskCard (status display), TaskList (sort/filter controls)
  - Testing: Backend (pytest) and frontend (Jest) test examples

## Outcome

- ✅ Impact: Complete architecture and design for due date feature; ready for task breakdown phase
- 🧪 Tests: No automated tests at plan stage; test examples provided in quickstart
- 📁 Files: 5 files created (plan.md, research.md, data-model.md, quickstart.md, openapi-tasks.yaml)
- 🔁 Next prompts: /sp.tasks (break down into actionable implementation tasks), /sp.implement (execute tasks)
- 🧠 Reflection: Plan is deterministic with no ambiguities. Technical decisions justified and documented. Constitutional gates passed. Ready for implementation phase.

## Evaluation notes (flywheel)

- Failure modes observed: None; plan is comprehensive and internally consistent
- Graders run and results (PASS/FAIL): Constitutional Check PASS; Tech Context complete; All phases structured
- Prompt variant (if applicable): N/A
- Next experiment: Proceed to /sp.tasks for task decomposition and parallel execution planning
