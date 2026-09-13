# Quickstart: AI StudyMate MVP

## Prerequisites

- Node.js 18+ (`node --version`)
- Python 3.11+ (`python --version`)
- Supabase CLI (`npx supabase --version`)
- OpenAI API key

## 1. Clone and install

```bash
git clone <repo-url>
cd ai-studymate
```

## 2. Start Supabase local

```bash
npx supabase start
npx supabase db push
```

Copy the output values (API URL, anon key, service role key, JWT secret).

## 3. Backend setup

```bash
cd apps/api
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `apps/api/.env`:
```
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<from supabase start>
SUPABASE_JWT_SECRET=<from supabase start>
OPENAI_API_KEY=<your key>
AI_MODEL=gpt-4o
EMBEDDING_MODEL=text-embedding-3-small
```

Start:
```bash
uvicorn app.main:app --reload --port 8000
```

## 4. Frontend setup

```bash
cd apps/web
npm install
```

Create `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start:
```bash
npm run dev
```

Open http://localhost:3000

## 5. Verify

1. Open http://localhost:3000/signup → create account
2. Login → see dashboard
3. Upload a PDF → watch status go to "ready"
4. Open Tutor → ask a question about the PDF
5. Open Quiz → generate quiz → submit → see evaluation

## Running tests

```bash
# Backend
cd apps/api
pytest

# Frontend
cd apps/web
npm test
```
