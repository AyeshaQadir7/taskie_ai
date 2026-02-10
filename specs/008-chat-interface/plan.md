# Implementation Plan: Chat Interface & Stateless Conversation Orchestration

**Feature**: Spec 008 - Chat Interface & Stateless Conversation Orchestration
**Created**: 2026-02-02
**Status**: Planning Complete
**Target**: 6 User Stories, 20 Functional Requirements, 10 Success Criteria

---

## Phase 0: Technical Context & Research

### Dependencies Analysis

| Dependency | Source | Status | Integration Point |
|------------|--------|--------|-------------------|
| User Authentication | Phase II | ✅ Available | JWT token validation on /api/{user_id}/chat |
| AI Agent | Spec 007 | ✅ Available | agent.process_message(reconstructed_history) |
| MCP Tools | Spec 007 | ✅ Available | Tool calls embedded in agent responses |
| Database Layer | Phase II | ✅ Available | SQLAlchemy ORM with SQLModel |
| Neon PostgreSQL | Phase II | ✅ Available | Connection string from environment |

### Technology Decisions

| Decision | Rationale | Implications |
|----------|-----------|--------------|
| Stateless API | Requirement FR-011: zero in-memory state | Simpler code, horizontal scalability, but requires DB fetch per request |
| Message Persistence First | Requirement FR-007: persist before agent execution | Prevents message loss on agent failure, maintains audit trail |
| Per-Request History Reconstruction | Requirement FR-012: reconstruct context per request | Enables stateless design, eliminates race conditions |
| SQLAlchemy ORM | Industry standard, type-safe | ORM overhead acceptable for conversation sizes (100s of messages) |
| PostgreSQL JSON columns | Tool calls and parameters are JSON | Flexible schema, queryable parameters, audit trail |
| Concurrent Request Handling | Requirement FR-015: no race conditions | Database-level optimistic locking or transaction isolation |

### Research Findings - No Clarifications Needed

All requirements are clear and actionable based on:
- ✅ Project context from Spec 007 (Agent system fully implemented)
- ✅ Phase II infrastructure (authentication, database, ORM)
- ✅ Standard web application patterns (stateless API, message persistence)
- ✅ Database transaction semantics (ACID guarantees)

---

## Phase 1: Design & Data Models

### Database Schema

#### Table: conversations
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL FOREIGN KEY(users.id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  title TEXT,
  UNIQUE(id, user_id),
  INDEX(user_id, created_at DESC)
);
```

**Purpose**: Represents a single chat thread
**Access Patterns**:
- Fetch all conversations for user: `SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC`
- Fetch specific conversation: `SELECT * FROM conversations WHERE id = $1 AND user_id = $2`
- Create new conversation: `INSERT INTO conversations (...) VALUES (...) RETURNING id`

#### Table: messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL FOREIGN KEY(conversations.id),
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  INDEX(conversation_id, created_at ASC)
);
```

**Purpose**: Individual messages in conversation
**Access Patterns**:
- Fetch conversation history: `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`
- Create message: `INSERT INTO messages (...) VALUES (...) RETURNING id`

#### Table: tool_calls
```sql
CREATE TABLE tool_calls (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL FOREIGN KEY(messages.id),
  tool_name TEXT NOT NULL,
  parameters JSONB NOT NULL,
  result JSONB NOT NULL,
  executed_at TIMESTAMP NOT NULL DEFAULT now(),
  INDEX(message_id, executed_at DESC)
);
```

**Purpose**: Record of MCP tool invocations
**Access Patterns**:
- Fetch tool calls for message: `SELECT * FROM tool_calls WHERE message_id = $1`
- Create tool call: `INSERT INTO tool_calls (...) VALUES (...) RETURNING id`
- Find tool calls in conversation: `SELECT tc.* FROM tool_calls tc JOIN messages m ON tc.message_id = m.id WHERE m.conversation_id = $1`

### SQLModel Data Models

