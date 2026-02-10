---
id: phr-009-001
title: Create Task Due Dates & Deadlines specification
stage: spec
date: 2026-02-10
surface: claude-code
model: claude-haiku-4-5-20251001
feature: task-due-dates
branch: 009-task-due-dates
user: claude-code
command: /sp.specify
labels: [specification, feature-definition, requirements]
links:
  spec: /specs/009-task-due-dates/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/009-task-due-dates/spec.md
  - specs/009-task-due-dates/checklists/requirements.md
tests: []
---

## Prompt

User invoked `/sp.specify` with the following feature description:

```
SPEC - 09

Spec: Task Due Dates & Deadlines

Objective:
Add due date and deadline awareness to tasks, including overdue detection
and time-based visual indicators.

Scope:
- Allow setting due date/time per task
- Identify and flag overdue tasks
- Support "Due Today" and optional countdown labels
- Enable sorting and filtering by due date

Success Criteria:
- Tasks store due_date reliably
- Overdue tasks are correctly detected
- UI clearly highlights overdue and due-today tasks
- API responses include due date metadata

Constraints:
- Use existing task ownership rules
- Timezone-safe date handling
- No background jobs required
- Database-driven logic only

Not In Scope:
- Notifications or reminders
- Recurring tasks
```

## Response snapshot

Generated a comprehensive feature specification with:
- 3 prioritized user stories (P1: Set/update due dates, P2: Display & sort by due date, P3: Filter by status)
- 13 functional requirements covering core and UI functionality
- Measurable success criteria (8 outcomes)
- Clear edge cases for timezone handling, date validation, and data persistence
- Assumptions documenting timezone-aware date handling and no-time-component approach
- Quality checklist validating all specification requirements

## Outcome

- ✅ Impact: Foundation specification created; ready for planning phase
- 🧪 Tests: No automated tests at spec stage; all acceptance scenarios are testable
- 📁 Files: 2 files created (spec.md, requirements.md checklist)
- 🔁 Next prompts: /sp.clarify (if needed), /sp.plan (implementation planning)
- 🧠 Reflection: Specification is complete with no clarifications needed; user stories are properly prioritized and independently testable

## Evaluation notes (flywheel)

- Failure modes observed: None; specification is comprehensive
- Graders run and results (PASS/FAIL): All quality checklist items PASS
- Prompt variant (if applicable): N/A
- Next experiment: Proceed to /sp.plan for implementation planning
