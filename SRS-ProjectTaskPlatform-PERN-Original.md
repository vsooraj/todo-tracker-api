# Software Requirements Specification
## Multi-Tenant Project & Task Management Platform (PERN Stack)

---

## 1. Document Overview & System Scope

This SRS details the functional and architectural specifications for the Multi-Tenant Project & Task Management Platform on the original **PERN stack** (PostgreSQL, Express.js, React, Node.js). The system provides multi-tenant workspace isolation, project lifecycle tracking, kanban task delegation, threaded discussions, real-time analytics, and event-driven email workflows.

This document restores the native PERN architecture, entity model, and RBAC rules — the same functional surface as the .NET translation, expressed in its original Node/Express/Prisma form.

---

## 2. Architecture & Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite SPA), Tailwind CSS, Redux Toolkit, React Router DOM, Recharts, Lucide React, React Hot Toast |
| Backend | Node.js, Express.js — layered as Routes → Controllers → Services → Prisma repositories |
| Database | Neon Serverless PostgreSQL, **Prisma ORM** |
| Identity & Tenancy | **Clerk Auth & Multi-Org Management** — org membership, roles, and session/JWT issuance handled by Clerk; `orgId` resolved from Clerk session on every request |
| Background Jobs / Events | **Inngest** — durable event-driven functions for webhook sync, delayed jobs (`step.sleepUntil`), retries, and cron |
| Mail | **Nodemailer** over **Brevo SMTP** |
| Hosting / Infra | **Vercel** (both API routes/serverless functions and the React SPA) |

**Architectural note:** Recommended project layout:

```
project-task-platform/
 ├─ apps/
 │   ├─ web/                 (React 18 + Vite SPA)
 │   └─ api/                 (Express.js app)
 │       ├─ src/
 │       │   ├─ routes/
 │       │   ├─ controllers/
 │       │   ├─ services/
 │       │   ├─ middleware/  (Clerk auth, tenant resolution)
 │       │   └─ inngest/     (event functions: task.assigned, task.due-reminder, etc.)
 │       └─ prisma/
 │           └─ schema.prisma
 └─ packages/
     └─ shared/               (shared types/constants between web & api)
```

---

## 3. Role-Based Access Control (RBAC)

RBAC mirrors Clerk's org-role model directly, enforced via Express middleware that reads the active organization membership and role off the Clerk session.

| Role | Scope | Permissions Matrix |
|---|---|---|
| Workspace Admin | Organization / Tenant | Create, edit, delete workspaces; invite/remove members and manage roles (Admin, Member); provision projects and designate Project Leads |
| Project Lead | Specific Project | Edit project metadata, milestones, progress (0–100%); associate workspace members to the project team; create, update, reassign, and batch delete tasks |
| Project Member / Assignee | Assigned Tasks | Transition task status (To Do → In Progress → Done); participate in threaded task discussions; access project calendar and personal task queue |

Recommended implementation: a `requireRole(role)` Express middleware, composed after Clerk's `requireAuth()`, that checks the active org's role claim (from `req.auth.orgRole`) against the route's required role before the controller executes.

---

## 4. Functional Requirements

