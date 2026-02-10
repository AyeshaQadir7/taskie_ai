<!--
SYNC IMPACT REPORT (v1.1.0 → v2.0.0)
- Version bump: MAJOR (fundamental architectural shift from CRUD web app to AI-powered chatbot; new core principles for MCP-first design, agent autonomy, and stateless architecture)
- Modified principles:
  * "Agentic Workflow Integrity" → "Agent Autonomy with Guardrails" (shift from code generation to runtime agent decision-making)
  * "Deterministic Behavior" → "Natural Language → Tool Mapping" (agents interpret user intent, not deterministic specs)
  * New principle: "Stateless Architecture Enforcement" (agents, API, MCP tools are stateless; all state in PostgreSQL)
  * New principle: "MCP-First Tooling" (all mutations/reads via MCP tools, agents never access DB directly)
  * New principle: "Spec First, Always" (retained but now applies to MCP tool specs and agent behavior specs)
  * New principle: "Tool Invocation Discipline" (agents must invoke tools correctly, no hallucination)
- Added sections:
  * Agent Behavior Rules (6 rules: Natural Language Mapping, Tool Discipline, Conversation Integrity)
  * Implementation Constraints (No Manual Coding, Technology Lock-In, Explicit Deliverables)
- Removed sections:
  * "Reproducibility" principle (replaced by stateless design ensuring determinism via tool contracts)
  * Agent Guidance references (now generic; specific agent specs are in /specs)
