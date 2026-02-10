# Implementation Tasks: AI Agent & Tool-Selection Logic

**Feature**: Spec 007 - AI Agent & Tool-Selection Logic
**Branch**: `007-agent-tool-selection`
**Created**: 2026-02-02
**Planning Basis**: spec.md, plan.md, data-model.md, research.md

---

## Overview

Implementation task breakdown for AI agent that interprets natural language todo commands and invokes MCP tools. Tasks organized by user story in priority order (P1 → P2), with each story independently tes
table.

**Total Tasks**: 71 tasks across 4 implementation phases
**Task Distribution**:
- Phase 1 (Setup): 12 tasks
- Phase 2 (Foundational): 15 tasks
- Phase 3 (US1-3, MVP): 24 tasks
- Phase 4 (US4-6, Extended): 20 tasks

**MVP Scope** (Phase 1-3): User Stories 1-3 (create, list, complete) = 51 tasks
**Extended Scope** (Phase 4): User Stories 4-6 (update, delete, workflows) = 20 additional tasks

---

## Phase 1: Setup & Project Initialization

**Goal**: Initialize project structure, dependencies, and configuration for agent service.

**Independent Test**: Project builds successfully, all dependencies installed, configuration loads.

### Setup Tasks

- [ ] T001 Create agent-service/ directory structure with src/, tests/, configs/ subdirectories
- [ ] T002 Create src/__init__.py to mark as Python package
- [ ] T003 Create src/config.py with environment variable configuration (OPENAI_API_KEY, MCP_TOOL_ENDPOINT, USER_ID)
- [ ] T004 [P] Create requirements.txt with dependencies: openai>=1.0.0, pydantic>=2.0.0, httpx>=0.24.0, python-dotenv, pytest, pytest-asyncio
- [ ] T005 [P] Create setup.py for package installation and testing configuration
- [ ] T006 Create .env.example with template configuration values
- [ ] T007 [P] Create tests/__init__.py to mark tests as package
- [ ] T008 [P] Create tests/fixtures/ directory for mock data and test helpers
- [ ] T009 Create README.md with project overview, setup instructions, quickstart, troubleshooting
- [ ] T010 [P] Create .gitignore excluding __pycache__, .env, .pytest_cache, venv/, build/, dist/
- [ ] T011 Create Makefile with targets: setup, test, lint, run (for convenience)
- [ ] T012 [P] Create pyproject.toml with pytest configuration, black settings, type checking

**Checkpoint**: Project structure complete, dependencies installable, configuration management ready.

---

## Phase 2: Foundational Infrastructure

**Goal**: Build core agent infrastructure that all user stories depend on.

**Independent Test**: Agent class instantiates, OpenAI SDK configured, tool definitions load, MCP endpoint reachable.

### Foundational Tasks

- [ ] T013 Create src/tools/__init__.py to mark tools as package
- [ ] T014 [P] Create src/prompts/__init__.py to mark prompts as package
- [ ] T015 [P] Create src/handlers/__init__.py to mark handlers as package
- [ ] T016 Create src/tools/tool_definitions.py with 5 tool definitions for OpenAI SDK (add_task, list_tasks, update_task, complete_task, delete_task) with full parameter schemas per plan.md Phase 1.2
- [ ] T017 Create src/tools/tool_invoker.py with invoke_mcp_tool(tool_name, arguments) function that calls HTTP endpoint, handles errors, returns JSON (per research.md Tool Reliability section)
- [ ] T018 Create src/prompts/system_prompt.md with agent instructions covering intent classification, tool selection rules, clarification requirements, confirmation protocols (per research.md Confirmation Templates)
- [ ] T019 [P] Create src/prompts/tool_mapping_rules.md with NL patterns for each tool (add_task, list_tasks, complete_task, update_task, delete_task) per research.md NL Variation Patterns
- [ ] T020 [P] Create src/prompts/confirmation_patterns.md with response templates for success/error/clarification scenarios per research.md Confirmation Templates section
- [ ] T021 Create src/tools/response_formatter.py with format_success(), format_error(), format_clarification() functions to convert tool responses to user messages
- [ ] T022 Create src/handlers/__init__.py module for intent/parameter/error/workflow handlers
- [ ] T023 [P] Create src/agent.py with TodoAgent class: __init__(), process_message(message: str) → str, _handle_response(), _format_response() methods per plan.md Phase 1 implementation pattern
- [ ] T024 [P] Create tests/fixtures/mock_mcp_tools.py with mock tool responses for successful operations and error scenarios
- [ ] T025 [P] Create tests/fixtures/sample_commands.py with 50+ test input variations for each tool (add, list, complete, update, delete) per research.md NL Variation Patterns
- [ ] T026 [P] Create tests/conftest.py with pytest fixtures: agent instance, mock MCP client, sample tasks, environment setup
- [ ] T027 Create tests/test_agent_basic.py with smoke tests: agent instantiation, basic message processing, tool selection accuracy

