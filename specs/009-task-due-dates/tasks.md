---
description: "Task list for Task Due Dates & Deadlines feature implementation"
---

# Tasks: Task Due Dates & Deadlines

**Input**: Design documents from `/specs/009-task-due-dates/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/openapi-tasks.yaml, quickstart.md

**Organization**: Tasks are organized by user story (US1, US2, US3) to enable independent implementation and parallel testing of each story. Each user story can be implemented, tested, and deployed independently.

---

## Format Reference

- **[ID]**: Task identifier (T001, T002, etc.) in execution order
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US#]**: Which user story this task belongs to (US1, US2, US3)
- **Description**: Exact action with file path

---

## Phase 1: Setup & Foundational Infrastructure

**Purpose**: Database migration and shared infrastructure for due date support

### Database Schema Migration

- [x] T001 Create Alembic migration: Add due_date column to tasks table in `alembic/versions/2026020a001_add_due_date_to_tasks.py` with DATE type and composite index (user_id, due_date)
- [ ] T002 Apply database migration to Neon PostgreSQL to add due_date column and indexes to tasks table

---

## Phase 2: Backend Foundation

**Purpose**: Core backend models, schemas, and utilities that enable all user stories

### Models & Schemas

- [x] T003 [P] Extend Task model in `backend/src/models.py` to include `due_date: Optional[date]` field
- [x] T004 [P] Extend TaskCreate schema in `backend/src/schemas.py` to include `due_date: Optional[date]` parameter
- [x] T005 [P] Extend TaskUpdate schema in `backend/src/schemas.py` to include `due_date: Optional[date]` parameter
- [x] T006 [P] Extend TaskResponse schema in `backend/src/schemas.py` to include `due_date`, `is_overdue`, `is_due_today`, and `days_until_due` fields

### Service Layer - Due Date Logic

- [x] T007 Create helper function `compute_task_status()` in `backend/src/services.py` that calculates `is_overdue`, `is_due_today`, and `days_until_due` based on due_date and current date
- [x] T008 Create helper function `format_task_response()` in `backend/src/services.py` that converts Task model to TaskResponse, including computed status fields
- [x] T009 Add utility function `validate_due_date()` in `backend/src/services.py` for due date validation and timezone-safe handling

---

## Phase 3: User Story 1 - Set and Update Task Due Dates (Priority: P1) 🎯 MVP

**Goal**: Users can set, update, and clear due dates on tasks when creating or editing them. Due dates persist reliably in the database.

**Independent Test**:
1. Create a task with a due date → verify it's stored and retrieved with same value
2. Update a task's due date → verify the change persists
3. Clear a task's due date (set to null) → verify it's stored as NULL

### Implementation for User Story 1

#### Backend API Endpoints

- [x] T010 [US1] Modify POST `/api/{user_id}/tasks` endpoint in `backend/src/api/tasks.py` to accept and store `due_date` parameter from TaskCreate schema
- [x] T011 [US1] Modify PUT `/api/{user_id}/tasks/{id}` endpoint in `backend/src/api/tasks.py` to accept and update `due_date` parameter from TaskUpdate schema, supporting null to clear
- [x] T012 [US1] Update GET `/api/{user_id}/tasks/{id}` endpoint in `backend/src/api/tasks.py` to return due_date and computed status fields in TaskResponse

#### Database Operations

- [x] T013 [US1] Update task creation logic in `backend/src/services.py` to handle due_date from request
- [x] T014 [US1] Update task update logic in `backend/src/services.py` to handle due_date field modification, including setting to NULL

#### Unit Tests for User Story 1

- [x] T015 [P] [US1] Unit test in `backend/tests/test_due_dates.py`: Test creating task with due_date persists to database
- [x] T016 [P] [US1] Unit test in `backend/tests/test_due_dates.py`: Test updating task due_date with new value
- [x] T017 [P] [US1] Unit test in `backend/tests/test_due_dates.py`: Test clearing due_date by setting to NULL

#### Integration Tests for User Story 1

- [x] T018 [US1] Integration test in `backend/tests/test_due_dates_api.py`: POST `/api/{user_id}/tasks` with due_date returns 201 with due_date in response
- [x] T019 [US1] Integration test in `backend/tests/test_due_dates_api.py`: PUT `/api/{user_id}/tasks/{id}` with due_date updates and returns updated value
- [x] T020 [US1] Integration test in `backend/tests/test_due_dates_api.py`: PUT with due_date=null clears the due date

**Checkpoint**: User Story 1 complete. Tasks can be created, updated, and retrieved with due dates. MVP foundation ready.

---

## Phase 4: User Story 2 - Display and Sort Tasks by Due Date Status (Priority: P2)

**Goal**: Users can view which tasks are overdue, due today, or upcoming. Tasks can be sorted by due date. Visual indicators clearly show task status.

**Independent Test**:
1. Create tasks with past, today, and future due dates → verify status computed correctly
2. Verify due_date and status fields in API responses
3. Sort tasks by due_date ascending → verify oldest dates first
4. Sort tasks by due_date descending → verify newest dates first

### Backend Changes for User Story 2

#### API Sorting Support

- [ ] T021 [P] [US2] Add `sort` query parameter handling in GET `/api/{user_id}/tasks` endpoint in `backend/src/api/tasks.py` to support `sort=due_date` and `sort=-due_date`
- [ ] T022 [US2] Implement SQL query logic in `backend/src/services.py` to order tasks by due_date (ascending/descending) with proper NULL handling (tasks without due dates at end)
- [ ] T023 [US2] Update task list response to include `is_overdue`, `is_due_today`, and `days_until_due` computed fields for all tasks

#### Tests for Sorting & Status Computation

- [ ] T024 [P] [US2] Unit test in `backend/tests/test_due_dates.py`: Test `compute_task_status()` returns correct values for overdue tasks
- [ ] T025 [P] [US2] Unit test in `backend/tests/test_due_dates.py`: Test `compute_task_status()` returns correct values for due-today tasks
- [ ] T026 [P] [US2] Unit test in `backend/tests/test_due_dates.py`: Test `compute_task_status()` returns correct values for upcoming tasks
- [ ] T027 [P] [US2] Unit test in `backend/tests/test_due_dates.py`: Test `compute_task_status()` handles NULL due_date correctly
- [ ] T028 [P] [US2] Integration test in `backend/tests/test_due_dates_api.py`: GET `/api/{user_id}/tasks?sort=due_date` returns tasks ordered by earliest due date first
- [ ] T029 [P] [US2] Integration test in `backend/tests/test_due_dates_api.py`: GET `/api/{user_id}/tasks?sort=-due_date` returns tasks ordered by latest due date first
- [ ] T030 [US2] Integration test in `backend/tests/test_due_dates_api.py`: GET `/api/{user_id}/tasks` includes `is_overdue`, `is_due_today`, `days_until_due` in response

### Frontend Changes for User Story 2

#### UI Components

- [ ] T031 [P] [US2] Extend TaskForm component in `frontend/src/components/TaskForm.tsx` to include date input field with type="date" for due date picker
- [ ] T032 [US2] Extend TaskCard component in `frontend/src/components/TaskCard.tsx` to display due date and computed status (Overdue, Due Today, Due in X days)
- [ ] T033 [US2] Extend TaskCard component in `frontend/src/components/TaskCard.tsx` to apply CSS classes for visual indicators: overdue (red), due-today (orange), upcoming (gray)

#### API Integration

- [ ] T034 [US2] Update task fetching in `frontend/src/components/TaskList.tsx` to retrieve and display due_date from API response
- [ ] T035 [US2] Add sort/filter controls UI in `frontend/src/components/TaskList.tsx` with dropdown for sort options (none, due_date asc, due_date desc)

#### Styling & CSS

- [ ] T036 [P] [US2] Add CSS classes in `frontend/src/styles/tasks.css` for `.task-overdue` (red highlight), `.task-due-today` (orange highlight), `.task-upcoming` (gray badge)
- [ ] T037 [P] [US2] Add badge/label styling in `frontend/src/styles/tasks.css` for status labels (Overdue, Due Today, Due in X days)

#### Frontend Tests

- [ ] T038 [P] [US2] Test in `frontend/tests/TaskCard.test.tsx`: Displays "Overdue" badge when is_overdue=true
- [ ] T039 [P] [US2] Test in `frontend/tests/TaskCard.test.tsx`: Displays "Due Today" badge when is_due_today=true
- [ ] T040 [P] [US2] Test in `frontend/tests/TaskCard.test.tsx`: Displays "Due in X days" countdown for upcoming tasks
- [ ] T041 [P] [US2] Test in `frontend/tests/TaskForm.test.tsx`: Date input field present and accepts date values
- [ ] T042 [US2] Integration test in `frontend/tests/TaskList.test.tsx`: Sort dropdown changes task order based on due_date

**Checkpoint**: User Story 2 complete. Tasks sorted and filtered by due date. Visual indicators show status. API includes all computed fields.

---

## Phase 5: User Story 3 - Filter and Search Tasks by Due Status (Priority: P3)

**Goal**: Users can filter tasks to show only overdue, due today, or upcoming tasks. Filtering reduces cognitive load for prioritization.

**Independent Test**:
1. Create mix of overdue, due-today, and upcoming tasks
2. Filter to show only overdue → verify only overdue tasks appear
3. Filter to show only due today → verify only due-today tasks appear
4. Filter to show only upcoming → verify only upcoming tasks appear

### Backend Changes for User Story 3

#### API Filtering Support

- [ ] T043 [P] [US3] Add `filter` query parameter handling in GET `/api/{user_id}/tasks` endpoint in `backend/src/api/tasks.py` to support `filter=overdue|due_today|upcoming`
- [ ] T044 [US3] Implement SQL WHERE clause logic in `backend/src/services.py` to filter tasks by due status (overdue: due_date < today; due_today: due_date = today; upcoming: due_date > today and due_date is not null)
- [ ] T045 [US3] Ensure NULL handling in filter logic so tasks without due dates are excluded from due_today/overdue/upcoming filters (or shown in separate category)

#### Tests for Filtering

- [ ] T046 [P] [US3] Integration test in `backend/tests/test_due_dates_api.py`: GET `/api/{user_id}/tasks?filter=overdue` returns only tasks with due_date < today
- [ ] T047 [P] [US3] Integration test in `backend/tests/test_due_dates_api.py`: GET `/api/{user_id}/tasks?filter=due_today` returns only tasks with due_date = today
- [ ] T048 [P] [US3] Integration test in `backend/tests/test_due_dates_api.py`: GET `/api/{user_id}/tasks?filter=upcoming` returns only tasks with due_date > today
- [ ] T049 [US3] Integration test in `backend/tests/test_due_dates_api.py`: Combining sort and filter (e.g., ?sort=due_date&filter=overdue) works correctly

### Frontend Changes for User Story 3

#### UI Components & Controls

- [ ] T050 [US3] Extend TaskList component in `frontend/src/components/TaskList.tsx` with filter controls (radio buttons or dropdown for overdue/due_today/upcoming/all)
- [ ] T051 [US3] Update task fetching logic in `frontend/src/components/TaskList.tsx` to include `filter` query parameter in API request

#### Frontend Tests

- [ ] T052 [P] [US3] Test in `frontend/tests/TaskList.test.tsx`: Filter button changes task list to show only overdue tasks
- [ ] T053 [P] [US3] Test in `frontend/tests/TaskList.test.tsx`: Filter button changes task list to show only due-today tasks
- [ ] T054 [P] [US3] Test in `frontend/tests/TaskList.test.tsx`: Filter button changes task list to show only upcoming tasks

**Checkpoint**: User Story 3 complete. Full filtering support. All user stories independently testable.

---

## Phase 6: Edge Cases & Validation

**Purpose**: Handle special cases and ensure robustness

### Timezone & Date Handling

- [ ] T055 [P] Verify due date handling works correctly across date boundaries (e.g., midnight transitions)
- [ ] T056 [P] Verify NULL due_date is handled correctly in all query paths (sorting, filtering, display)
- [ ] T057 [P] Verify due dates in the past are correctly marked as overdue

### Completed Tasks Behavior

- [ ] T058 Test that completed tasks still show due_date and status indicators (for historical reference)
- [ ] T059 Test that filtering/sorting includes completed tasks with due dates

### User Ownership Enforcement

- [ ] T060 Verify user cannot view/modify due dates on other users' tasks (existing ownership rules preserved)
- [ ] T061 Test that querying another user's tasks via API returns 403/404 (not 200 with filtered results)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and quality assurance

### Documentation

- [ ] T062 Update API documentation in `README.md` with new query parameters: sort, filter
- [ ] T063 Update API response examples in `README.md` to include due_date fields and computed status

### Error Handling & Validation

- [ ] T064 Verify graceful error handling when invalid date is provided (e.g., malformed ISO 8601)
- [ ] T065 Verify error response includes helpful message when sort/filter parameters are invalid
- [ ] T066 Add validation in frontend date picker to prevent invalid date input

### Performance

- [ ] T067 Verify database index `idx_tasks_due_date` is used in explain plans for due date queries
- [ ] T068 Load test: Verify sorting/filtering on 10k+ tasks completes in <500ms

### Integration & End-to-End Tests

- [ ] T069 Full end-to-end test: Create task with due date → update date → sort by date → filter by status → verify all work together
- [ ] T070 End-to-end test across frontend and backend: Date picker in form → task created with due date → appears in list with correct status → sorting/filtering work

### Final Verification

- [ ] T071 Manual QA: Create task with due date → verify persisted after refresh
- [ ] T072 Manual QA: Update due date on existing task → verify change reflected immediately
- [ ] T073 Manual QA: Clear due date → verify task returns to "no due date" state
- [ ] T074 Manual QA: Sort by due date → verify oldest first, then newest first
- [ ] T075 Manual QA: Filter by overdue → verify only overdue tasks shown
- [ ] T076 Manual QA: Verify visual indicators (colors, labels) match design
- [ ] T077 Manual QA: Test on multiple browsers/devices for date picker compatibility

---

## Task Dependency Graph

### Critical Path (Must Complete in Order)

```
T001 → T002 (database setup MUST be first)
         ↓
      T003, T004, T005, T006 (backend schema updates)
         ↓
      T007, T008, T009 (service layer utilities)
         ↓
      T010, T011, T012 (backend API endpoints)
         ↓
      T015-T020 (User Story 1 tests & verification)
         ↓
      T021-T030 (User Story 2 backend)
      + T031-T042 (User Story 2 frontend, can run in parallel)
         ↓
      T043-T054 (User Story 3 backend + frontend)
         ↓
      T055-T077 (Edge cases, validation, end-to-end)
