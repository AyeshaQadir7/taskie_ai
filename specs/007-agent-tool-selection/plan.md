# Implementation Plan: AI Agent & Tool-Selection Logic

**Branch**: `007-agent-tool-selection` | **Date**: 2026-02-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-agent-tool-selection/spec.md`

---

## Summary

Design and implement an AI agent that interprets natural language todo commands and invokes MCP tools accordingly. The agent will:

1. Map natural language variations to the 5 MCP tools from Spec 006
2. Extract required parameters from user input with high accuracy
3. Handle ambiguous references by asking for clarification
4. Request confirmation for destructive actions (delete)
5. Generate friendly, user-readable confirmations and error messages
6. Support multi-step workflows (sequence of tool invocations)

**Technical Approach**: Use OpenAI Agents SDK with function calling to invoke MCP tools. Implement tool mapping via system prompt and function definitions. Use structured responses for consistency.

---

## Technical Context

**Language/Version**: Python 3.13 (matching Spec 006 MCP server)
**Primary Dependencies**:
- OpenAI Agents SDK (agents SDK for function calling)
- asyncio (async/await for tool invocation)
- httpx or similar (HTTP client for MCP tool calls)
- pydantic (response validation)

**Storage**: PostgreSQL via Spec 006 MCP tools (agent does NOT access DB directly)
**Testing**: pytest + pytest-asyncio (matching Spec 006 patterns)
**Target Platform**: Python server (FastAPI endpoint or CLI)
**Project Type**: Single agent service (CLI or API endpoint)
**Performance Goals**:
- Natural language interpretation: <500ms latency
- Tool invocation: <2 seconds per operation
- Multi-step workflows: <5 seconds total

**Constraints**:
- Agent must NEVER access database directly (all via MCP tools)
- Agent must NOT make autonomous business logic decisions
- Agent must request confirmation for destructive actions
- Agent responses must reflect actual tool outcomes

**Scale/Scope**:
- Support 1 user_id per session
- 5 MCP tools to invoke
- 6 primary user stories (basic + advanced workflows)
- Stateless operation per message

---

## Constitution Check

**Gate: Must pass before Phase 0 research. Re-check after Phase 1 design.**

### Principle 1: Spec First, Always ✅ PASS
- Spec 007 specification complete and approved
- 6 user stories with acceptance criteria
- 29 functional requirements documented
- 10 success criteria defined
- Ready for implementation

### Principle 2: Strict Separation of Concerns ✅ PASS
- Agent layer: Interprets NL, invokes MCP tools only
- MCP tools layer (Spec 006): Handle database mutations/reads
- No agent-database direct access (enforced by design)
- No MCP tools business logic (spec 006 enforces)

### Principle 3: Stateless Architecture Enforcement ✅ PASS
- Agent is stateless per message
- Each invocation includes user_id in tool calls
- All state persisted via MCP tools to PostgreSQL
- No conversation history in agent memory

### Principle 4: MCP-First Tooling ✅ PASS
- All task operations via MCP tools (add_task, list_tasks, update_task, complete_task, delete_task)
- Spec 006 MCP tools available and tested
- Agent invokes via MCP protocol (standard tool calling)

### Additional Checks
- ✅ No authentication logic (assumes user_id provided by caller)
- ✅ No autonomous decisions (agent follows user commands)
- ✅ Explicit tool calls (no silent retries)
- ✅ Clear error messages (no raw error codes)

**Status**: GATE PASS - Ready for Phase 0 Research

---

## Project Structure

### Documentation (this feature)

```text
specs/007-agent-tool-selection/
├── spec.md              # Feature specification (APPROVED)
├── plan.md              # This file (Phase 0-1 planning)
├── research.md          # Phase 0 output (research findings)
├── data-model.md        # Phase 1 output (agent design)
├── contracts/           # Phase 1 output (tool call patterns)
│   ├── add_task.json    # Tool contract example
│   ├── list_tasks.json
│   ├── update_task.json
│   ├── complete_task.json
│   └── delete_task.json
├── quickstart.md        # Phase 1 output (getting started)
├── checklists/
│   └── requirements.md  # Quality checklist (APPROVED)
└── tasks.md             # Phase 2 output (task breakdown - from /sp.tasks)
```

### Source Code (repository structure)

```text
agent-service/                          # New service for AI agent
├── src/
│   ├── agent.py                        # Main agent class
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── tool_definitions.py         # Tool definitions for OpenAI SDK
│   │   ├── tool_invoker.py             # MCP tool invocation logic
│   │   └── response_formatter.py       # Format responses for user
│   ├── prompts/
│   │   ├── system_prompt.md            # Agent system prompt
│   │   ├── tool_mapping_rules.md       # NL → tool mapping rules
│   │   └── confirmation_patterns.md    # Message templates
│   ├── handlers/
│   │   ├── intent_handler.py           # Intent classification
│   │   ├── parameter_extractor.py      # Extract tool parameters
│   │   ├── error_handler.py            # Error handling strategies
│   │   └── workflow_handler.py         # Multi-step workflows
│   └── config.py                       # Configuration
├── tests/
│   ├── test_agent.py                   # Agent integration tests
│   ├── test_tool_invocation.py         # Tool calling tests
│   ├── test_nlu.py                     # Natural language understanding tests
│   ├── test_error_handling.py          # Error scenario tests
│   └── fixtures/
│       ├── mock_mcp_tools.py           # Mock MCP tool responses
│       └── sample_commands.py          # Sample user inputs
├── requirements.txt                    # Python dependencies
├── README.md                           # Agent documentation
└── main.py                             # CLI entry point (optional)
```

**Structure Decision**: Single agent service (Option 1) because:
- Agent is a focused, single-responsibility component
- Separate from MCP server (Spec 006) which is already in mcp-server/
- Can be deployed as microservice or CLI tool
- Clear integration point: agent calls MCP tools via HTTP or IPC

---

## Complexity Tracking

**Justification**: No constitution violations. All principles are met by design:
- Spec-first: Spec 007 approved before planning
- Separation: Agent only invokes tools (no DB access)
- Stateless: Per-message operation with user_id context
- MCP-first: All state changes via Spec 006 tools

---

## Phase 0: Research & Clarification

**Prerequisites**: Spec 007 specification complete ✅

**Research Tasks**:

1. **OpenAI Agents SDK Patterns** (Research: Best practices)
   - How to define tool functions in SDK
   - Function calling workflow (invoke → response → retry logic)
   - Error handling and retries
   - Response formats and validation

2. **Natural Language Intent Classification** (Research: NLU techniques)
   - How LLMs classify todo commands
   - Tool selection patterns
   - Confidence thresholds for ambiguity detection
   - Common NL variations for each tool

3. **Parameter Extraction Strategies** (Research: Information extraction)
   - Extracting task titles from unstructured text
   - Identifying task IDs from natural references
   - Status filter inference ("pending", "completed", "all")
   - Error detection and correction suggestions

4. **Multi-Step Workflow Patterns** (Research: Agentic reasoning)
   - How to handle sequential tool calls
   - Intermediate state management (results from step 1 → input to step 2)
   - Error propagation in workflows
   - Progress reporting to user

5. **Confirmation Message Templates** (Research: UX best practices)
   - Friendly confirmation patterns for each operation
   - Error message clarity standards
   - Disambiguation questions
   - Recovery suggestions

**Output**: research.md documenting:
- Decision: [what was chosen/determined]
- Rationale: [why chosen]
- Alternatives considered: [what else was evaluated]

---

## Phase 1: Design & Contracts

**Prerequisites**: research.md complete ✅

### 1.1 Agent Design Document (data-model.md)

Define the agent's conceptual model:

**Agent Architecture**:
- Input: User message (natural language string)
- Processing: Intent classification → Parameter extraction → Tool selection
- Output: Tool call(s) + User message

**Tool Selection Rules** (from Spec 007 FR-002):
```
User Input Patterns       → Tool         → Parameters
"add", "create", "new"   → add_task     → title, description
"list", "show", "view"   → list_tasks   → status (optional)
"update", "change", "edit" → update_task → task_id, title/description
"complete", "done", "finish" → complete_task → task_id
"delete", "remove"        → delete_task → task_id
```

**Agent State Machine**:
```
User Input
    ↓
