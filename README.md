# Kairos

Kairos is a project-management platform evolving on the PERN stack: PostgreSQL, Express, React 19, and Node.js. It will use an N-tier architecture that keeps the user interface, application logic, and persistence concerns independent and easy to extend.

## Current status

The repository currently contains an Express API with temporary, in-memory todo storage. It supports creating, listing, reading, updating, and deleting todos. The planned React frontend and PostgreSQL persistence layer are documented in [Architecture.md](Architecture.md).

## Planned features

- Create and manage workspaces, projects, tasks, and milestones
- Assign tasks, track progress, and collaborate with team members
- Persist project data in PostgreSQL
- Responsive React 19 user interface
- Todo validation and consistent API error responses
- Filtering and sorting by completion state, date, or priority
- Due dates, priorities, categories, and search
- User authentication and user-scoped todo lists

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, JavaScript/TypeScript, CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Development | npm, Nodemon |

## Prerequisites

- Node.js 20 LTS or later
- npm 10 or later
- PostgreSQL 16 or later (required when the persistence layer is added)

## Setup

1. Clone the repository and enter the project folder.

   ```bash
   git clone <repository-url>
   cd todo-tracker-api
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Start the current API in development mode.

   ```bash
   npm run dev
   ```

   The API listens at `http://localhost:5000` by default. Set `PORT` to use a different port.

4. Verify the service.

   ```bash
   curl http://localhost:5000/health
   ```

### Authentication and login UI

Authentication uses [Clerk](https://clerk.com), which provides the email/password, Google, and GitHub sign-in flows shown in the login screen. Create an application in Clerk, enable the providers you need, then copy the example environment files and add its keys:

```bash
copy .env.example .env
copy client\.env.example client\.env
```

Set `CLERK_SECRET_KEY` in `.env` and the matching `VITE_CLERK_PUBLISHABLE_KEY` in `client/.env`. Start the API and React client in separate terminals:

```bash
npm run dev
npm run client:dev
```

Open `http://localhost:5173`. After sign-in, `GET /api/v1/auth/me` is available as a JWT-protected API example.

## Current API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Basic service response |
| `GET` | `/health` | Health check |
| `GET` | `/todos` | Return all todos |
| `GET` | `/todos/:id` | Return one todo |
| `POST` | `/todos` | Create a todo |
| `PUT` | `/todos/:id` | Update a todo |
| `DELETE` | `/todos/:id` | Delete a todo |
| `GET` | `/api/v1/auth/me` | Return the authenticated Clerk session identity |

Example request:

```bash
curl -X POST http://localhost:5000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Plan the React frontend","completed":false}'
```

## Planned environment configuration

Once PostgreSQL is introduced, create a `.env` file in the backend project (never commit it):

```env
PORT=5000
DATABASE_URL=postgresql://todo_user:change-me@localhost:5432/todo_tracker
NODE_ENV=development
```

Use a separate frontend environment file for public API configuration, for example `VITE_API_BASE_URL=http://localhost:5000` if Vite is selected.

## Target project structure

```text
kairos/
├── client/                  # React 19 application
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── features/        # Todo-focused views, hooks, and state
│       ├── services/        # HTTP client and API calls
│       └── pages/           # Route-level views
├── server/                  # Express application
│   └── src/
│       ├── routes/          # HTTP endpoint definitions
│       ├── controllers/     # Request/response coordination
│       ├── services/        # Business rules
│       ├── repositories/    # PostgreSQL access
│       ├── middleware/      # Validation, errors, auth, logging
│       └── db/              # Pool, migrations, and seeds
├── shared/                  # Optional shared types/contracts
├── docs/                    # Supporting documentation
├── README.md
└── Architecture.md
```

See [Architecture.md](Architecture.md) for the responsibilities and interactions of these layers.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the current Express API |
| `npm run dev` | Start the current API with Nodemon |

## License

This project is licensed under the [MIT License](LICENSE).
