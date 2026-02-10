# Feature Specification: AI Agent & Tool-Selection Logic

**Feature Branch**: `007-agent-tool-selection`
**Created**: 2026-02-02
**Status**: Draft
**Input**: Spec 7 - AI Agent & Tool-Selection Logic for todo management via natural language

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| LLM | OpenAI GPT-4 (configurable) | Natural language understanding and function calling |
| Function Calling | OpenAI Tools API | Intent classification and parameter extraction |
| Tool Protocol | MCP (Model Context Protocol) | Backend tool invocation |
| Runtime | Python 3.11+ | Agent service execution |

---

## User Scenarios & Testing

### User Story 1 - Agent Interprets Natural Language Task Creation (Priority: P1)

The agent receives natural language input describing a new task and determines that the `add_task` tool should be invoked. The agent extracts the task title and optional description from the user's message and passes them as parameters to the tool.

**Why this priority**: Task creation is the fundamental operation users perform. Without this, the agent cannot perform any mutations. This is a critical user journey.

**Independent Test**: User says "Add task: Buy groceries" → agent invokes add_task with title="Buy groceries" → tool creates task → agent confirms "Task created: Buy groceries"

**Acceptance Scenarios**:

1. **Given** the user provides a message with task description, **When** the agent analyzes intent, **Then** the agent selects the `add_task` tool
2. **Given** the user specifies title and description ("Create task: Call Mom - remind about birthday"), **When** agent processes input, **Then** agent extracts both title and description and passes to add_task
3. **Given** the add_task tool returns successfully, **When** agent receives response, **Then** agent generates friendly confirmation like "Got it! I've added 'Call Mom' to your tasks."
4. **Given** the add_task tool returns an error (e.g., title too long), **When** agent receives error, **Then** agent explains issue and suggests correction

---

### User Story 2 - Agent Lists Tasks with Intelligent Filtering (Priority: P1)

The agent receives queries about the user's tasks and determines which tool to call with appropriate parameters. The agent understands variations like "show my tasks", "what do I need to do", "list pending items", and filters by status appropriately.

**Why this priority**: Task listing is essential for users to see their work. Combined with creation (US1), these two stories provide a complete MVP.

**Independent Test**: User says "Show my pending tasks" → agent invokes list_tasks with status="pending" → tool returns filtered list → agent presents tasks in readable format

**Acceptance Scenarios**:

1. **Given** user asks "what are my tasks", **When** agent processes query, **Then** agent invokes list_tasks with default status="all"
2. **Given** user says "show completed tasks", **When** agent processes query, **Then** agent invokes list_tasks with status="completed"
3. **Given** user says "what's left to do", **When** agent processes query, **Then** agent invokes list_tasks with status="pending"
4. **Given** list_tasks returns multiple tasks, **When** agent formats response, **Then** agent presents each task with ID, title, and status in user-friendly format
5. **Given** list_tasks returns empty list, **When** agent receives result, **Then** agent responds with "You don't have any tasks" or "All done!" appropriately

---

### User Story 3 - Agent Marks Tasks Complete (Priority: P1)

The agent receives instructions to mark a task as complete and invokes the `complete_task` tool with the correct task identifier. The agent can handle variations like "mark done", "finish", "checked off", etc.

**Why this priority**: Task completion is a primary user action. Combined with US1 and US2, users can create, view, and complete tasks (core loop).

**Independent Test**: User says "Mark task 1 as done" → agent invokes complete_task with task_id=1 → tool updates status → agent confirms "Task marked complete!"

**Acceptance Scenarios**:

1. **Given** user specifies task by ID ("Complete task 5"), **When** agent processes input, **Then** agent extracts task_id and invokes complete_task
2. **Given** user uses natural reference ("Mark the first one done"), **When** agent processes input and prior context shows tasks, **Then** agent asks for clarification or uses most recent task
3. **Given** complete_task returns successfully, **When** agent receives response, **Then** agent confirms completion with positive message
4. **Given** complete_task returns error (task not found), **When** agent receives error, **Then** agent explains "I couldn't find that task" with helpful next steps

---

### User Story 4 - Agent Updates Task Details (Priority: P2)

The agent receives commands to modify an existing task (change title, update description) and invokes the `update_task` tool with the task identifier and new values.

**Why this priority**: Less critical than creation/listing/completion, but valuable for users who need to revise their tasks. Depends on US1 and US2.