Intent Classification (NL → tool name)
    ↓
Validate: All required parameters present?
    ├─ NO → Ask for missing info
    └─ YES → Continue
    ↓
Extract Parameters
    ↓
Confirm if Destructive? (delete_task)
    ├─ YES → Request confirmation
    └─ NO → Proceed
    ↓
Invoke MCP Tool
    ↓
Format Response
    ├─ Success → Friendly confirmation
    └─ Error → Explain issue + suggest fix
    ↓
Return to User
```

**Entities**:
- **User**: Identified by user_id (from session context)
- **Message**: Natural language input from user
- **Intent**: Classification of tool to invoke (add_task, list_tasks, etc.)
- **ToolCall**: Parameters extracted for specific tool
- **ToolResponse**: Result from MCP tool (success or error)
- **UserMessage**: Formatted response for user

### 1.2 Tool Definitions (contracts/)

For each of the 5 MCP tools, define how agent will invoke:

**Example: add_task.json**
```json
{
  "name": "add_task",
  "description": "Create a new task with title and optional description",
  "parameters": {
    "user_id": "string (from session)",
    "title": "string (extracted from user input, max 255 chars)",
    "description": "string or null (optional, extracted from user input)"
  },
  "response": {
    "success": {
      "task_id": "integer",
      "title": "string",
      "status": "pending",
      "created_at": "ISO8601 timestamp"
    },
    "error": {
      "error": "string (error message)"
    }
  },
  "user_message_template": {
    "success": "Got it! I've added '{title}' to your tasks.",
    "error": "I couldn't create that task: {error_message}. Try again?"
  }
}
```

Similar contracts for: list_tasks, update_task, complete_task, delete_task

### 1.3 System Prompt & Rules (prompts/)

**system_prompt.md**: Agent instructions
```
You are a helpful todo assistant. Your job is to interpret user messages
and invoke the appropriate task management tools.

