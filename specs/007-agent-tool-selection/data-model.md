# Agent Design Model: Data Structures & Workflows

**Date**: 2026-02-02
**Feature**: Spec 007 - AI Agent & Tool-Selection Logic
**Purpose**: Define the conceptual data model for the agent

---

## Conceptual Model

The agent operates as a state machine processing natural language input into tool invocations:

```
┌─────────────────────────────────────────────────────────────────┐
│                         AGENT FLOW                               │
└─────────────────────────────────────────────────────────────────┘

USER INPUT (Natural Language)
         ↓
┌─────────────────────┐
│ INTENT              │  Classify which tool to use
│ CLASSIFICATION      │  - add_task / list_tasks / update_task
└──────────┬──────────┘    / complete_task / delete_task
         ↓
┌─────────────────────┐
│ PARAMETER           │  Extract required parameters
│ EXTRACTION          │  - title, description, status, task_id
└──────────┬──────────┘
         ↓
┌─────────────────────┐
│ VALIDATION          │  Check: all required params present?
│ & CLARIFICATION     │  If missing: Ask user for clarification
└──────────┬──────────┘
         ↓
┌─────────────────────┐
│ DESTRUCTIVE         │  If delete: Request confirmation?
│ ACTION CHECK        │  If yes: Wait for user confirmation
└──────────┬──────────┘
         ↓
┌─────────────────────┐
│ TOOL INVOCATION     │  Call MCP tool with extracted params
│ (MCP PROTOCOL)      │  Pass: user_id, params, context
└──────────┬──────────┘
         ↓
┌─────────────────────┐
│ RESPONSE            │  Success: format confirmation message
│ FORMATTING          │  Error: explain issue & suggest fix
└──────────┬──────────┘
         ↓
USER OUTPUT (Formatted Message)
```

---

## Core Data Structures

### 1. AgentRequest

Represents the input to the agent.

```python
class AgentRequest:
    user_id: str                          # Required: authenticated user ID
    message: str                          # Required: natural language input
    conversation_id: str                  # Optional: for audit trail
    prior_context: Optional[dict]         # Optional: prior tasks for context

    # Example:
    # AgentRequest(
    #   user_id="user123",
    #   message="Mark the first task done",
    #   prior_context={"tasks": [...]}
    # )
```

**Invariants**:
- `user_id` is never empty (provided by authentication layer)
- `message` is non-empty string (provided by user)
- `prior_context` may be None (agent fetches via tools if needed)

---

### 2. Intent

Represents the agent's classification of the user's request.

```python
class Intent:
    tool_name: str                        # One of: add_task, list_tasks, update_task,
                                          #         complete_task, delete_task
    confidence: float                     # 0.0 to 1.0 (>0.95 = high confidence)
    reasoning: str                        # Why this tool was chosen

    # Example:
    # Intent(
    #   tool_name="complete_task",
    #   confidence=0.98,
    #   reasoning="User said 'mark done' which indicates completion"
    # )
```

**Intent Classification Rules** (from Spec 007 FR-002):

| User Pattern | Tool | Confidence | Example |
|---|---|---|---|
| "add", "create", "new", "remind me" | add_task | >0.99 | "Add task: buy groceries" |
| "list", "show", "view", "what are", "what do i" | list_tasks | >0.98 | "Show my tasks" |
| "update", "change", "edit" | update_task | >0.90 | "Update task 1 to urgent" |
| "complete", "done", "finish", "mark" | complete_task | >0.95 | "Mark task 1 done" |
| "delete", "remove" | delete_task | >0.98 | "Delete task 3" |

---

### 3. ToolCall

Represents the parameters extracted for a specific tool invocation.

```python
class ToolCall:
    tool_name: str                        # Which tool to invoke
    user_id: str                          # Always included (from session)

    # Tool-specific parameters (one subset applies):

    # For add_task:
    title: Optional[str]                  # Required: task title (extracted)
    description: Optional[str]            # Optional: task description

    # For list_tasks:
    status: Optional[str]                 # Optional: "all", "pending", or "completed"

    # For update_task:
    task_id: Optional[int]                # Required: which task to update
    # (title and/or description may be included)

    # For complete_task:
    task_id: Optional[int]                # Required: which task to complete

    # For delete_task:
    task_id: Optional[int]                # Required: which task to delete

    # Metadata:
    extraction_confidence: float          # 0.0-1.0 how confident in extraction
    validation_errors: List[str]          # Any validation issues

    # Example (add_task):
    # ToolCall(
    #   tool_name="add_task",
    #   user_id="user123",
    #   title="Buy groceries",
    #   description="Milk, eggs, bread",
    #   extraction_confidence=0.98
    # )
```

