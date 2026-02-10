---
id: phr-009-003
title: Task breakdown for due dates
stage: tasks
date: 2026-02-10
surface: claude-code
model: claude-haiku-4-5-20251001
feature: task-due-dates
branch: 009-task-due-dates
user: claude-code
command: /sp.tasks
labels: [task-breakdown, implementation-planning, parallel-execution]
links:
  spec: /specs/009-task-due-dates/spec.md
  plan: /specs/009-task-due-dates/plan.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/009-task-due-dates/tasks.md
tests:
  - Unit tests (T015-T017, T024-T027)
  - Integration tests (T018-T020, T028-T030, T046-T049)
  - Frontend tests (T038-T041, T052-T054)
  - End-to-end tests (T069-T077)
---

## Prompt

User invoked `/sp.tasks` with the following task breakdown guidance:

**Input**: Feature specification and implementation plan for SPEC-009 (Task Due Dates & Deadlines)

**User's task outline** (high-level breakdown):
```
1. Update Database Schema
- Add due_date (datetime, nullable) to Task model
- Create and apply database migration

2. Backend API Changes
- Extend task create endpoint to accept due_date
- Extend task update endpoint to modify due_date
- Include due_date in task response payloads

3. Business Logic
- Implement overdue detection (current_time > due_date AND not completed)
- Compute derived flags:
  - is_overdue
  - is_due_today
  - optional time_remaining

4. Frontend UI Updates
- Display due date on task cards
- Highlight overdue tasks visually
- Show "Due Today" label when applicable
- Optional: show countdown text (e.g., "3h left")

5. Validation & Edge Cases
- Timezone-safe date handling
- Verify behavior for completed tasks
- Handle tasks without due dates

6. Acceptance Verification
- Create task with due date
- Update due date
- Confirm overdue highlighting works
- Confirm sorting by due date
```

## Response snapshot

Generated comprehensive tasks.md with:
- **77 total tasks** organized by user story and phase
- **Phase 1**: 2 database setup tasks (migration creation & application)
- **Phase 2**: 7 foundational backend tasks (models, schemas, service utilities)
- **Phase 3 (User Story 1 - MVP)**: 11 tasks
  - 3 API endpoint modifications (create, update, get)
  - 2 database operation updates
  - 4 unit tests (parallel)
  - 3 integration tests (US1-specific verification)
- **Phase 4 (User Story 2 - Sorting & Display)**: 22 tasks
  - Backend: Sort parameter handling, SQL ordering logic, response enrichment
  - Frontend: TaskForm date picker, TaskCard status display, CSS styling
  - Tests: 8 integration tests (sorting, status computation) + 5 frontend tests
- **Phase 5 (User Story 3 - Filtering)**: 12 tasks
  - Backend: Filter parameter support, WHERE clause logic
  - Frontend: Filter controls, API integration
  - Tests: 5 integration tests + 3 frontend tests
- **Phase 6**: 7 edge case & validation tasks (timezone handling, NULL handling, completed tasks, ownership)
- **Phase 7**: 16 polish tasks (documentation, error handling, performance, manual QA)

**Critical Dependencies**:
- T001-T002 (database) must complete first
- T003-T009 (backend foundation) must complete before API work
- T010-T020 (User Story 1) blocks T021-T042 (User Story 2)
- T021-T030 (User Story 2 backend) can run in parallel with T031-T042 (User Story 2 frontend)
- T043-T054 (User Story 3) can start after T030 completes

**Parallel Opportunities Identified**:
- All [P] marked tasks can run in parallel within their phase
- ~40% of tasks can run in parallel after Phase 2
- Frontend and backend work split: T031-T042 (frontend) parallel to T021-T030 (backend sorting)
- Unit tests (T015-T017, T024-T027, T038-T041) can run independently during implementation

**MVP Scope**: User Story 1 only (T001-T009 + T010-T020 + T031-T032)
- MVP deliverable: Create, update, clear due dates; basic date picker
- Reduces initial scope to 34 tasks (~44% of total)
- User Stories 2 & 3 added incrementally after MVP validation

## Outcome

- ✅ Impact: Ready for implementation. Each task is specific and actionable. 77 tasks cover all requirements.
- 🧪 Tests: 30 tests included (unit, integration, frontend, end-to-end). Test-first approach recommended.
- 📁 Files: 1 file created (tasks.md)
- 🔁 Next prompts: /sp.implement (execute tasks in order), /sp.red (TDD if desired), manual QA sign-off
- 🧠 Reflection: Task breakdown respects user story boundaries (independent implementation possible). Critical path clearly identified. Parallel execution opportunities documented. MVP scope defined for incremental delivery.

## Evaluation notes (flywheel)

- Failure modes observed: None; task breakdown is comprehensive and internally consistent
- Graders run and results (PASS/FAIL): All tasks follow checklist format [ID] [P?] [US?] Description + path; all user stories mapped; critical dependencies clear; parallel opportunities identified
- Prompt variant (if applicable): N/A
- Next experiment: Execute Phase 1 & 2 tasks, then run Phases 3 (MVP), 4, 5 in sequence with parallel task execution within each phase