- Templates to update:
  ✅ spec-template.md - Now includes MCP tool specs and agent behavior specs (separate from UI spec)
  ✅ plan-template.md - Now includes MCP tool design and agent orchestration sections
  ✅ tasks-template.md - Now organizes by MCP tools, agent handlers, and UI components
  ⚠️ commands/*.md - Verify all commands reference "Agent" generically (not CLAUDE-specific) and include MCP tool specs
- Follow-up TODOs: None
-->

# AI-Powered Todo Chatbot Constitution

## Core Principles

### I. Spec First, Always

All functionality must be explicitly defined in specifications before any implementation begins. This includes:
- **Feature specifications**: User intent, success criteria, test scenarios
- **MCP tool specifications**: Tool name, inputs, outputs, error cases, side effects
- **Agent behavior specifications**: How agents interpret intent, which tools to invoke, confirmation requirements
- **API contracts**: Endpoint signatures, request/response formats, status codes, authentication

No code is written, no MCP tool is built, no agent handler is deployed until the corresponding specification has been approved. Specifications are the source of truth; implementation is merely the physical manifestation of an approved spec.

**Rationale**: Spec-first prevents wasted effort, enables clear handoff between design and agent implementation, and makes multi-agent orchestration auditable.

### II. Strict Separation of Concerns

Each layer has a distinct, non-overlapping responsibility:

- **Frontend (ChatKit UI)**: Display messages, capture user input, render agent responses. No AI logic, no tool invocation, no database access.
- **Backend (FastAPI orchestration)**: Authentication, session management, API routing, delegation to agents and MCP tools. No task mutations, no direct database writes.
- **AI Logic (OpenAI Agents SDK)**: Interpret natural language intent, select and invoke appropriate MCP tools, compose user-friendly responses. No database access, no HTTP calls except to tools.
- **Task Operations (MCP Server tools)**: Mutations and reads on tasks. Atomic, deterministic, side-effect safe. No business logic, no UI concerns.

No layer may bypass another layer's responsibility. For example:
- Agents may never access the database directly; they must use MCP tools.
- The API may never invoke OpenAI directly for task decisions; it must delegate to an agent.
- UI may never call MCP tools; it must route through the API.

**Rationale**: Separation prevents data corruption, enables independent testing, and allows each layer to scale independently.

### III. Stateless Architecture Enforcement

All stateful systems must be stateless at runtime:

- **API servers**: No in-memory state; each request reconstructs context from the database.
- **Agents**: No conversation history in memory; each invocation fetches prior messages from the database.
- **MCP tools**: No transaction state; tools commit immediately or fail atomically.
- **Task persistence**: All task data, conversation history, and agent decisions live in PostgreSQL.

Each request—whether from the UI, an agent, or an MCP tool—must include enough context (user ID, conversation ID, task ID) to operate correctly without relying on prior state.

**Rationale**: Stateless design enables horizontal scaling, fault tolerance, and session resumption. When the server restarts, the same request produces the same result because all state is persistent.

### IV. MCP-First Tooling

All task mutations and reads must occur via MCP tools. Agents may never access the database directly.

- **Tool types**: create_task, update_task, delete_task, list_tasks, get_task (and any domain-specific tools needed)
- **Tool invocation**: Agents decide *which* tool to call and *when*, based on user intent
- **Tool correctness**: Tools are atomic, deterministic, and handle errors gracefully
- **Tool discovery**: Tools are discoverable by agents; the MCP server exposes a catalog of available tools

Agents choose the right tool based on user intent; they do not construct SQL, bypass authorization, or perform business logic. Tools enforce all constraints: user ownership, data validation, authorization.

**Rationale**: MCP tooling ensures a single, auditable interface for data mutation. It prevents agents from accidentally performing privilege escalation or data leaks.

### V. Agent Autonomy with Guardrails

Agents must autonomously decide *when* and *which* MCP tool to call, but within clear guardrails:

- **Intent interpretation**: Agents interpret user natural language without ambiguity. If intent is unclear, agents ask clarifying questions.
- **Tool selection**: Agents select the most appropriate MCP tool based on intent and context.
- **Confirmation**: Agents MUST confirm user intent before destructive actions (delete, bulk update).
- **Error handling**: Agents gracefully handle tool errors, incomplete data, and missing context.
- **Response clarity**: Agent responses MUST be user-friendly and explicit about what action was taken (e.g., "Created task 'Buy milk' with priority High").

Agents are NOT robots that blindly execute; they reason, confirm, and explain.

**Rationale**: Autonomous agents provide a natural, conversational experience while guardrails prevent accidental data loss and ensure security.

## Agent Behavior Rules

### VI. Natural Language → Tool Mapping

Agents must interpret user intent from natural language and map it to exactly the correct MCP tool(s):

- Parse user intent: "Create a task" → invoke `create_task`; "What tasks do I have?" → invoke `list_tasks`; "Delete everything" → ask for confirmation before invoking `delete_task`
- Never hallucinate task IDs, user data, or tool parameters
- If task identity is ambiguous (e.g., "Update it"), fetch available tasks first before invoking update tool
- If required parameters are missing (e.g., task name for create_task), ask the user instead of guessing

**Rationale**: Correct tool mapping ensures user intent is fulfilled accurately. Fetching before mutating prevents data loss from typos or misidentification.

### VII. Tool Invocation Discipline

Agents must invoke MCP tools correctly and communicate the outcome:

- Do not chain tools unless required (e.g., list_tasks then get_task for more detail is acceptable; creating task A then immediately reading it is not)
- Always return tool call metadata in the response: which tool was invoked, with what parameters, and what was returned
- Handle tool errors gracefully: if a tool call fails, explain why to the user and offer alternatives (e.g., "Task not found. Would you like to create a new one?")
- Do not retry failed tools silently; surface errors to the user

**Rationale**: Tool invocation discipline ensures transparency, prevents retry storms, and helps users understand what happened.

### VIII. Conversation Integrity

Every user and assistant message must be persisted; conversations must be resumable:

- Persist every turn: user message, agent intent interpretation, tool invocations, tool results, agent response
- Ensure continuity: when a conversation resumes, reconstruct prior context from the database
- Support resumption: a session interrupted by server restart or network failure can resume without data loss
- Archive conversations: maintain full conversation history for audit and replay

**Rationale**: Conversation integrity enables a seamless user experience and provides an audit trail for debugging and security.

## Technology Stack (Fixed)

The technology stack is non-negotiable and must remain constant throughout the project:

- **Frontend**: OpenAI ChatKit (chat UI component)
- **Backend**: Python FastAPI (HTTP API, agent orchestration)
- **AI Framework**: OpenAI Agents SDK (agent logic and reasoning)
- **Task Operations**: MCP Server (task CRUD tools exposed to agents)
- **ORM**: SQLModel (data models, schema management)
- **Database**: Neon Serverless PostgreSQL (persistent state)
- **Authentication**: Better Auth (JWT tokens for API requests)
- **Development Workflow**: Claude Code + Spec-Kit Plus (Agentic Dev Stack)

No substitutions, experimental technologies, or workarounds are permitted. If a constraint of the chosen stack is discovered to be insufficient, the solution is to enhance the specification and plan, not to bypass the stack.

## Implementation Constraints

### IX. No Manual Coding

All code must be generated via Claude Code and its agent infrastructure. No manual coding is permitted. The Agentic Dev Stack workflow (Spec → Plan → Tasks → Implementation) is the only legitimate path to code generation. Each agent in the system performs its designated function without human code authoring.

**Rationale**: Removing manual coding enforces discipline, captures all decisions in specs and plans, and makes the development process fully reviewable and repeatable.

### X. Technology Lock-In

The specified technologies are mandatory:

- **Frontend**: OpenAI ChatKit (no custom chat implementations; use ChatKit exclusively)
- **Backend**: FastAPI (no Flask, no Django; FastAPI only)
- **AI Framework**: OpenAI Agents SDK (no LangChain, no custom agent loops)
- **MCP Server**: Official MCP SDK (no custom protocol, no workarounds)
- **ORM**: SQLModel (no raw SQL, no other ORMs)
- **Database**: Neon Serverless PostgreSQL (no other databases, no file-based storage)
- **Authentication**: Better Auth with JWT (no session-based auth, no alternative auth frameworks)

If a technology constraint proves insufficient, the amendment process must be followed before deviating.

### XI. Explicit Deliverables

The following artifacts must be produced and maintained:

- **/frontend**: ChatKit-based UI, user message input, agent response rendering
- **/backend**: FastAPI app with:
  - `/api/messages` endpoint (chat message submission and history)
  - `/api/tasks` endpoints (read-only, delegated to agents)
  - Agent handler for interpreting user intent
  - MCP client for tool invocation