### 4.1 Identity & Multi-Tenant Organization Sync
- **FR-1.1 (Auth Flow):** Authenticate users via **Clerk-hosted sign-in** (supports Google OAuth and email magic link out of the box). Block unauthenticated access via Clerk's `requireAuth()` middleware validating the session JWT on every request.
- **FR-1.2 (Identity Sync):** Clerk dispatches **webhooks** (`user.created`, `user.updated`, `user.deleted`, `organizationMembership.created`, etc.) to an Express webhook endpoint (`/api/webhooks/clerk`), which forwards the payload into an **Inngest event** for durable, retryable processing and persistence to PostgreSQL via Prisma.
- **FR-1.3 (Workspace Provisioning & Switching):** Force initial workspace (Clerk Organization) setup on signup if membership count is zero (checked in login response via Clerk's `useOrganizationList`). Support tenant-context switching via Clerk's `<OrganizationSwitcher />`; the active `orgId` is embedded in the session token and read server-side per request — no manual header plumbing needed.
- **FR-1.4 (Member Invitations):** Admins dispatch invitations via **Clerk's built-in invitation flow** (`clerkClient.organizations.createOrganizationInvitation`), which handles the invite email and token. On acceptance, Clerk fires an `organizationInvitation.accepted` webhook → Inngest function creates the local `WorkspaceMember` record via Prisma.

### 4.2 Project Lifecycle & Resource Allocation
- **FR-2.1 (Project Initialization):** Admins create projects with: `workspaceId`, `name`, `description`, `status` (Planning, Active, Completed), `priority` (Low, Medium, High), `startDate`, `endDate`, `projectLeadId`, and default team members. Modeled as `POST /api/projects` → controller → Prisma `project.create()`, validated with **Zod**.
- **FR-2.2 (Project Modification):** Project Leads/Admins modify configuration, track completion percentage, or archive initiatives via `PUT /api/projects/:id`.
- **FR-2.3 (Project Member Assignment):** Map workspace-level users into project scopes via a `ProjectMember` join table (Prisma many-to-many with payload fields).
- **FR-2.4 (Project Visualizations):**
  - Analytics: task breakdown by Status/Type/Priority — Recharts on the frontend, fed by `GET /api/projects/:id/analytics`, returning pre-aggregated counts via Prisma `groupBy` (avoid client-side aggregation of large task sets).
  - Calendar View: monthly schedule rendering tasks by due date, sourced from `GET /api/projects/:id/calendar`.

### 4.3 Task Execution & Discussion Engine
- **FR-3.1 (Task Creation):** `projectId`, `title`, `description`, `type` (Task, Bug, Feature, Improvement), `priority`, `assigneeId`, `status` (To Do, In Progress, Done), `dueDate`.
- **FR-3.2 (Status Progression):** Update task attributes/state from list, board, or detail views via `PUT /api/tasks/:id`.
- **FR-3.3 (Bulk Operations):** Atomic multi-select bulk delete via `POST /api/tasks/delete`, wrapped in a Prisma `$transaction()`.
- **FR-3.4 (My Tasks View):** Aggregate open/overdue assignments across all workspace projects for the current user — `GET /api/tasks/my-tasks`, filtered by `assigneeId` + active `orgId`.
- **FR-3.5 (Task Comments):** Chronological comments with user metadata/timestamps — `Comment` model, `POST /api/comments`.

### 4.4 Automated Notifications & Scheduled Workflows
- **FR-4.1 (Assignment Notification):** On task creation, send an **Inngest event** (`task/assigned`) that triggers a durable function to send an HTML notification to the assignee via Nodemailer/Brevo SMTP.
- **FR-4.2 (Due Date Reminders):** Use **Inngest's `step.sleepUntil(dueDate)`** to durably wait until the due date, then re-check `status !== "Done"` from PostgreSQL before dispatching the overdue reminder (never trust the scheduling-time snapshot).

---

## 5. Entity Relationship Model (Prisma / PostgreSQL)

```
User (Clerk-synced) 1───* WorkspaceMember *───1 Workspace
   id (uuid, PK)              id (PK)                 id (PK)
   clerkUserId (unique)       userId (FK)              name
   email                      workspaceId (FK)         slug
   name                       role (Admin/Member)      imageUrl
   image                                                ownerId (FK)

Workspace 1───* Project 1───* Task *───1 Comment
   id (PK)      id (PK)          id (PK)            id (PK)
                workspaceId (FK) projectId (FK)      taskId (FK)
                name             title               userId (FK)
                description      description         content
                status           type                createdAt
                priority         status
                progress         priority
                teamLeadId (FK)  assigneeId (FK)
                startDate        dueDate
                endDate

Project 1───* ProjectMember *───1 User
   id (PK)      id (PK)
                projectId (FK)
                userId (FK)
```

Prisma conventions: `uuid` primary keys via `@default(uuid())` (or `cuid()`), `DateTime` fields map to PostgreSQL `timestamptz`, and a `orgId` (or `workspaceId`) scalar field on every tenant-scoped model with an application-level query helper (Prisma doesn't support native row-level query filters like EF Core's `HasQueryFilter`, so tenant scoping must be enforced explicitly in every service-layer query — this is the single most important discipline to hold, since Clerk's org context alone doesn't filter your Prisma queries for you).

---

## 6. API Route Specification

| Route Path | Verb | Handler | Access Constraint |
|---|---|---|---|
| `/api/workspaces` | GET | `workspaces.controller.getUserWorkspaces` | Authenticated User |
| `/api/workspaces/add-member` | POST | `workspaces.controller.addMember` | Workspace Admin |
| `/api/projects` | POST | `projects.controller.create` | Workspace Admin |
| `/api/projects` | PUT | `projects.controller.update` | Admin or Project Lead |
| `/api/projects/:projectId/add-member` | POST | `projects.controller.addMember` | Project Lead |
| `/api/tasks` | POST | `tasks.controller.create` | Project Lead |
| `/api/tasks/:id` | PUT | `tasks.controller.update` | Project Lead / Assignee |
| `/api/tasks/delete` | POST | `tasks.controller.bulkDelete` | Project Lead |
| `/api/comments/:taskId` | GET | `comments.controller.getForTask` | Project Member |
| `/api/comments` | POST | `comments.controller.add` | Project Member |
| `/api/webhooks/clerk` | POST | `webhooks.controller.clerk` | Clerk signature-verified, unauthenticated |
| `/api/inngest` | — | Inngest serve handler (function registry) | Internal, signing-key secured |

All routes carry Clerk's `requireAuth()` middleware; tenant-scoped routes additionally validate the active `orgId` (from the Clerk session) against the resource before the controller executes.

---

## 7. Non-Functional & Operational Requirements

- **Performance:** Target sub-100ms query latency via Prisma `select`/`include` scoped to actual view needs (avoid over-fetching relations), connection pooling via Neon's built-in pooler (or PgBouncer), and indexed foreign keys on all tenant-scoped lookups.
- **Event Reliability:** Background work (assignment notifications, due-date reminders, identity sync) runs through **Inngest's durable execution** — automatic retries, replay on failure, and step-level checkpointing, so a crashed function resumes rather than restarts.
- **Responsive Layout:** Tailwind CSS, Light/Dark theme support, responsive sidebar.
- **Stateless Token Verification:** Authenticate all client requests via Clerk session JWTs, validated on every API boundary through Clerk's Express middleware (signature, expiry, and org-claim verification handled by the Clerk SDK).
- **Multi-Tenant Data Isolation:** Enforce via an explicit `workspaceId`/`orgId` filter on every Prisma query at the service layer (no native ORM-level global filter in Prisma) — the most important gap to guard against, since a single missed filter leaks cross-tenant data.

---

## 8. Open Decisions for You to Confirm

1. **Auth provider:** Clerk assumed, as in the original. If cost or data-residency concerns push you off Clerk, Auth.js (NextAuth) with a custom org model is the usual PERN fallback, but you'd lose the built-in org/invite UI.
2. **Background jobs:** Inngest assumed (hosted, dashboard included). Self-hosted alternative: BullMQ + Redis if you want to avoid a third-party event platform.
3. **Hosting target:** Vercel assumed for both API and SPA. If you need long-running connections or WebSocket support beyond serverless function limits, Render or Fly.io are common PERN alternatives.
4. **Email:** Nodemailer/Brevo assumed; swap to Resend or Postmark if you want better deliverability analytics.
