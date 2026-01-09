# Quick Start Guide

Get Snippet running in 5 minutes!

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

## Steps

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set Up Database

```bash
# Create PostgreSQL database
createdb snippet_db

# Or using psql:
psql -U postgres
CREATE DATABASE snippet_db;
\q
```

### 3. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and update:
```
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/snippet_db
JWT_SECRET=change-this-to-a-random-string
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
```

The default `VITE_API_URL=http://localhost:5000/api` should work fine.

### 4. Initialize Database

```bash
cd backend
npm run init-db
```

You should see: "✓ Database initialized successfully!"

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Open the App

Navigate to: http://localhost:5173

Create an account and start adding snippets!

## First Steps in the App

1. **Register** - Create your account
2. **Create a snippet** - Try adding your first knowledge card
3. **Add cloze deletion** - Select text and press Ctrl+Shift+C (Cmd+Shift+C on Mac)
4. **Review** - Go back to dashboard and start reviewing

## Troubleshooting

**Database connection error:**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in backend/.env
- Make sure database exists: `psql -l`

**Port already in use:**
- Backend (5000): Change PORT in backend/.env
- Frontend (5173): Vite will auto-increment to 5174

**CORS errors:**
- Make sure backend is running
- Verify VITE_API_URL matches your backend URL

## Next Steps

- Read the full README.md for deployment instructions
- Check out Snippet.md for feature roadmap
- Start building your knowledge base!
