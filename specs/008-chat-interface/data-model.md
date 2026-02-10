# Data Model: Chat Interface & Conversation Persistence

**Feature**: Spec 008 - Chat Interface & Stateless Conversation Orchestration
**Created**: 2026-02-02
**Purpose**: Define database schema and data structures for conversation management

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User                                  │
│  (From Phase II - Auth Layer)                               │
│  ├─ id: UUID (PK)                                          │
│  ├─ email: String                                          │
│  └─ authenticated_at: DateTime                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ 1:N (owns)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Conversation                              │
│  Represents a single chat thread                            │
│  ├─ id: UUID (PK)                                          │
│  ├─ user_id: UUID (FK → User)                              │
│  ├─ created_at: DateTime                                   │
│  ├─ updated_at: DateTime                                   │
│  ├─ title: String | NULL                                   │
│  └─ INDEX(user_id, created_at DESC)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ 1:N (contains)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Message                                 │
│  Individual messages in conversation                        │
│  ├─ id: UUID (PK)                                          │
│  ├─ conversation_id: UUID (FK → Conversation)              │
│  ├─ role: Enum('user' | 'assistant')                       │
│  ├─ content: Text (≤ 5000 chars)                           │
│  ├─ created_at: DateTime                                   │
│  └─ INDEX(conversation_id, created_at ASC)                │
└──────────────────────┬──────────────────────────────────────┘
                       │ 1:N (documents)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     ToolCall                                 │
│  Record of MCP tool invocation                              │
│  ├─ id: UUID (PK)                                          │
│  ├─ message_id: UUID (FK → Message)                        │
│  ├─ tool_name: String (e.g., 'add_task')                  │
│  ├─ parameters: JSON (tool input)                          │
│  ├─ result: JSON (tool output)                             │
│  ├─ executed_at: DateTime                                  │
│  └─ INDEX(message_id, executed_at DESC)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Entity Definitions

### Conversation

**Purpose**: Represents a single chat thread or conversation session between user and agent.

**Attributes**:

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, NOT NULL | Unique identifier for conversation |
| user_id | UUID | FK(users.id), NOT NULL, INDEX | Owner of conversation |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Conversation creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Last activity timestamp |
| title | TEXT | NULL | Optional conversation title/topic |

**Indexes**:
- PRIMARY KEY: `(id)`
- COMPOSITE: `(user_id, created_at DESC)` - for efficient user's conversation list retrieval
- FOREIGN KEY: `(user_id)` - referential integrity

**Validation Rules**:
- `user_id` must be valid UUID from users table
- `created_at` ≤ `updated_at`
- `title` if present: max 200 characters

**Relationships**:
- 1:N with Message (one conversation has many messages)
- N:1 with User (many conversations per user)

**Query Patterns**:
```sql
-- List user's conversations (ordered by recency)
SELECT * FROM conversations
WHERE user_id = $1
ORDER BY updated_at DESC
LIMIT 20;

-- Get specific conversation with validation
SELECT * FROM conversations
WHERE id = $1 AND user_id = $2;

-- Create new conversation
INSERT INTO conversations (id, user_id, created_at, updated_at)
VALUES (gen_random_uuid(), $1, now(), now())
RETURNING id;

-- Update timestamp on new message
UPDATE conversations
SET updated_at = now()
WHERE id = $1;
```

---

### Message

**Purpose**: Individual message in conversation. Stores user queries and agent responses with timestamp.

**Attributes**:

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, NOT NULL | Unique message identifier |
| conversation_id | UUID | FK(conversations.id), NOT NULL, INDEX | Parent conversation |
| role | ENUM | NOT NULL, CHECK IN ('user', 'assistant') | Message sender type |
| content | TEXT | NOT NULL | Message text (≤ 5000 chars) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Message creation time |

**Indexes**:
- PRIMARY KEY: `(id)`
- COMPOSITE: `(conversation_id, created_at ASC)` - for efficient history retrieval in order
- FOREIGN KEY: `(conversation_id)` - referential integrity

**Validation Rules**:
- `role` must be 'user' or 'assistant'
- `content` must be non-empty and ≤ 5000 characters
- `conversation_id` must exist in conversations table and belong to authenticated user
- Messages in conversation must maintain temporal ordering

**Relationships**:
- N:1 with Conversation (many messages per conversation)
- 1:N with ToolCall (one message may trigger multiple tool calls)

