# Snippet - Spaced Repetition App

A minimalist browser app for spaced repetition of text extracts, inspired by incremental reading. Designed primarily for desktop with mobile-friendly rendering.

## Features

### MVP (Current Implementation)

- **User Authentication**: Email/password registration and login with JWT
- **Snippet Management**: Create, edit, delete, and organize text-based knowledge cards
  - Three types: Excerpt (quotes), Revised (paraphrased), Original (your ideas)
  - Topic tagging with autocomplete
  - Source tracking for excerpts and revised content
  - "In Queue" and "Needs Work" flags
- **Cloze Deletions**: Anki-style cloze deletions with keyboard shortcut (Ctrl/Cmd+Shift+C)
- **Spaced Repetition**: SM-2 algorithm with custom quality ratings
  - Unfamiliar: 0 (reset to 1 day)
  - Hard: 2 (1-3 days)
  - Good: 3.5 (3-6 days)
  - Easy: 5 (6+ days)
- **Library Browser**: Sort and filter your snippet collection
  - Sort by date created, modified, or title
  - Filter by topic, queue status, or needs work flag
- **Review Interface**: Card-based review with front/back flip

### Future Features

- Password reset functionality
- OAuth authentication (Google, GitHub)
- Text highlighting in various colors
- Image support for snippets
- MathJax/LaTeX rendering with cloze support
- Image cloze deletions
- Library export for local storage
- Markdown/plaintext import (Obsidian integration)
- Auto-compress large images
- Browser extension
- iPhone app with share menu integration

## Tech Stack

**Frontend:**
- React 18 with Vite
- React Router for navigation
- Axios for API calls
- date-fns for date handling

**Backend:**
- Node.js with Express
- PostgreSQL database
- JWT authentication
- bcrypt for password hashing

**Deployment:**
- Frontend: Vercel/Netlify
- Backend: Compatible with any Node.js host
- Database: PostgreSQL (Supabase, Railway, Neon, etc.)

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

Create a PostgreSQL database and run the schema:

```bash
# Connect to PostgreSQL
psql -U your_username

# Create database
CREATE DATABASE snippet_db;

# Connect to the database
\c snippet_db

# Run the schema file
\i backend/src/db/schema.sql
```

### 3. Environment Configuration

**Backend (.env):**

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/snippet_db
JWT_SECRET=your-secure-random-secret-key-change-this
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**Frontend (.env):**

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 4. Run Development Servers

**Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### 5. Create Your First Account

1. Navigate to `http://localhost:5173`
2. Click "Register" and create an account
3. Start creating snippets!

## Usage Guide

### Creating Snippets

1. Click "Create New Snippet" from the dashboard
2. Choose snippet type:
   - **Excerpt**: Direct quotes from books, articles, etc.
   - **Revised**: Paraphrased or simplified versions
   - **Original**: Your own thoughts and ideas
3. Add content and select text, then press `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac) to create cloze deletions
4. Add topics for organization
5. Toggle "In Queue" to include in spaced repetition
6. Toggle "Needs Work" if you want to mark for later revision

### Reviewing Cards

1. Click "Review Cards" from the dashboard
2. Read the card with cloze deletions hidden
3. Click "Show Answer" to reveal the full content
4. Rate your recall:
   - **Unfamiliar**: Complete failure, resets to 1 day
   - **Hard**: Difficult recall, short interval
   - **Good**: Successful recall with effort
   - **Easy**: Perfect recall, longest interval

### Organizing Your Library

- **Sort**: By creation date, modification date, or title
- **Filter**: By topic, queue status, or needs work flag
- **Edit**: Click any snippet to modify
- **Delete**: Remove snippets you no longer need

## Project Structure

```
snippet/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Auth and other middleware
│   │   ├── db/              # Database connection and schema
│   │   └── utils/           # SM-2 algorithm and helpers
│   └── server.js            # Express app entry point
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/           # Page components
│   │   └── utils/           # Cloze deletion helpers
│   └── index.html
└── Snippet.md               # Original requirements
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Snippets
- `POST /api/snippets` - Create snippet
- `GET /api/snippets` - List snippets (with filters)
- `GET /api/snippets/:id` - Get single snippet
- `PUT /api/snippets/:id` - Update snippet
- `DELETE /api/snippets/:id` - Delete snippet
- `PATCH /api/snippets/:id/queue` - Toggle queue status
- `PATCH /api/snippets/:id/needs-work` - Toggle needs work flag

### Reviews
- `GET /api/review/due` - Get cards due for review
- `POST /api/review/:snippetId` - Submit review response
- `GET /api/review/stats` - Get user statistics

### Topics
- `GET /api/topics` - List all topics
- `POST /api/topics` - Create topic

## Free Tier Capacity

With free tiers of Vercel and PostgreSQL providers (Supabase/Neon):

- **Storage**: ~500MB database
- **Capacity**: ~100,000 snippets total (text only)
- **Users**: 100-150 active users comfortably
- **Note**: Adding images will significantly reduce capacity

## Database Schema

**users**: User accounts
**snippets**: Knowledge cards with content and metadata
**topics**: Tags for organizing snippets
**snippet_topics**: Many-to-many junction table
**reviews**: Spaced repetition scheduling data (SM-2 algorithm)

## Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend

1. Set up PostgreSQL database on your provider
2. Run schema.sql on production database
3. Deploy backend to Node.js hosting
4. Set environment variables

### Environment Variables

Make sure to set all environment variables from `.env.example` files in production.

## Contributing

This is a personal project, but suggestions and bug reports are welcome!

## License

MIT
