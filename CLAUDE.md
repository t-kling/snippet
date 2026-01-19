# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Snippet is a spaced repetition application for knowledge cards using the SM-2 algorithm. It has a React 19 + Vite frontend and Node.js/Express backend with PostgreSQL.

## Common Commands

### Development (run in separate terminals)
```bash
cd backend && npm run dev     # Backend at http://localhost:5000
cd frontend && npm run dev    # Frontend at http://localhost:5173
```

### Database
```bash
cd backend && npm run init-db                                    # Initialize database
psql -U postgres -d snippet_db -f backend/src/db/complete-schema.sql  # Apply full schema
```

### Build & Lint
```bash
cd frontend && npm run build  # Production build to dist/
cd frontend && npm run lint   # ESLint check
```

## Architecture

### Backend (MVC Pattern)
```
backend/src/
├── server.js              # Express entry point, CORS config
├── routes/                # API endpoint definitions (auth, snippets, reviews, topics, ai)
├── controllers/           # Request handlers with business logic
├── middleware/auth.js     # JWT verification middleware
├── services/              # Email (nodemailer) and AI (OpenAI) services
├── utils/sm2.js           # SM-2 spaced repetition algorithm implementation
└── db/
    ├── index.js           # PostgreSQL connection pool
    ├── schema.sql         # Base schema
    ├── complete-schema.sql # Production schema (includes all migrations)
    └── migrations/        # SQL migration files (manually applied)
```

### Frontend (React Context + Pages)
```
frontend/src/
├── App.jsx                # Router & auth wrapper with PrivateRoute
├── api/client.js          # Axios client with JWT interceptor
├── contexts/              # AuthContext (JWT state), SettingsContext (theme)
├── pages/                 # Dashboard, Library, SnippetEditor, Review, Stats, etc.
├── components/            # Shared UI (Header, ImageClozeEditor, etc.)
└── utils/
    ├── cloze.js           # Cloze deletion syntax parser ({{c1::answer}})
    ├── latex.jsx          # KaTeX LaTeX renderer
    └── imageCompression.js
```

### Key Data Flows

**Authentication**: Login/Register → JWT issued → stored in localStorage → Axios interceptor adds Bearer token → authMiddleware verifies

**Spaced Repetition**: Review.jsx displays cards → user rates (0-5) → backend calls sm2.js → updates ease_factor/interval/next_review_date

**Cloze Syntax**: `{{c1::hidden text}}` parsed by `cloze.js`, stored in JSONB `cloze_data` column

## Database

PostgreSQL with these core tables:
- `users` - accounts with bcrypt password hashes
- `snippets` - knowledge cards (content, type, cloze_data JSONB, image_clozes JSONB)
- `topics` - tags (many-to-many via snippet_topics)
- `reviews` - SM-2 data (ease_factor, interval, repetitions, next_review_date)
- `password_reset_tokens` - for email-based password reset

Add new migrations as SQL files in `backend/src/db/migrations/`.

## Environment Variables

**Backend** (`backend/.env`):
- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Random secret for signing tokens (required)
- `OPENAI_API_KEY` - For optional AI features
- `EMAIL_*` - SMTP config for password reset emails (see `backend/EMAIL_SETUP.md`)

**Frontend** (`frontend/.env`):
- `VITE_API_URL` - Backend API URL (e.g., `http://localhost:5000/api`)

## Key Patterns

**API Endpoints**: RESTful JSON at `/api/*`. All protected except auth endpoints.

**SM-2 Algorithm**: Custom implementation in `backend/src/utils/sm2.js`. Quality ratings: 0=Unfamiliar, 2=Hard, 3.5=Good, 5=Easy. Returns `{ easeFactor, interval, repetitions }`.

**CORS**: Configured in `server.js` with specific allowed origins for dev and production Vercel URLs.

**No test suite exists** - tests would need to be added.

## Code Quality Reminders

**Always verify closing braces**: When editing large functions or components with nested JSX, double-check that all opening braces `{` and parentheses `(` have matching closing braces `}` and `)`.

**Arrow function syntax**:
- With explicit return: `const func = () => { return (<div>...</div>); };` ends with `};`
- With implicit return: `const func = () => (<div>...</div>);` ends with just `);` (no curly braces, no extra semicolon)
- Common mistake: Converting from explicit to implicit but leaving `};` at the end

**Extract duplicated code**: When the same logic or constants appear in multiple places (especially 3+ times), extract them to shared helpers, constants, or components. Examples:
- Functions/constants defined identically in multiple places should be hoisted to module level
- Inline JSX duplicated across components should be extracted to shared components
- This reduces bugs, improves maintainability, and makes code easier to understand

**Use existing shared components**: Before writing new JSX, check if shared components already exist that provide the same functionality. Review imports and component files to avoid reinventing the wheel.
