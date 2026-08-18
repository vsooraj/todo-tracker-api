# Database layer

PostgreSQL persistence is managed with **Prisma** at the repository root:

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Seed: `prisma/seed.js`
- Client singleton: `server/src/lib/prisma.js`

## Local setup

1. Start PostgreSQL (Docker Desktop required):

   ```bash
   docker compose up -d
   ```

   Default connection: `postgresql://postgres:password@localhost:5433/kairos?schema=public`

   Port **5433** avoids conflicts with local PostgreSQL or other Docker apps on 5432.

2. Set `DATABASE_URL` in `.env` (see `.env.example`).

3. Apply schema and seed the demo user:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   Or, for quick prototyping without migration history:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the API:

   ```bash
   npm run dev
   ```

## Neon / hosted PostgreSQL

Set `DATABASE_URL` to your Neon connection string (pooler URL recommended), then run `npm run db:migrate` and `npm run db:seed`.

## Entity model (SRS §5)

| Model | Purpose |
| --- | --- |
| `User` | Clerk-synced identity (`clerkUserId`, email, name) |
| `Workspace` | Tenant organisation |
| `WorkspaceMember` | User ↔ workspace membership with role |
| `UserActiveWorkspace` | Per-user active tenant context |
| `Project` | Workspace-scoped project |
| `ProjectMember` | User ↔ project membership |
| `Task` | Project task with status, assignee, metadata |
| `Comment` | Task discussion thread |
| `TaskActivity` | Task audit/activity feed |
| `Invitation` | Workspace member invitations |

Repositories in `server/src/repositories/` map Prisma records to the API shapes consumed by services.