## Rules

1. Tool Selection: When user mentions tasks, determine which tool to use:
   - "add/create/new task" → add_task
   - "list/show/view tasks" → list_tasks
   - "update/change task" → update_task
   - "complete/finish/done" → complete_task
   - "delete/remove task" → delete_task

2. Parameter Extraction: Extract exactly what the tool needs:
   - add_task: Extract title (required), description (optional)
   - list_tasks: Determine status filter (all/pending/completed)
   - update_task: Extract task_id, new title or description
   - complete_task: Extract task_id
   - delete_task: Extract task_id

3. Clarification: If ambiguous:
   - "which task?" when multiple possibilities
   - "update the title or description?" when unclear
   - Suggest based on context if possible

4. Confirmation: For delete operations:
   - Always ask "Are you sure you want to delete {task_name}?"
   - Only proceed after user confirms

5. Response Format: Always respond in user-friendly language:
   - Confirmations: "Done! I've created your task..."
   - Errors: "I couldn't do that because... Try..."
   - Never expose raw error codes or technical details

6. Constraints:
   - Never make decisions for the user
   - Never modify data without confirming destructive actions
   - Never access database directly (use MCP tools only)
   - Never retry without informing user
```

**tool_mapping_rules.md**: NL pattern matching
```
# Natural Language → Tool Mapping

## add_task Patterns
- "add task: {title}"
- "create {title}"
- "new task - {title}"
- "I need to {title}"
- "remind me to {title}"

## list_tasks Patterns
- "show my tasks"
- "what are my tasks"
- "list pending tasks" → status=pending
- "show completed" → status=completed
- "what's left to do" → status=pending

## update_task Patterns
- "update task {id} to {new title}"
- "change task {id} description"
- "edit task {id}"

