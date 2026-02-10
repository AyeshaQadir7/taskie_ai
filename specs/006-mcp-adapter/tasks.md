---

description: "Task list for MCP Adapter for Todo Operations implementation"

---

# Tasks: MCP Adapter for Todo Operations

**Input**: Design documents from `/specs/006-mcp-adapter/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are OPTIONAL and included here to enable TDD approach. Tests are organized per user story and should be written FIRST before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each tool.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **MCP Server**: `mcp-server/` at repository root
- **Source**: `mcp-server/src/` for Python source code
- **Tests**: `mcp-server/tests/` for pytest test files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create MCP server directory structure per implementation plan
- [x] T002 [P] Initialize Python project with dependencies (mcp, sqlmodel, asyncpg, pytest)
- [x] T003 [P] Create requirements.txt with all dependencies in mcp-server/
- [x] T004 [P] Create pyproject.toml with project metadata in mcp-server/
- [x] T005 Create .env.example with DATABASE_URL template in mcp-server/
- [x] T006 [P] Create mcp-server/src/__init__.py (empty package marker)
- [x] T007 [P] Create mcp-server/src/models/__init__.py (empty package marker)
- [x] T008 [P] Create mcp-server/src/tools/__init__.py (empty package marker)
- [x] T009 [P] Create mcp-server/src/db/__init__.py (empty package marker)
- [x] T010 [P] Create mcp-server/src/errors/__init__.py (empty package marker)
- [x] T011 [P] Create mcp-server/tests/__init__.py (empty package marker)
- [x] T012 Create mcp-server/README.md with setup instructions and tool documentation

**Checkpoint**: ✅ Project structure ready - source code implementation can now begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T013 Create Task SQLModel in mcp-server/src/models/task.py (from backend schema)
- [x] T014 [P] Create Pydantic schemas for tool inputs/outputs in mcp-server/src/models/schemas.py
- [x] T015 [P] Create error handling utilities in mcp-server/src/errors/handlers.py (structured JSON error responses)
- [x] T016 Create PostgreSQL connection pool in mcp-server/src/db/connection.py (asyncpg pool initialization)
- [x] T017 Create MCP server entry point in mcp-server/src/main.py (MCP server initialization and tool registration)
- [x] T018 [P] Create conftest.py with pytest fixtures for database and MCP client in mcp-server/tests/

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Agent Creates a Task (Priority: P1) 🎯 MVP

**Goal**: Agent can create a task with title and optional description; task persists to database with user_id

**Independent Test**: Invoking `add_task(user_id="user123", title="Buy groceries")` creates task in DB and returns task_id, status="pending", title

### Tests for User Story 1 (OPTIONAL - TDD approach)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US1] Contract test for add_task inputs/outputs in tests/test_add_task.py
- [x] T020 [P] [US1] Integration test: add_task with title only in tests/test_add_task.py
- [x] T021 [P] [US1] Integration test: add_task with title and description in tests/test_add_task.py
- [x] T022 [P] [US1] Integration test: add_task validates title required in tests/test_add_task.py
- [x] T023 [P] [US1] Integration test: add_task validates title max 255 characters in tests/test_add_task.py
- [x] T024 [US1] Integration test: add_task persists task to database and task is queryable in tests/test_add_task.py

### Implementation for User Story 1

- [x] T025 [US1] Implement add_task tool handler in mcp-server/src/tools/add_task.py
  - Inputs: user_id (required), title (required), description (optional)
  - Validate: user_id not empty, title not empty, title <= 255 characters
  - Query: INSERT INTO tasks (user_id, title, description, status, created_at, updated_at) VALUES (...)
  - Output: task_id, title, status="pending", created_at
  - Error handling: Return structured JSON error for validation failures
- [x] T026 [US1] Register add_task tool in MCP server (mcp-server/src/main.py)
- [x] T027 [US1] Add user ownership validation: ensure task created with provided user_id in mcp-server/src/tools/add_task.py
- [x] T028 [US1] Verify add_task is stateless (no in-memory state) and can handle concurrent invocations

**Checkpoint**: ✅ User Story 1 (add_task) fully functional and independently testable

---

## Phase 4: User Story 2 - Agent Lists User's Tasks (Priority: P1)

**Goal**: Agent can retrieve all tasks owned by a user with optional status filter; enforces user isolation

**Independent Test**: Invoking `list_tasks(user_id="user123", status="all")` returns array of user's tasks; invoking with status="pending" returns only pending tasks; user cannot see other users' tasks

### Tests for User Story 2 (OPTIONAL - TDD approach)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T029 [P] [US2] Contract test for list_tasks inputs/outputs in tests/test_list_tasks.py
- [ ] T030 [P] [US2] Integration test: list_tasks returns all tasks for user in tests/test_list_tasks.py
- [ ] T031 [P] [US2] Integration test: list_tasks with status="pending" filters correctly in tests/test_list_tasks.py
- [ ] T032 [P] [US2] Integration test: list_tasks with status="completed" filters correctly in tests/test_list_tasks.py
- [ ] T033 [P] [US2] Integration test: list_tasks returns empty array for user with no tasks in tests/test_list_tasks.py
- [ ] T034 [US2] Integration test: user isolation - user cannot see other users' tasks in tests/test_list_tasks.py
- [ ] T035 [US2] Integration test: list_tasks validates status parameter in tests/test_list_tasks.py

### Implementation for User Story 2

- [ ] T036 [US2] Implement list_tasks tool handler in mcp-server/src/tools/list_tasks.py
  - Inputs: user_id (required), status (optional: "all", "pending", "completed")
  - Validate: user_id not empty, status is valid enum (if provided)
  - Query: SELECT ... FROM tasks WHERE user_id = $1 AND (status = $2 OR status is null) ORDER BY created_at DESC
  - Output: Array of tasks with id, title, description, status, created_at, updated_at
  - Error handling: Return structured JSON error for invalid status
- [ ] T037 [US2] Register list_tasks tool in MCP server (mcp-server/src/main.py)
- [ ] T038 [US2] Add user ownership enforcement to list_tasks WHERE clause in mcp-server/src/tools/list_tasks.py
- [ ] T039 [US2] Verify list_tasks is stateless and returns consistent results

**Checkpoint**: At this point, User Stories 1 AND 2 (add_task + list_tasks) should both work independently

---

## Phase 5: User Story 3 - Agent Updates a Task (Priority: P2)

**Goal**: Agent can update task title and/or description; enforces user ownership and validates input

**Independent Test**: Invoking `update_task(user_id="user123", task_id=1, title="New Title")` updates task and returns updated record; cannot update task owned by another user

### Tests for User Story 3 (OPTIONAL - TDD approach)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T040 [P] [US3] Contract test for update_task inputs/outputs in tests/test_update_task.py
- [ ] T041 [P] [US3] Integration test: update_task with new title in tests/test_update_task.py
- [ ] T042 [P] [US3] Integration test: update_task with new description in tests/test_update_task.py
- [ ] T043 [P] [US3] Integration test: update_task with both title and description in tests/test_update_task.py
- [ ] T044 [P] [US3] Integration test: update_task validates title max 255 characters in tests/test_update_task.py
- [ ] T045 [US3] Integration test: user ownership - cannot update task owned by another user in tests/test_update_task.py
- [ ] T046 [US3] Integration test: update_task on non-existent task returns 404 in tests/test_update_task.py

### Implementation for User Story 3

- [ ] T047 [US3] Implement update_task tool handler in mcp-server/src/tools/update_task.py
  - Inputs: user_id (required), task_id (required), title (optional), description (optional)
  - Validate: user_id not empty, task_id is integer, title <= 255 characters (if provided)
  - Query: UPDATE tasks SET title = $1, description = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING ...
  - Output: id, title, status, updated_at
  - Error handling: Return "Task not found or access denied" if user doesn't own task
- [ ] T048 [US3] Register update_task tool in MCP server (mcp-server/src/main.py)
- [ ] T049 [US3] Add user ownership validation to update_task WHERE clause in mcp-server/src/tools/update_task.py
- [ ] T050 [US3] Verify update_task is stateless and updates only specified fields

**Checkpoint**: At this point, User Stories 1, 2, and 3 should all work independently

---

## Phase 6: User Story 4 - Agent Marks Task as Completed (Priority: P2)

**Goal**: Agent can mark task as completed; operation is idempotent; enforces user ownership

**Independent Test**: Invoking `complete_task(user_id="user123", task_id=1)` sets status="completed" and returns task; completing already-completed task returns same result; cannot complete task owned by another user

### Tests for User Story 4 (OPTIONAL - TDD approach)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T051 [P] [US4] Contract test for complete_task inputs/outputs in tests/test_complete_task.py
- [ ] T052 [P] [US4] Integration test: complete_task on pending task sets status=completed in tests/test_complete_task.py
- [ ] T053 [P] [US4] Integration test: complete_task is idempotent (completing already-completed task) in tests/test_complete_task.py
- [ ] T054 [US4] Integration test: user ownership - cannot complete task owned by another user in tests/test_complete_task.py
- [ ] T055 [US4] Integration test: complete_task on non-existent task returns 404 in tests/test_complete_task.py

### Implementation for User Story 4

- [ ] T056 [US4] Implement complete_task tool handler in mcp-server/src/tools/complete_task.py
  - Inputs: user_id (required), task_id (required)
  - Validate: user_id not empty, task_id is integer
  - Query: UPDATE tasks SET status = 'completed', updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING ...
  - Output: id, title, status="completed", updated_at
  - Error handling: Return "Task not found or access denied" if user doesn't own task
- [ ] T057 [US4] Register complete_task tool in MCP server (mcp-server/src/main.py)
- [ ] T058 [US4] Add user ownership validation to complete_task WHERE clause in mcp-server/src/tools/complete_task.py
- [ ] T059 [US4] Verify complete_task is stateless and idempotent

**Checkpoint**: At this point, User Stories 1, 2, 3, and 4 should all work independently

---

## Phase 7: User Story 5 - Agent Deletes a Task (Priority: P3)

**Goal**: Agent can delete a task; enforces user ownership; operation is NOT idempotent (re-deletion returns error)

**Independent Test**: Invoking `delete_task(user_id="user123", task_id=1)` removes task from DB; subsequent delete returns 404; cannot delete task owned by another user

### Tests for User Story 5 (OPTIONAL - TDD approach)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T060 [P] [US5] Contract test for delete_task inputs/outputs in tests/test_delete_task.py
- [ ] T061 [P] [US5] Integration test: delete_task removes task from database in tests/test_delete_task.py
- [ ] T062 [P] [US5] Integration test: deleted task no longer appears in list_tasks in tests/test_delete_task.py
- [ ] T063 [US5] Integration test: re-deleting task returns 404 (not idempotent) in tests/test_delete_task.py
- [ ] T064 [US5] Integration test: user ownership - cannot delete task owned by another user in tests/test_delete_task.py
- [ ] T065 [US5] Integration test: delete_task on non-existent task returns 404 in tests/test_delete_task.py

### Implementation for User Story 5

- [ ] T066 [US5] Implement delete_task tool handler in mcp-server/src/tools/delete_task.py
  - Inputs: user_id (required), task_id (required)
  - Validate: user_id not empty, task_id is integer
  - Query: DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id
  - Output: id, status="deleted"
  - Error handling: Return "Task not found or access denied" if user doesn't own task or task doesn't exist
- [ ] T067 [US5] Register delete_task tool in MCP server (mcp-server/src/main.py)
- [ ] T068 [US5] Add user ownership validation to delete_task WHERE clause in mcp-server/src/tools/delete_task.py
- [ ] T069 [US5] Verify delete_task is stateless and non-idempotent

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Cross-Cutting Concerns & Polish

**Purpose**: Improvements that affect multiple user stories and overall system quality

- [ ] T070 [P] Create integration test suite that verifies all 5 tools work together in tests/test_integration_all_tools.py
- [ ] T071 [P] Add performance benchmark tests for < 500ms response time in tests/test_performance.py
- [ ] T072 [P] Create user isolation comprehensive test in tests/test_user_isolation.py (verify user A cannot affect user B's tasks)
- [ ] T073 [P] Add database connection error handling tests in tests/test_error_handling.py
- [ ] T074 Create mcp-server/README.md with:
  - Installation instructions
  - Configuration (environment variables)
  - Running the server
  - Tool documentation with examples
  - Testing instructions
- [ ] T075 [P] Documentation: Add tool contract definitions to README (copy from contracts/ JSON files)
- [ ] T076 [P] Documentation: Add quickstart examples to README
- [ ] T077 [P] Verify all tools handle edge cases (missing parameters, invalid types, DB errors)
- [ ] T078 [P] Add logging to all tool handlers for debugging and monitoring
- [ ] T079 Run full test suite and verify all tests pass

**Checkpoint**: All features complete and verified; ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - US1 (add_task) should be implemented first (other tools depend on created tasks for testing)
  - US2 (list_tasks) should be implemented second (agents need to verify created tasks)
  - US3, US4, US5 can be implemented in parallel after US1 and US2 are done
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1, add_task)**: No dependencies on other stories - can start after Foundational (Phase 2)
- **User Story 2 (P1, list_tasks)**: Can start after Foundational; benefits from US1 being done for test data
- **User Story 3 (P2, update_task)**: Requires US1 (needs tasks to update)
- **User Story 4 (P2, complete_task)**: Requires US1 (needs tasks to complete)
- **User Story 5 (P3, delete_task)**: Requires US1 (needs tasks to delete)

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Tool implementation must validate inputs before database queries
- Tool must verify user ownership before any state mutation
- Tool must return structured response or error

### Parallel Opportunities

- **Setup Phase**: All T002-T011 marked [P] can run in parallel (different files, no dependencies)
- **Foundational Phase**: T013-T014 marked [P] can run in parallel (different files)
- **User Story 1 Tests**: T019-T023 marked [P] can run in parallel (different test scenarios)
- **User Story 1 Implementation**: After tests, T025-T028 are sequential (build add_task)
- **User Story 2 Tests**: T029-T034 marked [P] can run in parallel after US1 is done
- **User Stories 3-5**: Can be worked on in parallel by different team members AFTER US1 and US2 are done

---

## Parallel Example: User Story 1

### Run in Parallel (Setup + Foundational)

```bash
Task: "Create MCP server directory structure" (T001)
Task: "Initialize Python project with dependencies" (T002) [P]
Task: "Create requirements.txt" (T003) [P]
Task: "Create pyproject.toml" (T004) [P]
Task: "Create .env.example" (T005)
Task: "Create __init__.py files" (T006-T011) [P]

