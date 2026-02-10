# Environment Configuration Guide

This guide explains how to configure environment variables for local development and production deployment.

## Critical Variables

### BETTER_AUTH_SECRET
**MUST be identical on frontend and backend** or authentication will fail!

- Minimum 32 characters
- Use secure random generation:
  ```bash
  openssl rand -base64 48
  ```
- Set in both:
  - `frontend/.env.local` → `BETTER_AUTH_SECRET`
  - `backend/.env` → `BETTER_AUTH_SECRET`

### DATABASE_URL
Connection string for PostgreSQL database.

**Format:** `postgresql+psycopg://user:password@host:port/dbname?sslmode=require`

- **Local Development**: Use local PostgreSQL or managed database service
- **Production**: Use Neon or other managed PostgreSQL service - get from https://console.neon.tech

## Local Development Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL database (local or managed service like Neon)

### Backend Configuration

1. Create virtual environment:
   ```bash
   cd backend
   python -m venv venv

   # Activate (Windows)
   venv\Scripts\activate

   # Activate (macOS/Linux)
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Configure `backend/.env`:
   ```env
   DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/taskie?sslmode=disable
   BETTER_AUTH_SECRET=test-secret-key-minimum-32-characters-long
   SQLALCHEMY_ECHO=false
   ```

5. Run backend:
   ```bash
   python main.py
   ```

Backend runs on **http://localhost:8000**

### Frontend Configuration

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

3. Configure `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   BETTER_AUTH_SECRET=test-secret-key-minimum-32-characters-long
   NODE_ENV=development
   ```

4. Run frontend:
   ```bash
   npm run dev
   ```

Frontend runs on **http://localhost:3000** (or next available port)

## Production Deployment

For production deployment, use a managed database service like Neon:

### Generate Secure Secret
```bash
openssl rand -base64 48
```

### Get Neon Database URL
1. Visit https://console.neon.tech
2. Create or select your project
3. Copy the connection string with:
   - Driver: `psycopg`
   - Format: `postgresql+psycopg://...`

### Environment Variables

**Backend Production (.env):**
```env
DATABASE_URL=postgresql+psycopg://user:password@host:port/dbname?sslmode=require
BETTER_AUTH_SECRET=<your-secure-secret>
SQLALCHEMY_ECHO=false
```

**Frontend Production (.env.production or similar):**
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
BETTER_AUTH_SECRET=<same-secret-as-backend>
NODE_ENV=production
```

## Troubleshooting

### Authentication Not Working
- ✓ Check `BETTER_AUTH_SECRET` is identical on frontend and backend
- ✓ Ensure secret is at least 32 characters
- ✓ Regenerate secret: `openssl rand -base64 48`
- ✓ Verify frontend and backend are using the same secret

### API Requests Return 401/403
- ✓ Check `NEXT_PUBLIC_API_BASE_URL` points to correct endpoint
- ✓ Verify JWT token is being sent in `Authorization: Bearer` header
- ✓ Check backend receives the correct secret
- ✓ Verify CORS is properly configured in backend

### Database Connection Fails
- ✓ Verify `DATABASE_URL` format: `postgresql+psycopg://...`
- ✓ Test connection string locally
- ✓ Check database service is running and accessible
- ✓ Verify IP allowlist if using managed database service
- ✓ Ensure credentials are correct

### CORS Errors
- Check FastAPI CORS configuration in `backend/main.py`
- Ensure backend `CORS_ORIGINS` includes your frontend URL
- For development: `CORS_ORIGINS=http://localhost:3000,http://localhost:3001`
- For production: `CORS_ORIGINS=https://your-frontend-domain.com`

## Security Best Practices

1. **Never commit .env files** - Add to `.gitignore`
2. **Keep secrets 32+ characters** minimum
3. **Regenerate BETTER_AUTH_SECRET regularly** in production
4. **Rotate API keys** if exposed
5. **Use HTTPS only** in production
6. **Use different secrets** for development vs production
7. **Store production secrets** in environment or secrets management service
8. **Verify database SSL connections** in production
