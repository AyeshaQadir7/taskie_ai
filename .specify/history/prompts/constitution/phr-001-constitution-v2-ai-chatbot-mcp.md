---
id: PHR-001
title: Constitution v2 AI Chatbot MCP
stage: constitution
date: 2026-02-01
surface: agent
model: claude-haiku-4-5-20251001
feature: none
branch: main
user: ayeshaqadir
command: /sp.constitution
labels: ["constitution", "architecture", "MCP", "agents", "stateless", "chatbot"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

The user executed the `/sp.constitution` skill with the following arguments:

```
--title "Constitution v2 AI Chatbot MCP"
--stage constitution
```

And provided user input to update the constitution with new principles for Phase 3 (AI-powered Todo Chatbot):

```
You are an autonomous, senior-level AI engineering team operating under
Spec-Driven Development and the Agentic Dev Stack workflow.

This phase focuses on building an AI-powered Todo Chatbot using MCP
(Model Context Protocol), OpenAI Agents SDK, and a stateless FastAPI backend.
No manual coding is allowed. All implementation must strictly follow written specs.

CORE PRINCIPLES

1. Spec First, Always
   - Never write plans, tasks, or code without an approved specification.
   - Every feature must map directly to a written spec section.
   - If a requirement is ambiguous, resolve it explicitly in the spec.

2. Strict Separation of Concerns
   - Frontend: ChatKit UI only (no AI logic).
   - Backend: FastAPI orchestration, persistence, authentication.
   - AI Logic: OpenAI Agents SDK only.
   - Task Operations: MCP Server tools only.
   - No layer may bypass another layer's responsibility.

3. Stateless Architecture Enforcement
   - API servers, agents, and MCP tools must be stateless.
   - All state (tasks, conversations, messages) must persist in PostgreSQL.
   - Each request must reconstruct context from the database.

4. MCP-First Tooling
   - All task mutations and reads must occur via MCP tools.
   - AI agents may NEVER access the database directly.
   - MCP tools must be atomic, deterministic, and side-effect safe.

5. Agent Autonomy with Guardrails
   - Agents must decide *when* and *which* MCP tool to call.
   - Agents must confirm user intent before destructive actions.
   - All agent responses must be user-friendly and explicit about actions taken.

AGENT BEHAVIOR RULES

6. Natural Language → Tool Mapping
   - Interpret user intent from natural language.
   - Choose exactly the correct MCP tool(s).
   - Never hallucinate task IDs or user data.
   - Fetch before mutate when task identity is unclear.

7. Tool Invocation Discipline
   - Do not chain tools unless required.
   - Always return tool call metadata in the response.
   - Gracefully handle tool errors and missing data.

8. Conversation Integrity
   - Persist every user and assistant message.
   - Ensure conversation continuity via database history.
   - Support resuming conversations after server restarts.

IMPLEMENTATION CONSTRAINTS

9. No Manual Coding
   - All code must be generated via Claude Code from approved plans.
   - Humans may only review, not modify, generated code.

10. Technology Lock-In
    - Frontend: OpenAI ChatKit
    - Backend: FastAPI (Python)
    - AI Framework: OpenAI Agents SDK
    - MCP Server: Official MCP SDK
    - ORM: SQLModel
    - Database: Neon Serverless PostgreSQL
    - Auth: Better Auth

11. Explicit Deliverables
    - /frontend: Chat UI
    - /backend: API, Agents, MCP integration
    - /specs: Agent specs + MCP tool specs
    - Database migrations
    - README with setup instructions
```

## Response snapshot

Updated the project constitution from v1.1.0 to v2.0.0, marking a fundamental architectural shift from a basic CRUD web application to an AI-powered chatbot with MCP-first tooling, stateless architecture, and agent autonomy. Replaced outdated principles with 11 core principles and agent behavior rules specifically designed for multi-agent systems, MCP integration, and conversational AI.

## Outcome

- ✅ Impact: Constitution v2.0.0 successfully ratified with MAJOR version bump. Shifted project governance from code-generation-centric (Agentic Dev Stack v1) to agent-autonomous-reasoning (Agentic Dev Stack v2 for chatbots). Established clear separation of concerns (Frontend/Backend/Agents/MCP Tools), stateless architecture mandate, and MCP-first tooling as non-negotiable constraints.
- 🧪 Tests: Manual validation of constitution structure, placeholder replacement, and consistency with user input requirements. No automated tests (constitution is a governance document).
- 📁 Files: 1 file modified (.specify/memory/constitution.md); updated with new frontmatter comment block documenting all changes, version history, and template update status.
- 🔁 Next prompts: `/sp.specify` for feature specifications incorporating MCP tool specs and agent behavior specs; `/sp.plan` for architecture planning with agent orchestration and MCP tool design sections; verification that all downstream templates (spec, plan, tasks) align with new constitution principles.
- 🧠 Reflection: Moving from deterministic (phase 1) to autonomous-agent-based (phase 2) governance requires a fundamental inversion of control: instead of "implement according to spec," now it's "agents decide how to achieve spec intent within tool and architectural constraints." The constitution explicitly bans direct DB access by agents, manual coding, and off-stack technologies to enforce this inversion discipline.

## Evaluation notes (flywheel)

- Failure modes observed: None. User provided clear, detailed input; template placeholders all resolved; version bump rationale documented in Sync Impact Report; all 11 principles are declarative and testable.
- Graders run and results (PASS/FAIL): PASS – Constitution Check Gate: ✅ Spec-first enforcement (now includes MCP specs and agent behavior specs); ✅ Stack lock-in (MCP + Agents SDK + ChatKit explicitly mandated); ✅ Stateless architecture (all state in PostgreSQL, no in-process memory); ✅ Security by design (user ownership, JWT auth, agent authorization rules explicitly defined); ✅ Auditability (all tool invocations and conversations persist in DB).
- Prompt variant (if applicable): None (user input was comprehensive and unambiguous).
- Next experiment (smallest change to try): Test constitution compliance by drafting a feature spec that includes MCP tool specs and agent behavior specs (using new spec-template.md that incorporates these sections). This validates that downstream templates properly reflect the constitutional principles.