**Query Patterns**:
```sql
-- Get full conversation history (chronologically ordered)
SELECT * FROM messages
WHERE conversation_id = $1
ORDER BY created_at ASC;

-- Get last N messages (for context window)
SELECT * FROM messages
WHERE conversation_id = $1
ORDER BY created_at DESC
LIMIT 20;

-- Create user message (before agent execution)
INSERT INTO messages (id, conversation_id, role, content, created_at)
VALUES (gen_random_uuid(), $1, 'user', $2, now())
RETURNING id;

-- Create assistant message (after agent execution)
INSERT INTO messages (id, conversation_id, role, content, created_at)
VALUES (gen_random_uuid(), $1, 'assistant', $2, now())
RETURNING id;

-- Count messages in conversation
SELECT COUNT(*) FROM messages
WHERE conversation_id = $1;
```

---

### ToolCall

**Purpose**: Records MCP tool invocations triggered by agent. Provides full audit trail of tool executions.

**Attributes**:

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, NOT NULL | Unique tool call identifier |
| message_id | UUID | FK(messages.id), NOT NULL, INDEX | Associated message |
| tool_name | STRING | NOT NULL | Name of MCP tool called (e.g., 'add_task', 'complete_task') |
| parameters | JSONB | NOT NULL | Tool input parameters as JSON |
| result | JSONB | NOT NULL | Tool execution result as JSON |
| executed_at | TIMESTAMP | NOT NULL, DEFAULT now() | Execution timestamp |

**Indexes**:
- PRIMARY KEY: `(id)`
- COMPOSITE: `(message_id, executed_at DESC)` - for efficient tool call retrieval
- FOREIGN KEY: `(message_id)` - referential integrity

**Validation Rules**:
- `tool_name` must be valid MCP tool name (from Spec 007)
- `parameters` must be valid JSON object
- `result` must be valid JSON object (success or error)
- `message_id` must exist in messages table
- `executed_at` must be ≥ message.created_at

**Relationships**:
- N:1 with Message (multiple tool calls per assistant message)

**Query Patterns**:
```sql
-- Get all tool calls for a message
SELECT * FROM tool_calls
WHERE message_id = $1
ORDER BY executed_at ASC;

-- Get all tool calls in conversation (join through messages)
SELECT tc.* FROM tool_calls tc
JOIN messages m ON tc.message_id = m.id
WHERE m.conversation_id = $1
ORDER BY tc.executed_at ASC;

-- Get specific tool call
SELECT * FROM tool_calls WHERE id = $1;

-- Create tool call record
INSERT INTO tool_calls (id, message_id, tool_name, parameters, result, executed_at)
VALUES (gen_random_uuid(), $1, $2, $3::jsonb, $4::jsonb, now())
RETURNING id;

-- Audit: find all tool_call failures
SELECT tc.* FROM tool_calls tc
WHERE tc.result->>'status' = 'error'
ORDER BY tc.executed_at DESC
LIMIT 100;
```

---

## Data Flow & State Transitions

### Message Lifecycle

```
1. User sends message
   └─ Create Message(role='user', content=...)
      └─ Persist to database (BEFORE agent execution)

2. Agent processes message
   └─ Reconstruct conversation history
      └─ Call agent.process_message(message, history)

3. Agent returns response
   └─ Create Message(role='assistant', content=...)
      └─ Create ToolCall records for each tool invoked
         └─ Persist to database (AFTER agent execution)

4. Response displayed in UI
   └─ Client fetches conversation history
      └─ Display messages with tool call info
```

### Database Persistence Guarantees

| Phase | Operation | Persistence | Recovery |
|-------|-----------|-------------|----------|
| **Before Agent** | Create user message | ✅ Persisted | Message not lost if agent fails |
| **During Agent** | Agent processing | ⚠️ In-memory | If agent crashes, message still saved |
| **After Agent** | Create assistant message + tool calls | ✅ Persisted | Full response recorded for audit |
| **Error Case** | Rollback tool calls | ✅ Atomic | Transaction ensures consistency |

---

## Concurrency & Consistency Model

### Transaction Isolation

**Selected**: READ_COMMITTED (PostgreSQL default)