- **/mcp-server**: MCP server exposing task tools:
  - `create_task`, `update_task`, `delete_task`, `list_tasks`, `get_task`
  - Full implementation of task CRUD with user ownership enforcement
- **/specs**: Organized by feature:
  - `feature-spec.md` (user intent, test scenarios, success criteria)
  - `mcp-tools-spec.md` (tool definitions, inputs, outputs, error cases)
  - `agent-behavior-spec.md` (agent intent mapping, tool selection logic)
  - `api-contracts.md` (endpoint signatures and response formats)
- **Database migrations**: Schema for conversations, messages, tasks, users
- **README.md**: Setup instructions, architecture overview, deployment guide

## Security & Authentication

### JWT-Based Stateless Authentication

- All API endpoints MUST require a valid JWT token in the `Authorization: Bearer <token>` header
- JWT tokens are issued by Better Auth on successful user signup/signin
- Backend verification uses the shared `BETTER_AUTH_SECRET` environment variable
- User identity is extracted from the JWT token payload (user ID, email)
- No session storage on backend; each request is independently verified
- Invalid or missing tokens return HTTP 401 Unauthorized

### User Ownership Enforcement

- Every API endpoint and MCP tool MUST verify user ownership of resources
- User ID from JWT token is matched against record's user ownership field
- Requests for tasks owned by other users return HTTP 404 (not found) or 403 (forbidden)
- Database queries and MCP tool parameters must include user ID filters
- API contracts must explicitly document ownership verification

### Agent Authorization

- Agents operate under the identity of the authenticated user making the request
- All MCP tool invocations include the user ID from the request context
- Agents may never bypass user ownership checks or invoke tools with escalated privileges
- Tool responses are filtered to include only resources owned by the requesting user

## Development Workflow

1. **Specification Phase** (`/sp.specify`): Write feature specification including MCP tool specs and agent behavior specs
2. **Planning Phase** (`/sp.plan`): Orchestrate backend architecture, MCP tool design, agent orchestration strategy, and UI layout
3. **Task Breakdown** (`/sp.tasks`): Plan is decomposed into ordered, parallel-safe tasks organized by MCP tool, agent handler, and UI component
4. **Implementation Phase** (`/sp.implement`): Designated agents execute tasks: MCP tools first, then backend/agent orchestration, then frontend
5. **Verification Phase**: Integration tests validate end-to-end user flows (natural language intent → agent interpretation → tool invocation → database state change)

## Governance

### Constitution Supremacy

This constitution supersedes all other practices, guidelines, and preferences. In case of conflict between the constitution and any other document (README, agent guidance, developer preference), the constitution prevails.

### Compliance Review & Gate

Before implementation, the Orchestrator Agent MUST perform a **Constitution Check**:
- Does the specification define all MCP tools and agent behavior deterministically?
- Does the plan respect the fixed technology stack (MCP, FastAPI, Agents SDK, ChatKit)?
- Does the implementation strategy enforce spec-first development?
- Are user ownership and security mechanisms explicitly designed in agent behavior specs?
- Are all tool invocations auditable and traceable through the database?

If any check fails, the spec or plan is returned for revision before implementation proceeds.

### Amendment Procedure

Amendments to this constitution require:
1. Clear rationale: what violation or ambiguity triggered the amendment
2. Explicit description of the change (principle added, removed, or redefined; constraint adjusted)
3. Impact analysis: which specs, plans, and implementations are affected
4. Version bump: MAJOR for backward-incompatible changes (principle removals), MINOR for additions or clarifications, PATCH for wording-only fixes
5. Documentation: update all downstream templates and agent guidance

Amendments are recorded in the version line and a Sync Impact Report is prepended as an HTML comment.

### Complexity Justification

If an implementation deviates from the constitution (e.g., using an unapproved technology, bypassing JWT verification, adding manual code), the plan must explicitly document:
- Why the deviation is necessary
- What simpler alternative was considered and rejected
- Explicit approval from the project lead

Such deviations are exceptions, not the norm, and must be recorded in the plan's "Complexity Tracking" section.

### Agent Specifications

Agent behavior is governed by specifications in `/specs`, not by implicit guidance. Each agent has a corresponding behavior spec:
- **Agent Intent Mapper**: Interprets user natural language and maps to MCP tools
- **Agent Orchestrator**: Orchestrates multiple tools, handles conversations, manages state
- **Tool Specifications**: Exact inputs, outputs, error cases for each MCP tool

These specifications are enforceable and must be followed by implementations.

---

**Version**: 2.0.0 | **Ratified**: 2026-02-01 | **Last Amended**: 2026-02-01
