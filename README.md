# Task Management Dashboard (Web)

A minimal web-based dashboard to create/manage tasks, persist them to SQLite, and generate/stash email drafts per task. It also includes an **agent-friendly API** so future AI call agents can upsert tasks with metadata.

## Run locally

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`.

## What’s included

- **Dashboard UI**: create tasks, change status, delete tasks, generate email drafts
- **Persistence**: SQLite database at `prisma/dev.db` (ignored by git)
- **API routes**:
  - `GET /api/tasks` / `POST /api/tasks`
  - `GET /api/tasks/:id` / `PATCH /api/tasks/:id` / `DELETE /api/tasks/:id`
  - `GET /api/tasks/:id/email-drafts` / `POST /api/tasks/:id/email-drafts`
  - `POST /api/agent/task` (idempotent upsert via `source` + `externalId`)