**Validation Rules** (applied before tool invocation):

- `add_task`: title is required, not empty, ≤255 chars
- `list_tasks`: status must be "all", "pending", "completed", or None
- `update_task`: task_id required, at least one of title/description provided
- `complete_task`: task_id required
- `delete_task`: task_id required

---

### 4. ToolResponse

Represents the result of tool invocation.

```python
class ToolResponse:
    tool_name: str                        # Which tool was called
    status: str                           # "success" or "error"
    result: dict                          # Tool result JSON

    # Success format:
    # ToolResponse(
    #   tool_name="add_task",
    #   status="success",
    #   result={"task_id": 1, "title": "Buy groceries", "status": "pending", ...}
    # )

    # Error format:
    # ToolResponse(
    #   tool_name="add_task",
    #   status="error",
    #   result={"error": "String should have at most 255 characters"}
    # )
```

**Possible Responses** (from Spec 006 MCP tools):

**add_task Success**:
```json
{
  "task_id": 1,
  "title": "Buy groceries",
  "status": "pending",
  "created_at": "2026-02-02T10:00:00Z"
}
```

**add_task Error**:
```json
{
  "error": "Title is required"
}
```

**list_tasks Success**:
```json
{
  "tasks": [
    {"id": 1, "title": "Buy milk", "status": "pending", ...},
    {"id": 2, "title": "Pay bills", "status": "completed", ...}
  ]
}
```

**complete_task Error**:
```json
{
  "error": "Task not found or access denied"
}
```

---

### 5. AgentResponse

Represents the agent's output to the user.

```python
class AgentResponse:
    user_message: str                     # What user sees
    tool_calls: List[dict]                # Audit trail of tools called
    state: str                            # "complete", "needs_clarification",
                                          #  "needs_confirmation", "error"

    # Example:
    # AgentResponse(
    #   user_message="Got it! I've added 'Buy groceries' to your tasks.",
    #   tool_calls=[
    #     {
    #       "tool": "add_task",
    #       "parameters": {"title": "Buy groceries", "description": None},
    #       "result": {"task_id": 1, "status": "pending"}
    #     }
    #   ],
    #   state="complete"
    # )
```

**Response States**:

| State | Meaning | Example |
|---|---|---|
| "complete" | Operation succeeded; message ready | "Done! I've added 'Buy groceries'." |
| "needs_clarification" | Missing parameters; asking user | "Which task did you mean?" |
| "needs_confirmation" | Destructive action; requesting approval | "Are you sure you want to delete...?" |
| "error" | Operation failed; error explained | "I couldn't find that task." |

---

## Tool Selection Decision Tree

```
User input received
         ↓
Is this a create/add request?
  ├─ YES → add_task
  └─ NO ↓
Is this a list/view/show request?
  ├─ YES → list_tasks
  └─ NO ↓
Is this an update/change/edit request?
  ├─ YES → update_task
  └─ NO ↓
Is this a complete/done/finish request?
  ├─ YES → complete_task
  └─ NO ↓
Is this a delete/remove request?
  ├─ YES → delete_task
  └─ NO ↓
Unknown intent → Ask for clarification
```

---

## Parameter Extraction Rules

### add_task

**Required**: title
**Optional**: description

**Extraction Pattern**:
```
Input: "Add task: Buy groceries - remember milk and eggs"
Extracted: title="Buy groceries", description="remember milk and eggs"

Input: "Create: Fix the report"
Extracted: title="Fix the report", description=None

Input: "Add task"  ← Missing title
Extracted: title=None, description=None
Clarification needed: "What's the task?"
```

### list_tasks

**Optional**: status (defaults to "all" if not specified)

**Extraction Pattern**:
```
Input: "Show my pending tasks"
Extracted: status="pending"

Input: "Show completed"
Extracted: status="completed"

Input: "What are my tasks"
Extracted: status="all"

Input: "Show completed tasks" (verb: "show") ← Could be ambiguous
Extracted: status="all" (default), OR ask for clarification
```

### update_task

**Required**: task_id, at least one of (title, description)

**Extraction Pattern**:
```
Input: "Update task 1 to 'Call Mom'"
Extracted: task_id=1, title="Call Mom", description=None

Input: "Change task 5 description to urgent"
Extracted: task_id=5, title=None, description="urgent"

Input: "Edit task 3"  ← Missing what to update
Clarification: "Update the title or description?"
```

### complete_task

**Required**: task_id

