# Kairos Architecture

## Overview

Kairos is planned as a PERN project-management application using an N-tier architecture. Each tier has a focused responsibility and communicates through explicit interfaces:

```text
Browser
  │ HTTPS / JSON
  ▼
React 19 frontend (presentation tier)
  │ REST API requests
  ▼
Express / Node.js API (application tier)
  ├── routes and controllers
  ├── services and business rules
  └── repositories / data access
  │ parameterized SQL
  ▼
PostgreSQL (data tier)
```

The current repository is an early API-only implementation. Its todo data is held in memory; this is suitable for local experimentation but is reset whenever the server restarts. The target design replaces it with PostgreSQL and adds the React frontend.

## Layers and responsibilities

| Layer | Primary responsibility | Planned components |
| --- | --- | --- |
| Presentation | Render UI, collect input, display state and errors | React pages, components, feature hooks, client-side state |
| API | Expose stable HTTP contracts and coordinate requests | Express routes, controllers, middleware |
| Business | Enforce application rules independent of HTTP and SQL | Todo services, validation rules, authorization checks |
| Data access | Read and write persisted data | Repository modules, PostgreSQL connection pool, migrations |
| Data | Reliably store application records and relationships | PostgreSQL database, indexes, constraints, backups |

### Frontend: React 19

The frontend is responsible for the user experience only. It should render todo lists and forms, manage local UI state, call the API through a small service layer, and present loading, empty, and error states. Components should not contain SQL or backend business rules.

Recommended frontend boundaries:

- `pages/` composes route-level screens.
- `features/todos/` owns todo-specific components, hooks, and client state.
- `services/` centralizes API calls and response handling.
- `components/` contains reusable, presentational UI elements.

### Backend: Node.js and Express

The Express API owns HTTP concerns, application behavior, and access control. Routes map a method and URL to controllers; controllers parse inputs and select status codes; services apply business rules; repositories isolate SQL and map database rows to application objects.

```text
Route → Controller → Service → Repository → PostgreSQL
```

Middleware runs at the API boundary for concerns such as JSON parsing, request logging, CORS, authentication, schema validation, rate limiting, and centralized error handling.

### Database: PostgreSQL

PostgreSQL is the system of record. Database constraints protect data even if an application bug bypasses API validation. Use migrations to version every schema change and a connection pool for efficient database access.

An initial schema can begin with a `todos` table:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `bigint` or `uuid` | Primary key |
| `title` | `varchar(255)` | Required todo title |
| `description` | `text` | Optional detail |
| `completed` | `boolean` | Defaults to `false` |
| `priority` | `smallint` | Optional constrained priority |
| `due_at` | `timestamptz` | Optional due date |
| `created_at` | `timestamptz` | Creation timestamp |
| `updated_at` | `timestamptz` | Last-update timestamp |
| `user_id` | `uuid` | Added when authentication is introduced |

Indexes should follow actual query patterns, such as `(user_id, completed, due_at)` once todos are user-scoped and frequently filtered.

## Data flow

For a user creating a todo:

1. A React form validates basic required fields and sends `POST /api/v1/todos` as JSON.
2. Express middleware parses the body and validates the request schema.
3. The controller passes a normalized command to the todo service.
4. The service enforces domain rules and calls the repository.
5. The repository runs parameterized SQL against PostgreSQL through a connection pool.
6. PostgreSQL applies constraints, commits the record, and returns it.
7. The API returns `201 Created` with a documented JSON representation.
8. The frontend updates its displayed state and gives the user feedback.

Failure responses use the same path in reverse. The backend logs enough detail for diagnosis but returns safe, consistent error messages; the frontend displays a user-friendly message without exposing internals.

## API design

Version the public API from the outset, for example `/api/v1/todos`. Prefer resource-oriented endpoints and standard HTTP status codes.

| Method | Endpoint | Expected result |
| --- | --- | --- |
| `GET` | `/api/v1/todos` | List todos, optionally filtered and paginated |
| `POST` | `/api/v1/todos` | Create a todo (`201`) |
| `GET` | `/api/v1/todos/:id` | Get one todo (`200` or `404`) |
| `PATCH` | `/api/v1/todos/:id` | Partially update a todo |
| `DELETE` | `/api/v1/todos/:id` | Delete a todo (`204`) |

Use a common error envelope, such as:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [{ "field": "title", "message": "Title is required." }]
  }
}
```

## Design decisions

| Decision | Rationale |
| --- | --- |
| N-tier separation | Enables independent frontend and backend development, focused testing, and safer feature growth. |
| REST with JSON | Simple, widely supported contract for a CRUD-oriented application. |
| PostgreSQL | Provides durable storage, transactions, constraints, relational modeling, and strong querying. |
| Repository pattern | Prevents SQL details from leaking into controllers and services. |
| Parameterized queries | Protects against SQL injection and makes inputs explicit. |
| Migrations | Makes schema changes repeatable across development, test, and production. |
| Environment-based configuration | Keeps secrets and deployment-specific values out of source control. |
| API versioning | Allows the API to evolve without unexpectedly breaking clients. |

## Security and operational considerations

- Store credentials and tokens in environment variables or a managed secret store, never in source control.
- Validate all request data on the server; browser validation is only a usability aid.
- Use parameterized queries exclusively.
- Configure CORS to allow only trusted frontend origins in production.
- Add authentication, authorization, password hashing, and secure session/token handling before user accounts are released.
- Return generic client errors while logging correlated diagnostic details on the server.
- Use HTTPS in deployed environments and restrict database network access to trusted services.
- Add health and readiness checks, structured logs, metrics, backups, and migration checks to deployments.

## Testing strategy

- Unit-test services and validation rules without HTTP or database dependencies.
- Integration-test repositories against a dedicated test PostgreSQL database.
- API-test routes, status codes, validation, and error envelopes.
- Component-test React interactions and render states.
- Add end-to-end tests for core workflows such as create, complete, edit, and delete.

## Future enhancements

- Authentication, roles, and user-owned todo lists
- Labels, projects, priorities, due dates, and recurring tasks
- Search, filters, sorting, pagination, and archived todos
- Email or push reminders and background job processing
- File attachments and activity history
- Optimistic UI updates and offline-friendly synchronization
- OpenAPI documentation and generated API clients
- Containerization, CI/CD, database backups, monitoring, and alerting
- Caching or a queue only after measured scale and performance needs justify them