## complete_task Patterns
- "mark task {id} done"
- "complete task {id}"
- "finish task {id}"
- "check off task {id}"

## delete_task Patterns
- "delete task {id}"
- "remove task {id}"
- "remove {id}"
```

### 1.4 Quickstart (quickstart.md)

Getting started guide:
- Setup OpenAI Agents SDK
- Configure MCP tool endpoint
- Run sample agent interactions
- Test with representative commands

---

## Phase 2: Task Breakdown (via /sp.tasks)

This plan stops here. Next step: `/sp.tasks` will generate the detailed task breakdown that includes:

- Individual implementation tasks for each component
- Task dependencies and ordering
- Estimated effort per task
- Test cases for each task
- Integration points

**Expected Output**: specs/007-agent-tool-selection/tasks.md

---

## Key Design Decisions

### Decision 1: OpenAI Agents SDK for Function Calling
**Chosen**: Use OpenAI Agents SDK with function definitions
**Rationale**: Agents SDK is designed for tool-calling workflows; leverages fine-tuned reasoning for function selection
**Alternative**: Custom prompt engineering (would require more tuning, less reliable)

### Decision 2: Stateless per Message
**Chosen**: Agent maintains NO conversation memory; each message is independent
**Rationale**: Matches Constitution Principle III (stateless architecture); enables scaling and session resumption
**Alternative**: In-memory conversation context (violates statelessness)

### Decision 3: Explicit Confirmation for Delete
**Chosen**: Agent always asks "Are you sure?" before invoking delete_task
**Rationale**: delete_task is non-idempotent; prevents accidental data loss
**Alternative**: Auto-delete without confirmation (data loss risk)

### Decision 4: Tool Invocation via MCP Protocol
**Chosen**: Agent calls MCP tools (Spec 006) via standard tool calling
**Rationale**: Maintains separation of concerns; enforces stateless architecture; leverages existing tool infrastructure
**Alternative**: Agent calls API endpoints directly (couples to implementation)

### Decision 5: Parameter Extraction via LLM + Validation
**Chosen**: OpenAI SDK extracts parameters via function definitions; validation via Pydantic schemas
**Rationale**: LLM is good at understanding NL; schemas catch invalid inputs
**Alternative**: Regex/rule-based extraction (brittle, error-prone)

---

## Dependencies

### Depends On
- **Spec 006 (MCP Adapter)**: All 5 MCP tools must be deployed and accessible
- **OpenAI API**: Access to gpt-4 or gpt-3.5-turbo models
- **User Session Context**: Caller must provide user_id and MCP tool endpoint URL

### Provides
- Natural language interface for todo operations
- Integration point for chat UI, CLI, or voice interface

### Integration Points
1. **Input**: Chat interface, CLI, or voice-to-text service sends user message
2. **Processing**: Agent interprets and invokes MCP tools
3. **Output**: Agent returns formatted response to calling interface

---

## Success Metrics (from Spec 007)

- SC-001: ≥95% command interpretation accuracy
- SC-002: ≥98% parameter extraction accuracy
- SC-003: ≥90% clarification on ambiguous input
- SC-004: 100% confirmation for destructive actions
- SC-005: ≤2 second response time per tool invocation
- SC-006: ≤5 second multi-step workflow time
- SC-007: ≥95% multi-step workflow success rate
- SC-008: ≥80% of errors suggest remediation
- SC-009: 100% of operations via MCP tools (zero direct DB access)
- SC-010: 100% of user workflows complete without manual intervention

---

## Next Steps

1. **Run `/sp.tasks`** to generate detailed task breakdown
2. **Run `/sp.implement`** to execute implementation via agents
3. **Run integration tests** with Spec 006 MCP tools
4. **Deploy** agent service

---

**Plan Status**: ✅ COMPLETE - Ready for `/sp.tasks`
**Constitutional Alignment**: ✅ ALL PRINCIPLES PASS
**Next Command**: `/sp.tasks`