**Independent Test**: User says "Change task 3 to 'Buy coffee'" → agent invokes update_task with task_id=3, title="Buy coffee" → agent confirms update

**Acceptance Scenarios**:

1. **Given** user says "update task 2 description to 'URGENT'", **When** agent processes command, **Then** agent invokes update_task with task_id=2 and description update
2. **Given** user says "rename task 5", **When** agent processes partial instruction, **Then** agent asks for new name or confirms current name first
3. **Given** update_task succeeds, **When** agent receives response, **Then** agent confirms change with before/after details
4. **Given** update_task fails (task not found), **When** agent receives error, **Then** agent indicates which task couldn't be found

---

### User Story 5 - Agent Deletes Tasks (Priority: P2)

The agent receives deletion requests and invokes the `delete_task` tool. The agent handles the destructive nature carefully by confirming the action and providing clear feedback.

**Why this priority**: Important for task management but risky if done accidentally. Confirmation and clear feedback are critical.

**Independent Test**: User says "Delete task 4" → agent asks for confirmation → user confirms → agent invokes delete_task → tool removes task → agent confirms deletion

**Acceptance Scenarios**:

1. **Given** user requests task deletion, **When** agent processes request, **Then** agent asks for confirmation ("Are you sure you want to delete 'Buy groceries'?")
2. **Given** user confirms deletion, **When** agent proceeds, **Then** agent invokes delete_task with correct task_id
3. **Given** delete_task succeeds, **When** agent receives response, **Then** agent confirms "Task deleted successfully"
4. **Given** delete_task fails (task already deleted), **When** agent receives error, **Then** agent handles gracefully ("That task was already removed")

---

### User Story 6 - Agent Handles Multi-Step Workflows (Priority: P2)

The agent receives compound requests requiring multiple tool invocations in sequence (e.g., "Show me all tasks and delete the first one", "List pending tasks and mark them complete").

**Why this priority**: Advanced workflows that improve efficiency. Depends on all basic operations (US1-5).

**Independent Test**: User says "List pending tasks and show me how many" → agent invokes list_tasks → formats count and displays tasks

**Acceptance Scenarios**:

1. **Given** user asks for multi-step action, **When** agent processes request, **Then** agent breaks into sequential steps and reports progress
2. **Given** step 1 succeeds but step 2 fails, **When** agent encounters error, **Then** agent reports which step failed and continues if possible
3. **Given** first step returns data needed for second step, **When** agent processes workflow, **Then** agent uses result from first call as input to second call

---

### Edge Cases

- **Ambiguous task reference**: What happens when user says "mark it done" without prior task context? (Agent should ask for clarification)
- **Invalid task ID**: How does agent handle "complete task 999" when no such task exists? (Tool returns error, agent explains to user)
- **Conflicting instructions**: What if user says "delete and keep task 5"? (Agent clarifies intent before acting)
- **Network/tool failure**: What if MCP tool invocation fails? (Agent gracefully reports failure and suggests retry)
- **Rate limiting**: If user makes rapid requests, how does agent handle throttling? (Agent should queue or inform user of limits)
- **Empty/null results**: What if list_tasks returns no tasks when user expects some? (Agent confirms "No tasks found" rather than silent failure)
- **Partial success**: In multi-step workflow, if step 2 fails after step 1 succeeds, what state is left? (Agent reports what succeeded, what failed, and next steps)

---

## Requirements

### Functional Requirements

**Tool Invocation & Mapping**:

- **FR-001**: Agent MUST recognize user intent related to task operations (create, list, update, complete, delete)
- **FR-002**: Agent MUST map natural language commands to correct MCP tools:
  - "Add/create/new task" → `add_task`
  - "List/show/see tasks" → `list_tasks`
  - "Update/change/edit task" → `update_task`
  - "Complete/finish/mark done" → `complete_task`
  - "Delete/remove task" → `delete_task`
- **FR-003**: Agent MUST extract required parameters (user_id, task_id, title, description) from user input with high accuracy
- **FR-004**: Agent MUST validate that required parameters are present before invoking tools (e.g., cannot call add_task without a title)

**Tool Invocation Constraints**:

- **FR-005**: Agent MUST NOT call database or backend APIs directly - all state changes MUST occur through MCP tools
- **FR-006**: Agent MUST NOT modify or delete data without invoking appropriate MCP tool
- **FR-007**: Agent MUST treat tool invocations as explicit and traceable (no silent retries without informing user)
- **FR-008**: Agent MUST pass user_id consistently across all tool calls (treat as authenticated identity)

