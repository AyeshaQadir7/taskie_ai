# Taskie - Todo App

## Project Objective

Transform a console-based todo application into a modern, multi-user web application with persistent storage. Build a responsive web interface with backend API, database integration, and user authentication using the Agentic Dev Stack workflow.

## Development Approach

Using **Spec-Kit Plus + Claude Code** with the Agentic Dev Stack workflow:
1. Write specification for features
2. Generate implementation plan
3. Break down into actionable tasks
4. Implement via Claude Code agents (no manual coding)
5. Review process, prompts, and iterations at each phase

## Requirements

### Core Features
Implement all 5 Basic Level features as a web application:
- User authentication (signup/signin)
- Create tasks
- View tasks
- Update tasks
- Delete tasks

### Technical Requirements
- Create RESTful API endpoints
- Build responsive frontend interface
- Store data in Neon Serverless PostgreSQL database
- Implement user-based data filtering and isolation

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16+ (App Router), TypeScript, Tailwind CSS |
| Backend | Python FastAPI |
| ORM | SQLModel |
| Database | Neon Serverless PostgreSQL |
| Authentication | Better Auth with JWT |
| Spec-Driven Dev | Claude Code + Spec-Kit Plus |

## Agent Structure

- **Orchestrator Agent** (@agents/orchestrator-agent.md) - Coordinates development workflow
- **Backend Architect** (@agents/backend-architect.md) - Designs and implements FastAPI endpoints
- **Neon Postgres Expert** (@agents/neon-postgres-expert.md) - Manages database schema and migrations
- **Auth Security Reviewer** (@agents/auth-security-reviewer.md) - Implements and reviews authentication security
- **Next.js UI Optimizer** (@agents/nextjs-ui-optimizer.md) - Builds responsive frontend interface

## Development Workflow

1. Read spec: @specs/features/[feature].md
2. Orchestrator Agent creates implementation plan
3. Neon Postgres Expert implements database models and schema
4. Backend Architect implements REST API endpoints
5. Next.js UI Optimizer implements frontend components and pages
6. Auth Security Reviewer verifies authentication integration and security

## Authentication Architecture

### Better Auth with JWT

Better Auth can be configured to issue JWT (JSON Web Token) tokens when users log in. These tokens are self-contained credentials that include user information and can be verified by any service that knows the secret key.

### JWT Token Flow

1. **User Login** → Frontend sends credentials to Better Auth
2. **Token Issuance** → Better Auth creates a session and issues JWT token
3. **API Request** → Frontend includes token in `Authorization: Bearer <token>` header
4. **Token Verification** → Backend extracts token from header, verifies signature using shared secret
5. **User Identification** → Backend decodes token to get user ID, email, etc.
6. **Data Filtering** → Backend returns only data (tasks) belonging to that user

### Key Principles

- JWT tokens are self-contained and can be verified without external calls
- Shared `BETTER_AUTH_SECRET` enables both frontend and backend to issue/verify tokens
- User ID from token is matched against data ownership for security
- All API endpoints must validate user ownership of requested resources

## Environment Variables

Required in both frontend and backend:

- `BETTER_AUTH_SECRET` - Shared secret for JWT token signing/verification
- `DATABASE_URL` - Neon PostgreSQL connection string

## Frontend Quality Standards

### Accessibility (WCAG 2.1 Level AA)
- **Button Accessible Names**: All buttons must have descriptive accessible names via:
  - Text content (preferred)
  - `aria-label` attribute for icon-only buttons
  - `aria-labelledby` for complex buttons
- **Form Labels**: All form inputs must have associated `<label>` elements
- **Semantic HTML**: Use proper heading hierarchy (h1 > h2 > h3), semantic elements (`<button>`, `<form>`, `<nav>`)
- **Color Contrast**: Ensure minimum 4.5:1 contrast ratio for text
- **Focus Management**: Keyboard navigation must be fully functional
- **Testing**: Run Lighthouse accessibility audit before merging PRs (target score: 90+)

### Performance Standards
- **Render-blocking Resources**: Minimize CSS/JS that blocks initial render
  - Tailwind CSS is configured with PostCSS minification (`cssnano`) for production
  - Cache static assets with long-lived headers (1 year for versioned files)
- **Target Metrics**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FCP (First Contentful Paint): < 1.8s
  - CLS (Cumulative Layout Shift): < 0.1
- **Asset Management**:
  - All referenced assets in `manifest.json` must exist in `/public` directory
  - Use existing logo files instead of creating duplicate icon files

### Configuration
- **PostCSS**: CSS minification via `cssnano` enabled in production builds
- **Next.js**: CSS optimization enabled via `experimental.optimizeCss`
- **Tailwind**: Configured with design system tokens in `tailwind.config.ts`
  - Custom colors: slate, violet, lime (from design-guide.md)
  - Responsive breakpoints: mobile (320px), tablet (768px), desktop (1024px)
