# Taskie - AI-Powered Task Management App

A modern web application for managing tasks with an AI chat assistant, built with Next.js, FastAPI, and PostgreSQL.

## Features

- **AI Chat Agent** - Natural language task management ("Add a task to buy groceries", "Show my tasks")
- **User Authentication** - Secure signup/signin with JWT tokens
- **Task Management** - Create, read, update, delete tasks
- **Task Priorities** - Organize tasks by low, medium, high priority
- **Task Status** - Mark tasks as complete or incomplete
- **Responsive UI** - Modern design that works on desktop and mobile
- **Real-time Updates** - Optimistic UI updates with server sync

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Python FastAPI, SQLModel ORM |
| Database | PostgreSQL (Neon Serverless) |
| Authentication | Better Auth with JWT |
| AI Agent | Custom NLP agent with intent classification |
| Icons | Lucide React |

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database (Neon recommended)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and BETTER_AUTH_SECRET

# Run backend
python main.py
```

Backend runs on **http://localhost:8000**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with API URL and auth secret

# Run frontend
npm run dev
```

Frontend runs on **http://localhost:3001**

## Project Structure

```
taskie/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # Pages and layouts
│   │   │   ├── (auth)/      # Auth pages (signin, signup)
│   │   │   └── (dashboard)/ # Dashboard pages (tasks, chat)
│   │   ├── components/      # React components
│   │   │   ├── common/      # Shared UI components
│   │   │   ├── tasks/       # Task-related components
│   │   │   └── landing/     # Landing page components
│   │   └── lib/             # Utilities, hooks, API client
│   └── package.json
│
├── backend/                  # FastAPI application
│   ├── src/
│   │   ├── api/             # API endpoints (tasks, auth, chat, tools)
│   │   ├── auth/            # JWT authentication
│   │   ├── services/        # Business logic
│   │   ├── models.py        # Database models
│   │   └── schemas.py       # Request/response schemas
│   ├── main.py
│   └── requirements.txt
│
├── agent-service/            # AI Chat Agent
│   └── agent_service_impl/
│       ├── agent.py         # Main agent logic
│       ├── handlers/        # Intent & parameter handlers
│       └── tools/           # Tool definitions & invoker
│
├── alembic/                  # Database migrations
├── docs/                     # Documentation
│   ├── guides/              # Setup guides
│   └── progress/            # Development progress docs
├── specs/                    # Feature specifications
├── tests/                    # Test files
└── scripts/                  # Utility scripts
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/signin` | Login user |
| POST | `/auth/signout` | Logout user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{userId}/tasks` | List all tasks |
| POST | `/api/{userId}/tasks` | Create task |
| GET | `/api/{userId}/tasks/{id}` | Get single task |
| PUT | `/api/{userId}/tasks/{id}` | Update task |
| PATCH | `/api/{userId}/tasks/{id}/status` | Update status |
| DELETE | `/api/{userId}/tasks/{id}` | Delete task |

### Chat Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/{userId}/chat` | Send message to AI agent |

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters
```

> **Important:** `BETTER_AUTH_SECRET` must be the same in both frontend and backend.

## AI Chat Agent

The chat agent understands natural language commands:

| Intent | Example Commands |
|--------|-----------------|
| Add Task | "Add a task to buy groceries", "Create task: call mom" |
| List Tasks | "Show my tasks", "What do I have to do?" |
| Complete Task | "Complete task 1", "Mark 2 as done" |
| Update Task | "Update task 1 to buy milk" |
| Delete Task | "Delete task 3", "Remove task 1" |
| Greeting | "Hi", "Hello", "Hey" |
| Help | "Help", "What can you do?" |

## Development

```bash
# Run backend
cd backend && python main.py

# Run frontend (separate terminal)
cd frontend && npm run dev

# Run tests
cd tests && pytest
```

## License

MIT