**Response Generation**:

- **FR-009**: Agent MUST generate clear, friendly confirmation messages reflecting successful tool outcomes
- **FR-010**: Agent MUST generate clear error explanations when tool calls fail (e.g., "Task not found" not "error code 404")
- **FR-011**: Agent MUST NOT expose implementation details or raw error responses to user
- **FR-012**: Agent MUST format list responses in readable way (numbered list, clear labels for status/dates)

**Clarification & Disambiguation**:

- **FR-013**: Agent MUST ask for clarification when user intent is ambiguous (e.g., "which task?" when multiple exist)
- **FR-014**: Agent MUST request confirmation for destructive actions (delete) before invoking tool
- **FR-015**: Agent MUST handle incomplete commands gracefully (e.g., "add task" without title should ask "What should the task title be?")

**Multi-Step Workflows**:

- **FR-016**: Agent MUST support sequential tool invocations in single user message (e.g., "list tasks and tell me the count")
- **FR-017**: Agent MUST handle intermediate results correctly (output from step 1 feeds into step 2)
- **FR-018**: Agent MUST report progress in multi-step workflows ("First, I'll list your tasks... Done. Now I'll...")
- **FR-019**: Agent MUST handle partial failures in workflows ("Step 1 succeeded. Step 2 failed because...")

**Tool-Specific Behaviors**:

- **FR-020**: When invoking `list_tasks`, Agent MUST select appropriate status filter based on user query
- **FR-021**: When invoking `complete_task`, Agent MUST understand it is idempotent (safe to retry)
- **FR-022**: When invoking `delete_task`, Agent MUST request explicit confirmation due to non-idempotent nature
- **FR-023**: When invoking `update_task`, Agent MUST allow partial updates (update title without description, or vice versa)

**Error Handling**:

- **FR-024**: Agent MUST handle tool timeouts gracefully with user-friendly message ("This is taking longer than expected...")
- **FR-025**: Agent MUST handle missing tasks gracefully ("I couldn't find task #5 - it may have been deleted")
- **FR-026**: Agent MUST handle validation errors from tools (e.g., title too long) and suggest corrections

**No AI Reasoning on Data**:

- **FR-027**: Agent MUST NOT use AI reasoning to infer task content, priority, or status beyond what user explicitly states
- **FR-028**: Agent MUST NOT automatically categorize or tag tasks without user request
- **FR-029**: Agent MUST NOT make autonomous decisions about task completion or deletion

**LLM Integration**:

- **FR-030**: Agent MUST use OpenAI function calling for intent classification and parameter extraction
- **FR-031**: Agent MUST use GPT-4 (or configurable model via AGENT_MODEL) for natural language understanding
- **FR-032**: Agent MUST handle LLM API rate limits gracefully with user-friendly error messages
- **FR-033**: Agent MUST timeout LLM API calls after 30 seconds and return appropriate error response

### Key Entities

- **User**: Entity identified by `user_id`; all operations scoped to their tasks
- **Task**: Identified by `task_id`; has title, description, status (pending/completed), timestamps
- **MCP Tool**: Protocol for agent to invoke remote operations (add_task, list_tasks, update_task, complete_task, delete_task)
- **Tool Response**: Success object with updated task data, or error object with message

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Agent correctly interprets and maps ≥95% of natural language commands to correct MCP tools (tested via command dataset)
- **SC-002**: Agent successfully extracts required parameters from user input with ≥98% accuracy (tested via parameter extraction tests)
- **SC-003**: Agent handles ambiguous input by asking for clarification in ≥90% of edge cases (vs. making incorrect assumption)
- **SC-004**: Agent requests confirmation for destructive actions (delete) in 100% of cases
- **SC-005**: Agent generates user-friendly confirmations that are understood by ≥90% of test users
- **SC-006**: Agent processes complete user requests in ≤2 seconds (list, create, update operations)
- **SC-007**: Agent handles multi-step workflows correctly in ≥95% of test scenarios
- **SC-008**: Agent surfaces tool error messages clearly to user with suggested remediation in ≥80% of error cases
- **SC-009**: Agent never calls database or backend APIs directly (100% of operations via MCP tools)
- **SC-010**: Agent successfully completes primary user workflows (create→list→complete) in single session without manual intervention