**Checkpoint**: Agent infrastructure complete, MCP tool integration ready, all foundational components testable.

---

## Phase 3: User Story 1-3 (MVP - Core Workflows)

### User Story 1: Natural Language Task Creation (Priority: P1)

**Goal**: Agent interprets "add task" natural language and invokes add_task MCP tool.

**Independent Test**: User says "Add task: Buy groceries" → agent extracts title="Buy groceries" → invokes add_task → returns confirmation "Got it! I've added 'Buy groceries' to your tasks."

**Acceptance Scenarios**: 4 scenarios from spec.md US1

#### US1 Implementation Tasks

- [ ] T028 [US1] Create src/handlers/intent_handler.py with classify_intent(message: str) → Intent class that identifies "add/create/new" patterns for add_task tool
- [ ] T029 [US1] Create src/handlers/parameter_extractor.py with extract_add_task_params(message: str) → (title, description) tuples per data-model.md "Parameter Extraction Rules"
- [ ] T030 [P] [US1] Add add_task handling to agent.py: Intent classification → parameter extraction → invoke add_task MCP tool → format response
- [ ] T031 [P] [US1] Implement error handling in agent.py for add_task: title too long, empty title, validation errors from tool
- [ ] T032 [US1] Create tests/test_add_task_agent.py with 12 test cases:
  - Valid add with title only
  - Valid add with title + description
  - Missing title (agent asks for clarification)
  - Title > 255 characters (agent explains limit, suggests fix)
  - Empty/whitespace title (agent clarification)
  - Tool error: database failure (agent explains error)
  - Confirmation message includes task name
  - User variations: "Add task:", "Create:", "New task -", "Remind me to"
  - MCP tool timeout (agent handles gracefully)
  - MCP tool HTTP error (agent explains)
  - Multi-user isolation: different user_ids
  - Task ID returned correctly
- [ ] T033 [P] [US1] Test parameter extraction with 15 variations per research.md NL Variation Patterns for add_task
- [ ] T034 [US1] Verify US1 acceptance scenarios pass: test each of 4 scenarios from spec.md
- [ ] T035 [P] [US1] Add logging to agent.py for audit trail: message received, intent classified, parameters extracted, tool invoked, response formatted

**Checkpoint**: User Story 1 complete and independently testable. Agent can create tasks via natural language.

---

### User Story 2: Task Listing with Intelligent Filtering (Priority: P1)

**Goal**: Agent interprets "list tasks" queries and invokes list_tasks with appropriate status filter.

**Independent Test**: User says "Show my pending tasks" → agent determines status="pending" → invokes list_tasks → formats readable list → displays "You have 3 pending tasks: 1. Buy milk (pending)..."

**Acceptance Scenarios**: 5 scenarios from spec.md US2

#### US2 Implementation Tasks