```python
# models/conversation.py
from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4
from datetime import datetime

class ConversationBase(SQLModel):
    title: str | None = None

class Conversation(ConversationBase, table=True):
    __tablename__ = "conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    messages: list["Message"] = Relationship(back_populates="conversation")

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversations.id", index=True)
    role: str = Field(index=True)  # "user" or "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    conversation: Conversation = Relationship(back_populates="messages")
    tool_calls: list["ToolCall"] = Relationship(back_populates="message")

class ToolCall(SQLModel, table=True):
    __tablename__ = "tool_calls"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    message_id: UUID = Field(foreign_key="messages.id", index=True)
    tool_name: str
    parameters: dict = Field(sa_column=Column(JSON))
    result: dict = Field(sa_column=Column(JSON))
    executed_at: datetime = Field(default_factory=datetime.utcnow)
    message: Message = Relationship(back_populates="tool_calls")
```

### API Contracts

#### POST /api/{user_id}/chat

**Purpose**: Send message and receive agent response with conversation continuity

**Request**:
```json
{
  "message": "Add task: Buy groceries",
  "conversation_id": "optional-uuid-or-null"
}
```

**Response (Success)**:
```json
{
  "status": "success",
  "conversation_id": "uuid",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Add task: Buy groceries",
      "created_at": "2026-02-02T22:00:00Z",
      "tool_calls": []
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Great! I've added 'Buy groceries' to your tasks.",
      "created_at": "2026-02-02T22:00:01Z",
      "tool_calls": [
        {
          "id": "uuid",
          "tool_name": "add_task",
          "parameters": {"title": "Buy groceries", "description": null},
          "result": {"task_id": "1", "status": "created"},
          "executed_at": "2026-02-02T22:00:01Z"
        }
      ]
    }
  ]
}
```

**Response (Error)**:
```json
{
  "status": "error",
  "error_code": "not_found|invalid_auth|database_error|timeout",
  "error": "Meaningful error message",
  "conversation_id": "uuid-if-applicable"
}
```