**Extraction Pattern**:
```
Input: "Mark task 1 done"
Extracted: task_id=1

Input: "Complete task 5"
Extracted: task_id=5

Input: "Mark it done"  ← Ambiguous task reference
Clarification: "Which task?" (if prior context available, suggest first one)
```

### delete_task

**Required**: task_id
**Special**: Always requires confirmation before invocation

**Extraction Pattern**:
```
Input: "Delete task 3"
Extracted: task_id=3
Confirmation: "Are you sure you want to delete 'Task Name'?"

Input: "Remove task 10"  ← Out of range
Tool will return error: "Task not found or access denied"
Agent response: "I couldn't find task 10. You have X tasks."
```

---

## Error Handling State Machine

```
Tool Invocation
         ↓
Response received
         ↓
Is it success?
  ├─ YES → Format response and return
  └─ NO ↓
Is error recoverable (user clarification)?
  ├─ YES → Ask clarifying question
  │        (e.g., "Which task did you mean?")
  └─ NO ↓
Is error transient (timeout)?
  ├─ YES → Retry (up to 2 more times)
  │        If all fail: "Try again in a moment"
  └─ NO ↓
Error is persistent
         ↓
Format user-friendly error message
         ↓
Suggest remediation if possible
         ↓
Return error response to user
```

---

## Multi-Step Workflow Examples

### Example 1: "List pending tasks and mark the first one done"

```
1. Agent Intent: Recognize multi-step workflow
   - First step: list_tasks with status="pending"
   - Second step: extract first task ID from results
   - Third step: complete_task with that ID

2. Execution:
   Step 1 → list_tasks(user_id="user123", status="pending")
   Response: {"tasks": [{"id": 5, "title": "Buy milk"}, {"id": 7, "title": "Pay bills"}]}

   Step 2 → Extract: first task is ID 5

   Step 3 → complete_task(user_id="user123", task_id=5)
   Response: {"id": 5, "title": "Buy milk", "status": "completed"}

3. User Message:
   "Done! I've marked 'Buy milk' as complete. You have 1 pending task left."
```

### Example 2: "Show me my tasks and update the first one to urgent"

```
1. Intent: Multi-step (list → update)
2. Execution:
   Step 1 → list_tasks(user_id="user123", status="all")
   Response: [{"id": 1, "title": "..."}]
   Step 2 → update_task(user_id="user123", task_id=1, title="Urgent: ...")
   Response: {"id": 1, "title": "Urgent: ...", ...}
3. Output: "Listed your tasks. Updated task 1 to 'Urgent: ...'."
```

---

## Stateless Message Flow

**Key Principle**: Agent maintains NO persistent state between messages.

```
Request 1: {"user_id": "user123", "message": "List my tasks"}
Agent processes → Calls list_tasks → Returns response
Agent state after: Empty (all context discarded)

Request 2: {"user_id": "user123", "message": "Mark the first one done"}
Agent processes → But has NO memory of prior list!
Solution: Either:
  a) Include prior context in request: {"prior_context": {"tasks": [...]}}
  b) Agent calls list_tasks again to get current state

Result: Agent asks "Which task?" OR fetches fresh list
```

**Why Stateless**:
- Enables horizontal scaling
- Survives server restarts
- Each message is independently processable
- Matches Constitution Principle III

---

## Validation & Constraints

### Input Validation (before tool invocation)

- **user_id**: Required, non-empty
- **title**: Required for add_task, max 255 chars, not empty/whitespace
- **task_id**: Required for update/complete/delete, must be integer, >0
- **status**: Optional for list_tasks, must be "all"/"pending"/"completed"
- **description**: Optional, no length limit

### Output Validation (from tool response)

- Tool response must be valid JSON
- Success: Must contain expected fields (task_id, title, status, etc.)
- Error: Must contain "error" key with string message
- Agent validates using Pydantic schemas from Spec 006

### State Invariants

- Agent never modifies data without tool invocation
- user_id is consistent across all tool calls in a workflow
- Tool response is always formatted before returning to user
- Destructive actions (delete) always require confirmation

---

## Design Summary

**Agent Architecture**:
- Stateless per-message processing
- Intent classification via LLM
- Parameter extraction via function calling
- Validation via Pydantic schemas
- Tool invocation via MCP protocol
- Response formatting with templates

**Data Flow**:
- User input → Intent + ToolCall → Invocation → ToolResponse → User output

**State Management**:
- No persistent agent state
- All context passed in request or fetched via tools
- Tool responses are audit trail
- Database (via MCP) is source of truth

**Error Handling**:
- User clarification (missing params)
- Tool error explanation
- Transient failure retry
- Persistent error messaging with suggestions

---

**Design Complete**: Ready for contract definitions and quickstart.