---

## Assumptions & Constraints

### Assumptions

1. **User Authentication**: Assumes `user_id` is provided by calling layer (API gateway, CLI, chat interface) and treated as authenticated identity. Agent does not verify authentication.

2. **MCP Tools Are Available**: Assumes all 5 MCP tools (add_task, list_tasks, update_task, complete_task, delete_task) are fully functional and available when agent is running.

3. **LLM API Availability**: Assumes OpenAI API is available and OPENAI_API_KEY is configured. Agent requires valid API credentials to function.

3. **Tool Responses Are Valid**: Assumes MCP tool responses are well-formed JSON with consistent error/success structure.

4. **Single User Per Session**: Assumes one `user_id` per agent session. Multi-user sessions not supported.

5. **No Context Persistence**: Agent operates statelessly - each user message is independent. Prior conversation context is not available unless explicitly passed by caller.

6. **Natural Language In English**: Assumes user input is in English. Non-English language support not included.

7. **Reasonable Task IDs**: Assumes task IDs are provided numerically (1, 2, 3) and user can reference them by number.

### Constraints

1. **No Direct Database Access**: Agent MUST only invoke MCP tools; cannot query database directly.

2. **No Autonomous Decisions**: Agent MUST NOT make business logic decisions (e.g., auto-complete overdue tasks, auto-delete old tasks).

3. **No Data Modification Outside Tools**: All state changes MUST flow through MCP tool calls.

4. **No Inter-Session Memory**: Agent has no memory of previous sessions. Each session starts fresh.

5. **Synchronous Tool Calls**: Agent invokes tools sequentially (one at a time), not in parallel.

6. **No Tool Chaining Without Explicit Request**: Agent does not automatically chain multiple tools unless user explicitly requests it.

---

## Dependencies & Integration Points

### Depends On

- **Spec 006 (MCP Adapter)**: Agent depends on all 5 MCP tools being available and functional
- **User Identity Layer**: Agent expects `user_id` to be provided by authentication/API layer

### Provides

- **Tool Usage Layer**: Agents using this agent can invoke natural language commands and receive task updates

### Integration Points

1. **Chat Interface**: Messages arrive as natural language strings; responses returned as formatted text
2. **MCP Protocol**: Bidirectional communication with MCP tools via standard protocol
3. **User Feedback**: Error messages and confirmations fed back to user through chat interface

---

## Out of Scope

- Chat UI or web interface (separate feature)
- Conversation storage or message persistence
- Multi-turn conversation memory
- Task recommendations or AI-driven priority suggestions
- Integration with external calendars, emails, or notifications
- Voice input/output
- Internationalization (non-English languages)
- Task analytics or reporting
- Performance optimization beyond basic responsiveness

---

## Technology Decisions

### Why OpenAI Function Calling?

**Decision**: Use OpenAI's function calling API instead of regex-based intent classification.

**Rationale**:
1. **Higher Accuracy**: Function calling provides superior natural language understanding compared to regex patterns
2. **Native Parameter Extraction**: OpenAI extracts and validates parameters automatically in structured JSON format
3. **Graceful Handling of Edge Cases**: LLM understands variations, typos, and complex multi-intent requests
4. **Reduced Maintenance**: No need to maintain and expand regex patterns for every input variation
5. **Conversational Capability**: LLM can generate natural responses for greetings, help, and clarification
6. **Tool Definition Compatibility**: Tool definitions are already in OpenAI-compatible format

**Trade-offs**:
- Cost: ~$0.0005-0.03 per 1K tokens depending on model
- Latency: API calls add ~500ms-2s vs instant regex matching
- Dependency: Requires external API availability

**Alternatives Considered**:
- Regex-based classification (current): Fast but limited accuracy and maintainability
- Local LLM (Ollama): No API dependency but higher infrastructure complexity
- Anthropic Claude: Excellent NLU but different function calling API format

---

## Open Questions & Notes

- **Session Context**: Should agent remember tasks from earlier in the same session? (Answer: No - each message is independent unless context explicitly passed)
- **Ambiguity Resolution**: How many clarification attempts should agent make before giving up? (Answer: At least 1, possibly 2)
- **Tone/Personality**: Should agent responses be formal, casual, or somewhere in between? (Answer: Friendly and conversational, but not overly casual)