**Status Codes**:
- 200: Success
- 400: Invalid request (missing message, invalid JSON)
- 401: Unauthorized (no JWT token or invalid)
- 403: Forbidden (accessing another user's conversation)
- 404: Not found (conversation_id doesn't exist)
- 500: Server error (database, agent timeout)
- 503: Service unavailable (database down)

#### Request Validation

- `user_id`: Must match JWT subject and be valid UUID
- `message`: Required, must be non-empty string, max 5000 chars
- `conversation_id`: Optional, must be valid UUID if provided

#### Response Structure

- `status`: "success" or "error"
- `conversation_id`: UUID of conversation
- `messages`: Array of messages in chronological order (if success)
- `tool_calls`: For each assistant message, array of tool invocations
- `error_code` and `error`: Only on error status

---

## Phase 2: Implementation Breakdown

### User Story 1: Start New Conversation (P1)

#### Task 1.1: Implement POST /api/{user_id}/chat Endpoint

**Location**: `backend/routes/chat.py`

**Implementation**:
```python
@router.post("/api/{user_id}/chat")
async def chat_endpoint(
    user_id: str,
    request: ChatRequest,
    current_user: User = Depends(verify_jwt_token)
) -> ChatResponse:
    """
    Chat endpoint: creates new conversation or continues existing one.
    Fully stateless - reconstructs history from database per request.
    """
    # Step 1: Validate user authorization
    if current_user.id != UUID(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Step 2: Create new conversation or validate existing one
    if request.conversation_id:
        conversation = await db.get_conversation(
            request.conversation_id,
            current_user.id
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = await db.create_conversation(current_user.id)

    # Step 3: Persist user message BEFORE agent execution
    user_message = await db.create_message(
        conversation_id=conversation.id,
        role="user",
        content=request.message
    )

    # Step 4: Fetch full conversation history (excluding current message initially)
    history = await db.get_conversation_history(conversation.id)

    # Step 5: Reconstruct agent context
    reconstructed_history = [
        {"role": m.role, "content": m.content}
        for m in history
    ]

    # Step 6: Invoke agent with reconstructed history
    try:
        agent_response = await agent.process_message(
            request.message,
            history=reconstructed_history,
            user_id=str(current_user.id)
        )
    except TimeoutError:
        raise HTTPException(status_code=500, detail="Agent timeout")
    except Exception as e:
        logger.error(f"Agent error: {e}")
        raise HTTPException(status_code=500, detail="Agent processing failed")

    # Step 7: Persist assistant response
    assistant_message = await db.create_message(
        conversation_id=conversation.id,
        role="assistant",
        content=agent_response["content"]
    )

    # Step 8: Persist tool calls if present
    tool_calls = agent_response.get("tool_calls", [])
    for tc in tool_calls:
        await db.create_tool_call(
            message_id=assistant_message.id,
            tool_name=tc["tool_name"],
            parameters=tc["parameters"],
            result=tc["result"]
        )

    # Step 9: Return full conversation history
    final_history = await db.get_conversation_history(conversation.id)

    return ChatResponse(
        status="success",
        conversation_id=str(conversation.id),
        messages=format_messages(final_history)
    )
```

**Tests**:
- Test 1.1.1: Send message without conversation_id, verify new conversation created
- Test 1.1.2: Verify agent receives message and processes it
- Test 1.1.3: Verify user message persisted in database
- Test 1.1.4: Verify agent response persisted in database
- Test 1.1.5: Verify conversation_id returned in response
- Test 1.1.6: Verify response format matches spec

#### Task 1.2: Implement Conversation Database Operations

**Location**: `backend/db/conversations.py`

**Operations**:
- `create_conversation(user_id: UUID) -> Conversation`
- `get_conversation(id: UUID, user_id: UUID) -> Conversation | None`
- `list_conversations(user_id: UUID) -> list[Conversation]`
- `update_conversation_timestamp(id: UUID) -> None`

**Tests**:
- Test 1.2.1: Create conversation and verify in database
- Test 1.2.2: Retrieve conversation and verify user isolation
- Test 1.2.3: Verify conversation timestamps updated

#### Task 1.3: Implement Message Database Operations

**Location**: `backend/db/messages.py`

**Operations**:
- `create_message(conversation_id: UUID, role: str, content: str) -> Message`
- `get_conversation_history(conversation_id: UUID) -> list[Message]`
- `get_message(id: UUID) -> Message | None`

**Tests**:
- Test 1.3.1: Create message and verify in database
- Test 1.3.2: Fetch conversation history in order
- Test 1.3.3: Verify message role stored correctly

---

### User Story 2: Continue Conversation (P1)

#### Task 2.1: Implement History Reconstruction

**Location**: `backend/services/history_service.py`

**Implementation**:
```python
async def reconstruct_conversation_history(conversation_id: UUID) -> list[dict]:
    """
    Reconstruct full conversation history for agent context.
    Returns list of messages in chronological order.
    """
    messages = await db.get_conversation_history(conversation_id)

    # Format for agent consumption
    history = []
    for msg in messages:
        history.append({
            "role": msg.role,
            "content": msg.content
        })

    return history
```

**Tests**:
- Test 2.1.1: Reconstruct history with 1 message
- Test 2.1.2: Reconstruct history with 10+ messages
- Test 2.1.3: Verify chronological order
- Test 2.1.4: Verify roles are correct

#### Task 2.2: Test Conversation Continuity

**Tests**:
- Test 2.2.1: Send first message, get response
- Test 2.2.2: Send follow-up message with conversation_id
- Test 2.2.3: Verify agent response shows context awareness
- Test 2.2.4: Verify full history persisted correctly

---

### User Story 3: Display Chat UI (P1)

#### Task 3.1: Implement ChatKit Frontend Component

**Location**: `frontend/components/ChatInterface.tsx`

**Implementation**:
```typescript
export function ChatInterface({ conversationId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async () => {
    // Send message to /api/{user_id}/chat
    const response = await fetch(`/api/${userId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        message: input,
        conversation_id: conversationId
      })
    })

    const data = await response.json()
    if (data.status === "success") {
      setMessages(data.messages)
      setInput("")
    }
  }

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="timestamp">{formatTime(msg.created_at)}</div>
            <div className="content">{msg.content}</div>
            {msg.tool_calls?.map(tc => (
              <div key={tc.id} className="tool-call">
                📌 Called {tc.tool_name}: {JSON.stringify(tc.parameters)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your task..."
          disabled={loading}
        />
        <button onClick={handleSendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  )
}
```

**Tests**:
- Test 3.1.1: Display user message in UI
- Test 3.1.2: Display agent response in UI
- Test 3.1.3: Display tool calls in UI
- Test 3.1.4: Verify chronological ordering
- Test 3.1.5: Verify timestamps displayed correctly

---

### User Story 4: Error Handling (P2)

#### Task 4.1: Implement Error Handling in Endpoint

**Tests**:
- Test 4.1.1: Handle non-existent conversation_id gracefully
- Test 4.1.2: Handle database connection error
- Test 4.1.3: Handle agent timeout
- Test 4.1.4: Verify conversation state preserved after error
- Test 4.1.5: Verify meaningful error message returned

---

### User Story 5: Multi-Conversation Management (P2)

#### Task 5.1: Test Conversation Isolation

**Tests**:
- Test 5.1.1: Create conversation A and B
- Test 5.1.2: Send message to A, verify history doesn't include B's messages
- Test 5.1.3: Switch to B, verify correct history
- Test 5.1.4: Verify other user cannot access conversations
- Test 5.1.5: Load test with 100 concurrent conversations

---

### User Story 6: Tool Call Traceability (P3)

#### Task 6.1: Implement Tool Call Persistence

**Tests**:
- Test 6.1.1: Agent calls tool, verify tool_call record created
- Test 6.1.2: Verify tool_call includes parameters and result
- Test 6.1.3: Verify tool_call timestamp recorded
- Test 6.1.4: Query tool_calls for conversation history

---

## Phase 3: Integration & Validation

### Integration Points

| Component | Integration | Testing Strategy |
|-----------|-------------|------------------|
| Auth Layer | JWT verification in endpoint | Unit test with mock JWT |
| Agent (Spec 007) | `agent.process_message(message, history)` | Integration test with real agent |
| Database | SQLAlchemy ORM operations | Integration test with test database |
| MCP Tools | Tool calls embedded in agent response | Inherited from Spec 007 tests |

### Statelessness Verification

- **Test**: Restart backend server mid-conversation
- **Expected**: Client can fetch conversation_id and retrieve full history
- **Verification**: No in-memory conversation storage, all data from database

### Concurrency Testing

- **Test**: Send 100+ concurrent requests to same conversation_id
- **Expected**: No race conditions, all messages persisted correctly
- **Verification**: Database transaction isolation level (SERIALIZABLE or READ_COMMITTED with locks)

### Performance Validation

- **Response time < 5 seconds**: Measure for typical 10-message conversation
- **100+ message handling**: Test with large conversation history
- **10,000 concurrent conversations**: Load test with multiple users

---

## Implementation Timeline

### Phase 1: Core Infrastructure (Days 1-2)
- Database schema and models
- Message and conversation CRUD operations
- POST /api/{user_id}/chat endpoint skeleton

### Phase 2: Agent Integration (Days 2-3)
- History reconstruction
- Agent invocation with context
- Message persistence (before/after)
- Tool call logging

### Phase 3: Frontend & UI (Days 3-4)
- ChatKit component implementation
- Message display and rendering
- Real-time updates

### Phase 4: Testing & Validation (Days 4-5)
- Unit tests for all components
- Integration tests with real database
- Statelessness verification
- Performance and load testing
- Error scenario testing

### Phase 5: Documentation (Day 5)
- API documentation
- Database schema documentation
- Deployment guide for stateless architecture

---

## Success Criteria Mapping

| Success Criterion | Implementation Component | Test Strategy |
|------------------|------------------------|-----------------|
| SC-001: < 5 sec response | Endpoint performance | Measure real request time |
| SC-002: Persistence across restarts | Database layer | Server restart test |
| SC-003: Zero in-memory state | Code review + verification | Inspect codebase for static state |
| SC-004: Cross-user isolation | Authentication validation | Access control test |
| SC-005: Concurrent request handling | Database transactions | Concurrency test (100+ requests) |
| SC-006: UI display accuracy | ChatKit component | Visual regression test |
| SC-007: Tool call traceability | tool_calls table | Query tool_calls and verify |
| SC-008: Meaningful error messages | Error handling layer | Test all error paths |
| SC-009: 10,000 concurrent conversations | Infrastructure scale test | Load test |
| SC-010: 100+ message handling | History retrieval | Fetch and display large history |

---

## Assumptions & Constraints

### Assumptions
- ✅ User authentication already implemented (Phase II)
- ✅ AI Agent available and working (Spec 007)
- ✅ MCP tools available (Spec 007)
- ✅ Database connected and migrated (Phase II)

### Constraints
- ❌ NO in-memory conversation state allowed (FR-011)
- ❌ Messages must persist before agent execution (FR-007)
- ❌ History reconstructed per request (FR-012)
- ❌ Cross-user access must be prevented (FR-013)

---

## Architecture Diagram

```
┌─────────────────────┐
│   ChatKit UI        │  (Frontend)
│ (React Component)   │
└──────────┬──────────┘
           │
           │ POST /api/{user_id}/chat
           ▼
┌─────────────────────────────────────────────┐
│   FastAPI Endpoint: POST /chat               │
│  - Validate JWT                              │
│  - Fetch/Create Conversation                 │
│  - Persist User Message (BEFORE AGENT)       │
└──────────┬──────────────────────────────────┘
           │
           ├──────────────────────┬──────────────────┐
           │                      │                  │
           ▼                      ▼                  ▼
    ┌────────────────┐    ┌──────────────────┐   ┌──────────────┐
    │  Reconstruct   │    │   Invoke Agent   │   │ Persist Tool │
    │  History from  │───▶│   with Context   │──▶│   Calls      │
    │  Database      │    │                  │   │              │
    └────────────────┘    └──────────────────┘   └──────────────┘
           │                                           │
           │                                           │
           └─────────────────────┬─────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────────┐
                    │   PostgreSQL Database        │
                    │  - conversations             │
                    │  - messages                  │
                    │  - tool_calls                │
                    └──────────────────────────────┘
```

---

## Deliverables

### Code Files
- ✅ `backend/routes/chat.py` - Chat endpoint
- ✅ `backend/db/conversations.py` - Conversation CRUD
- ✅ `backend/db/messages.py` - Message CRUD
- ✅ `backend/db/tool_calls.py` - Tool call CRUD
- ✅ `backend/services/history_service.py` - History reconstruction
- ✅ `frontend/components/ChatInterface.tsx` - ChatKit component
- ✅ `models/conversation.py` - SQLModel definitions

### Test Files
- ✅ `tests/test_chat_endpoint.py` - Endpoint tests (30+ tests)
- ✅ `tests/test_conversation_crud.py` - CRUD tests (15+ tests)
- ✅ `tests/test_history_reconstruction.py` - History tests (10+ tests)
- ✅ `tests/test_chat_ui.py` - UI tests (15+ tests)
- ✅ `tests/test_statelessness.py` - Statelessness verification (5+ tests)
- ✅ `tests/test_concurrency.py` - Concurrency tests (10+ tests)
- ✅ `tests/test_performance.py` - Performance tests (5+ tests)

### Documentation
- ✅ API documentation (OpenAPI)
- ✅ Database schema documentation
- ✅ Stateless architecture explanation
- ✅ Deployment guide

---

**Plan Status**: ✅ READY FOR IMPLEMENTATION
**Phase**: Planning Complete
**Next Step**: Generate tasks.md with detailed breakdown and test cases