# After above complete, run foundational tasks:
Task: "Create Task SQLModel" (T013)
Task: "Create Pydantic schemas" (T014) [P]
Task: "Create error handling utilities" (T015) [P]
Task: "Create PostgreSQL connection pool" (T016)
Task: "Create MCP server entry point" (T017)
Task: "Create conftest.py" (T018) [P]

# After foundational, run US1 tests in parallel:
Task: "Contract test for add_task" (T019) [P]
Task: "Test add_task with title only" (T020) [P]
Task: "Test add_task with title and description" (T021) [P]
Task: "Test add_task validates title required" (T022) [P]
Task: "Test add_task validates title max 255 chars" (T023) [P]
Task: "Test add_task persists to database" (T024)

# Then implement US1 (sequential, one after another):
Task: "Implement add_task handler" (T025)
Task: "Register add_task in MCP server" (T026)
Task: "Add user ownership validation" (T027)
Task: "Verify stateless behavior" (T028)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (Phase 1) - 12 tasks
2. Complete Foundational (Phase 2) - 6 tasks
3. Complete User Story 1 (Phase 3) - 10 tasks (6 tests + 4 impl)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Can deploy with just add_task capability

**MVP Scope**: Agents can create tasks. Other operations not yet available.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (add_task) → Test independently → Agents can create
3. Add User Story 2 (list_tasks) → Test independently → Agents can list
4. Add User Story 3 (update_task) → Test independently → Agents can modify
5. Add User Story 4 (complete_task) → Test independently → Agents can mark done
6. Add User Story 5 (delete_task) → Test independently → Agents can delete
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (add_task) → User Story 2 (list_tasks)
   - Developer B: User Story 3 (update_task)
   - Developer C: User Story 4 (complete_task)
   - Developer D: User Story 5 (delete_task)
3. Stories complete and integrate independently
4. Developer E: Polish & cross-cutting concerns (Phase 8)

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