- [ ] T036 [P] [US2] Create src/handlers/status_filter_handler.py with infer_status_filter(message: str) → "all" | "pending" | "completed" per data-model.md "Parameter Extraction Rules"
- [ ] T037 [US2] Update classify_intent() in intent_handler.py to identify "list/show/view/what are/what do i" patterns for list_tasks tool
- [ ] T038 [P] [US2] Update parameter_extractor.py with extract_list_tasks_params(message: str) → status filter determination
- [ ] T039 [US2] Add list_tasks handling to agent.py: intent classification → status filter determination → invoke list_tasks MCP tool → format readable list response
- [ ] T040 [US2] Implement list response formatter in response_formatter.py: handle multiple tasks, empty list, display format per research.md Confirmation Templates
- [ ] T041 [US2] Create tests/test_list_tasks_agent.py with 14 test cases:
  - Default "what are my tasks" (status="all")
  - "Show pending tasks" (status="pending")
  - "Show completed tasks" (status="completed")
  - "What's left to do" (status="pending", natural language)
  - Empty list response: "You don't have any tasks"
  - Single task display
  - Multiple tasks display (numbered, ID + title + status)
  - Tool error: user not found (explain)
  - Tool error: database error (explain)
  - MCP timeout (retry logic)
  - User variations: 10 different phrasing for each status
  - Multi-user isolation
  - Response format consistency
  - Task status display accuracy
- [ ] T042 [P] [US2] Test status filter extraction with 15 variations per research.md for list_tasks
- [ ] T043 [US2] Verify US2 acceptance scenarios pass: test each of 5 scenarios from spec.md
- [ ] T044 [P] [US2] Add logging for list_tasks flow: intent, status filter, tool call, response format

**Checkpoint**: User Story 2 complete and independently testable. Agent can list tasks with status filtering.

---

### User Story 3: Task Completion Workflow (Priority: P1)

**Goal**: Agent interprets "mark done" commands and invokes complete_task MCP tool.

**Independent Test**: User says "Mark task 1 as done" → agent extracts task_id=1 → invokes complete_task → confirms "Great! I've marked 'Buy milk' as done."

**Acceptance Scenarios**: 4 scenarios from spec.md US3

#### US3 Implementation Tasks