```

### Parallel Opportunities (Can Run Simultaneously)

**After T009 (service layer complete)**:
- Backend API implementation (T010-T012) can run in parallel with frontend setup (T031-T032)
- Unit tests (T015-T017, T024-T027, T038-T041) can run in parallel with implementation tasks

**After T030 (User Story 2 backend)**:
- Frontend components (T031-T042) and backend User Story 3 (T043-T049) can run in parallel

**After T054 (All user stories)**:
- Edge case testing (T055-T061) and documentation (T062-T063) can run in parallel

---

## Implementation Strategy

### MVP Scope (User Story 1 Only)

**Minimum viable product requires only User Story 1**:
- [ ] T001-T009: Foundation
- [ ] T010-T020: User Story 1 backend
- [ ] T031-T032: User Story 1 frontend (date picker)

**MVP Deliverable**: Users can create tasks with due dates and see them persisted. Ready for User Stories 2 & 3 enhancement.

### Phase 2: Enhance with Sorting & Display (User Story 2)

Add sorting and visual indicators for task status (overdue, due today, upcoming).

### Phase 3: Complete with Filtering (User Story 3)

Add filtering capability to focus on high-priority tasks.

---

## Success Criteria (Exit Criteria)

✅ All tasks completed when:
- [ ] T001-T020 complete: Create, update, clear due dates work; data persists
- [ ] T021-T030 complete: Sorting by due date works; status indicators computed correctly
- [ ] T043-T054 complete: Filtering by status works; frontend UI integrated
- [ ] T055-T077 complete: Edge cases handled; full end-to-end integration tested
- [ ] All acceptance tests pass
- [ ] Manual QA sign-off obtained
- [ ] Deployment checklist completed

---

## Task Statistics

- **Total Tasks**: 77
- **Phase 1 (Setup)**: 2 tasks
- **Phase 2 (Backend Foundation)**: 7 tasks
- **Phase 3 (User Story 1 - MVP)**: 11 tasks (7 implementation + 4 tests)
- **Phase 4 (User Story 2)**: 22 tasks (14 backend/frontend + 8 tests)
- **Phase 5 (User Story 3)**: 12 tasks (7 backend/frontend + 5 tests)
- **Phase 6 (Edge Cases)**: 7 tasks
- **Phase 7 (Polish)**: 16 tasks

**Parallel Opportunities**: ~40% of tasks can run in parallel after Phase 2 completion