**Rationale**:
- Prevents dirty reads (agent won't see uncommitted messages)
- Allows concurrent message creation (multiple users, multiple conversations)
- Performance acceptable for typical conversation volumes

**Race Condition Handling**:
- Message creation: Each message gets unique timestamp, no conflicts
- Tool call creation: Foreign key ensures message exists
- Conversation update: Timestamp updates are idempotent

### Optimistic Locking Strategy

Not required because:
- No concurrent updates to same message (messages are immutable after creation)
- No concurrent updates to same conversation (only timestamp updated, idempotent)
- Tool calls are write-once (no updates)

### Example: Safe Concurrent Inserts

```python
async def handle_concurrent_requests():
    # Multiple clients send messages to same conversation simultaneously

    # Client A: Create message (committed)
    msg_a = await db.create_message(conv_id, "Add task A")

    # Client B: Create message (committed)
    msg_b = await db.create_message(conv_id, "Add task B")

    # Reconstruction: Both messages visible in correct order
    history = await db.get_conversation_history(conv_id)
    # Returns: [msg_a, msg_b] in chronological order
    # No race condition because timestamps and IDs are unique
```

---

## Schema Migration

### DDL Statements

```sql
-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title TEXT,
  CONSTRAINT title_length CHECK (char_length(title) <= 200)
);

CREATE INDEX idx_conversations_user_id_created_at
  ON conversations(user_id, created_at DESC);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT content_length CHECK (char_length(content) > 0 AND char_length(content) <= 5000)
);

CREATE INDEX idx_messages_conversation_id_created_at
  ON messages(conversation_id, created_at ASC);

-- Create tool_calls table
CREATE TABLE tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  parameters JSONB NOT NULL,
  result JSONB NOT NULL,
  executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tool_calls_message_id_executed_at
  ON tool_calls(message_id, executed_at DESC);
```

---

## Data Volume & Scaling Considerations

### Typical Data Sizes

| Entity | Typical Size | Constraints |
|--------|--------------|-------------|
| Conversation | ~1 KB | Small metadata |
| Message | 0.5-2 KB | Text max 5000 chars |
| ToolCall | 1-5 KB | JSON parameters + result |

### Conversation Size Examples

| Messages | Size | Est. Index Size |
|----------|------|-----------------|
| 10 messages | ~10 KB | ~50 KB |
| 100 messages | ~100 KB | ~500 KB |
| 1,000 messages | ~1 MB | ~5 MB |

### Growth Model

- **Users**: 1,000,000
- **Avg conversations/user**: 10
- **Avg messages/conversation**: 50
- **Total messages**: 500 billion

**Storage**:
- Messages table: ~500 GB
- Tool calls table: ~200 GB
- Indexes: ~100 GB
- **Total: ~800 GB** (manageable on Neon with pruning strategy)

### Archival Strategy (Future)

- Archive conversations > 1 year old to cold storage
- Implement message pagination (load last 50, then paginate)
- Clean up tool_calls after 6 months for privacy

---

## Validation Rules

### Message Validation

```python
def validate_message(message: str) -> tuple[bool, str]:
    """Validate user message for chat endpoint."""
    if not message:
        return False, "Message cannot be empty"
    if len(message) > 5000:
        return False, "Message exceeds 5000 character limit"
    if message.isspace():
        return False, "Message cannot be only whitespace"
    return True, "Valid"
```

### Conversation Validation

```python
def validate_conversation_id(conv_id: str, user_id: UUID) -> tuple[bool, str]:
    """Validate conversation_id and ownership."""
    try:
        conv_uuid = UUID(conv_id)
    except ValueError:
        return False, "Invalid UUID format"

    conversation = db.get_conversation(conv_uuid, user_id)
    if not conversation:
        return False, "Conversation not found or not owned by user"

    return True, "Valid"
```

---

## SQLModel Implementation

### Models File: models/conversation.py

```python
from sqlmodel import SQLModel, Field, Relationship, Column, JSONB, DateTime
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

class ConversationBase(SQLModel):
    title: Optional[str] = Field(None, max_length=200)

class Conversation(ConversationBase, table=True):
    __tablename__ = "conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    messages: list["Message"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class MessageBase(SQLModel):
    role: str = Field(index=True)  # "user" or "assistant"
    content: str = Field(max_length=5000)

class Message(MessageBase, table=True):
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversations.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    conversation: Conversation = Relationship(back_populates="messages")
    tool_calls: list["ToolCall"] = Relationship(
        back_populates="message",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class ToolCallBase(SQLModel):
    tool_name: str
    parameters: dict = Field(sa_column=Column(JSONB))
    result: dict = Field(sa_column=Column(JSONB))

class ToolCall(ToolCallBase, table=True):
    __tablename__ = "tool_calls"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    message_id: UUID = Field(foreign_key="messages.id")
    executed_at: datetime = Field(default_factory=datetime.utcnow)

    message: Message = Relationship(back_populates="tool_calls")
```

---

## Consistency Verification

### Post-Implementation Checks

- [ ] All foreign keys properly defined
- [ ] Cascade delete configured for orphaned messages/tool_calls
- [ ] Indexes created for all query patterns
- [ ] Timestamp columns have DEFAULT CURRENT_TIMESTAMP
- [ ] Role column has CHECK constraint
- [ ] Content length validation in CHECK constraint
- [ ] User isolation enforced at query level

---

**Data Model Status**: ✅ READY FOR IMPLEMENTATION
**Schema Complexity**: Low (3 main tables + relationships)
**Scalability**: Horizontal (stateless, shardable by user_id)