- [ ] T045 [P] [US3] Update classify_intent() in intent_handler.py to identify "complete/done/finish/mark" patterns for complete_task tool
- [ ] T046 [US3] Create src/handlers/task_id_extractor.py with extract_task_id(message: str) → int | None per data-model.md "Parameter Extraction Rules"
- [ ] T047 [P] [US3] Update parameter_extractor.py with extract_complete_task_params(message: str) → task_id
- [ ] T048 [US3] Add complete_task handling to agent.py: intent classification → task_id extraction → invoke complete_task MCP tool → format confirmation response
- [ ] T049 [US3] Implement idempotency check for complete_task in agent.py per research.md "Tool-Specific Behaviors": completing already-completed task succeeds gracefully
- [ ] T050 [US3] Create tests/test_complete_task_agent.py with 12 test cases:
  - Valid "Mark task 1 done" (extracts ID=1)
  - Valid "Complete task 5"
  - Valid "Finish task 3"
  - Missing task ID: "Mark it done" → agent asks "Which task?"
  - Non-existent task ID (tool returns 404 → agent explains)
  - Already completed task (idempotent → success)
  - Tool error: access denied (user doesn't own task)
  - Tool error: database error
  - MCP timeout (retry logic)
  - User variations: 10+ ways to phrase "mark done"
  - Confirmation includes task name from prior context or tool response
  - Task status persists correctly
- [ ] T051 [P] [US3] Test task_id extraction with 12 variations (numeric, natural references, ambiguous)
- [ ] T052 [US3] Verify US3 acceptance scenarios pass: test each of 4 scenarios from spec.md
- [ ] T053 [P] [US3] Add logging for complete_task flow: intent, task_id extraction, tool call, idempotency handling

**Checkpoint**: User Story 3 complete and independently testable. MVP core loop functional (create, list, complete).

**Checkpoint Summary (Phase 3)**: User Stories 1-3 complete. Users can create tasks, list them, and mark them complete via natural language. 51 tasks complete. Ready for MVP deployment or extended scope.

---

## Phase 4: User Story 4-6 (Extended - Advanced Workflows)

### User Story 4: Task Update Operations (Priority: P2)

**Goal**: Agent interprets "update task" commands and invokes update_task MCP tool with title and/or description.

**Independent Test**: User says "Update task 2 to 'Buy milk and eggs'" → agent extracts task_id=2, title="Buy milk and eggs" → invokes update_task → confirms "Updated! Task is now 'Buy milk and eggs'."

**Acceptance Scenarios**: 4 scenarios from spec.md US4

#### US4 Implementation Tasks

- [ ] T054 [P] [US4] Update classify_intent() in intent_handler.py to identify "update/change/edit" patterns for update_task tool
- [ ] T055 [US4] Create src/handlers/update_param_extractor.py with extract_update_task_params(message: str) → (task_id, title, description) per data-model.md "Parameter Extraction Rules"
- [ ] T056 [P] [US4] Update parameter_extractor.py to handle update_task with optional title/description extraction
- [ ] T057 [US4] Add update_task handling to agent.py: intent classification → task_id + field extraction → invoke update_task MCP tool → format response with before/after comparison
- [ ] T058 [US4] Implement validation in agent.py for update_task: at least one of title/description provided, title ≤255 chars
- [ ] T059 [US4] Create tests/test_update_task_agent.py with 14 test cases:
  - Update title only: "Update task 1 to 'New Title'"
  - Update description only: "Change task 2 description"
  - Update both fields
  - Missing task_id (agent clarifies)
  - Missing what to update (agent asks)
  - Task not found error
  - Title too long error → suggests shortening
  - Access denied error (doesn't own task)
  - MCP timeout with retry
  - Tool error: database failure
  - Confirmation shows before/after (current state may not be in context)
  - User variations: 10+ update phrasing patterns
  - Preserves other fields (status unchanged)
  - Updated timestamp reflected
- [ ] T060 [P] [US4] Test parameter extraction for update_task with 12 variations
- [ ] T061 [US4] Verify US4 acceptance scenarios pass: test each of 4 scenarios from spec.md
- [ ] T062 [P] [US4] Add logging for update_task flow

**Checkpoint**: User Story 4 complete and independently testable. Users can update existing tasks.

---

### User Story 5: Task Deletion with Confirmation (Priority: P2)

**Goal**: Agent interprets "delete task" and requires explicit confirmation before invoking delete_task (non-idempotent protection).

**Independent Test**: User says "Delete task 4" → agent asks confirmation "Are you sure?" → user confirms → agent invokes delete_task → confirms "Deleted: Buy groceries"

**Acceptance Scenarios**: 4 scenarios from spec.md US5

#### US5 Implementation Tasks

- [ ] T063 [P] [US5] Update classify_intent() in intent_handler.py to identify "delete/remove" patterns for delete_task tool
- [ ] T064 [US5] Create src/handlers/confirmation_manager.py with request_confirmation(action, task_info) → awaits user response per data-model.md "Error Handling State Machine"
- [ ] T065 [P] [US5] Update parameter_extractor.py with extract_delete_task_params(message: str) → task_id
- [ ] T066 [US5] Add delete_task handling to agent.py: intent classification → task_id extraction → REQUEST CONFIRMATION → (if confirmed) invoke delete_task MCP tool → format response
- [ ] T067 [US5] Implement confirmation workflow in agent.py: return response with state="needs_confirmation", wait for user "yes/confirm", then proceed or cancel
- [ ] T068 [US5] Create tests/test_delete_task_agent.py with 14 test cases:
  - Delete request triggers confirmation message
  - Confirmation includes task name (from context or query before delete)
  - User confirms with "yes", "confirm", "delete it" → tool invoked
  - User declines with "no", "cancel" → task preserved
  - Task not found error during confirmation (explain)
  - Non-existent task in delete request (explain, no confirmation)
  - Access denied (task belongs to different user)
  - MCP timeout during deletion (after confirmation)
  - Tool error: database failure
  - Already deleted task in retry scenario (explain gracefully)
  - Confirmation message format consistency
  - User variations: 10+ delete phrasing
  - Multi-user isolation
  - State tracking: request → confirmation → execution
- [ ] T069 [P] [US5] Test task_id extraction for delete with 10 variations
- [ ] T070 [US5] Verify US5 acceptance scenarios pass: test each of 4 scenarios from spec.md
- [ ] T071 [P] [US5] Add logging for delete workflow: confirmation request, user response, tool invocation

**Checkpoint**: User Story 5 complete and independently testable. Deletion is safe with explicit confirmation.

---

### User Story 6: Multi-Step Workflows (Priority: P2)

**Goal**: Agent handles compound requests like "List pending tasks and mark the first one done" by breaking into sequential tool calls.

**Independent Test**: User says "List my pending tasks and mark the first one done" → agent calls list_tasks(status="pending") → extracts first task → calls complete_task with that ID → reports progress and final result

**Acceptance Scenarios**: 3 scenarios from spec.md US6 (expanded)

#### US6 Implementation Tasks

- [ ] T072 [P] [US6] Create src/handlers/workflow_handler.py with decompose_workflow(message: str) → List[ToolCall] to break compound requests into sequential steps per data-model.md "Multi-Step Workflow Examples"
- [ ] T073 [US6] Implement workflow step sequencing in agent.py: execute first step, use results for parameter extraction of next step, report progress at each stage
- [ ] T074 [P] [US6] Implement intermediate result passing in agent.py: capture list_tasks results, extract task IDs, use in subsequent complete_task call
- [ ] T075 [US6] Add error handling in agent.py for workflow failures: report which step succeeded, which failed, allow user to continue manually
- [ ] T076 [US6] Implement progress reporting in response_formatter.py: "First, I'll list your tasks... Found 3 pending. Now marking the first one done... Done!"
- [ ] T077 [US6] Create tests/test_workflows_agent.py with 10 test cases:
  - List pending + mark first complete
  - List all + show count
  - List + update first task
  - List + delete with confirmation (multi-step confirmation)
  - Step 1 succeeds, step 2 fails → report both
  - Step 1 fails → stop and report
  - User variations: 8+ multi-step phrasing
  - Progress reporting at each step
  - Final summary message
  - Error recovery suggestions
- [ ] T078 [P] [US6] Test workflow decomposition with 8 variations per research.md "Multi-Step Workflow Patterns"
- [ ] T079 [US6] Verify US6 acceptance scenarios pass: test each of 3 scenarios from spec.md
- [ ] T080 [P] [US6] Add logging for workflow execution: decomposition, step execution, results passing, error handling

**Checkpoint**: User Story 6 complete and independently testable. Agent can handle multi-step workflows.

---

## Phase 5: Integration, Validation & Deployment

**Goal**: Full system integration, end-to-end testing, validation of all success criteria, deployment readiness.

**Tasks**: (Would be 15-20 tasks for full deployment phase - omitted here as focus is implementation)

- Integration tests with real Spec 006 MCP tools
- Accuracy benchmarking (SC-001 to SC-010)
- Performance load testing
- User acceptance testing
- Deployment pipeline setup
- Monitoring and alerting configuration
- Production deployment

---

## Dependencies & Execution Order

### Dependency Graph

```
Phase 1: Setup (T001-T012)
         ↓
Phase 2: Foundational (T013-T027)
         ↓
Phase 3: MVP
    ├─ US1 (T028-T035)
    ├─ US2 (T036-T044) [independent, can run parallel with US1]
    └─ US3 (T045-T053) [independent, can run parallel with US1-US2]
         ↓
Phase 4: Extended
    ├─ US4 (T054-T062) [depends on foundational]
    ├─ US5 (T063-T071) [depends on foundational]
    └─ US6 (T072-T080) [depends on US1-US5]
```

### Parallel Execution Opportunities

**Phase 3 Parallelization** (MVP):
- US1 tasks can run independently of US2 and US3 (parallel development)
- US2 tasks can run independently of US1 and US3
- US3 tasks can run independently of US1 and US2
- **Parallel Team Approach**: 3 developers, each on one user story

**Phase 4 Parallelization** (Extended):
- US4 and US5 can run in parallel (separate tool implementations)
- US6 depends on US1-US5 completion before starting
- **Parallel Team Approach**: 2 developers on US4/US5, then 1 on US6

**Foundational-as-Blocker**:
- Phase 2 must complete before any Phase 3 tasks
- All Phase 3 tasks can use foundational components independently

---

## Task Estimation & Effort

| Phase | Tasks | Effort | Duration |
|-------|-------|--------|----------|
| Phase 1 Setup | 12 | 1 developer-week | 1 week |
| Phase 2 Foundational | 15 | 2 developer-weeks | 1 week (can parallelize) |
| Phase 3 MVP | 27 | 3 developer-weeks | 1-2 weeks (parallel US1-3) |
| Phase 4 Extended | 27 | 2.5 developer-weeks | 2 weeks (parallel US4-5, then US6) |
| **Total** | **81** | **8.5 developer-weeks** | **4-5 weeks** |

---

## Task Checklist Format Validation

All 80 implementation tasks follow the strict checklist format:

✅ Checkbox: All tasks start with `- [ ]`
✅ Task ID: Sequential T001-T080
✅ [P] Marker: Included for parallelizable tasks
✅ [Story] Label: Included for US1-US6 phase tasks (none for Setup/Foundational phases)
✅ Description: Clear action with exact file path

**Format Examples**:
- `- [ ] T001 Create agent-service/ directory structure...` ✅
- `- [ ] T003 [P] Create src/config.py with environment variable configuration...` ✅
- `- [ ] T028 [US1] Create src/handlers/intent_handler.py with classify_intent()...` ✅
- `- [ ] T054 [P] [US4] Update classify_intent() in intent_handler.py...` ✅

---

## Success Criteria Alignment

Each user story validates against Spec 007 success criteria:

| User Story | Success Criteria Met | Validation |
|---|---|---|
| US1 (Create) | SC-001, SC-002, SC-005, SC-009 | Tests T032-T035 |
| US2 (List) | SC-001, SC-005, SC-009, SC-010 | Tests T041-T044 |
| US3 (Complete) | SC-001, SC-005, SC-009 | Tests T050-T053 |
| US4 (Update) | SC-001, SC-002, SC-008, SC-009 | Tests T059-T062 |
| US5 (Delete) | SC-001, SC-004, SC-008, SC-009 | Tests T068-T071 |
| US6 (Workflows) | SC-006, SC-007, SC-010 | Tests T077-T080 |

---

## MVP Scope (Phase 1-3)

**Tasks**: 54 tasks (T001-T053)
**User Stories**: US1, US2, US3
**Deliverables**: Agent that creates, lists, and completes tasks via natural language
**Duration**: ~3 weeks
**Team**: 1-3 developers (can parallelize Phase 3)
**Validation**: 39 test cases covering MVP workflows

**Deployment**: Phase 3 completion milestone. Can deploy at this point for user feedback.

---

## Extended Scope (Phase 4)

**Tasks**: 27 additional tasks (T054-T080)
**User Stories**: US4, US5, US6
**Deliverables**: Update, delete, multi-step workflows
**Duration**: ~2 weeks
**Team**: 2-3 developers (can parallelize US4-5, sequence US6)
**Validation**: 34 additional test cases

---

## Next Steps

1. **Claim Tasks**: Developers claim T001-T027 (Setup + Foundational phases)
2. **Phase 3 Parallelization**: 3 developers (US1, US2, US3) can work in parallel once foundational is done
3. **Integration Testing**: Run comprehensive test suite (80+ test cases) after implementation
4. **Validation**: Benchmark against SC-001 to SC-010 success criteria
5. **Deployment**: Deploy MVP after Phase 3, extended features after Phase 4

---

**Task Generation Complete**: 80 implementation tasks across 4 phases
**Status**: Ready for implementation via `/sp.implement` or manual assignment
**Next Command**: Assign tasks to developers or run `/sp.implement`

