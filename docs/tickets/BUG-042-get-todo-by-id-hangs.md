# BUG-042: GET todo by ID no longer returns a response

**Type:** Bug  
**Priority:** High  
**Component:** Legacy Todos API  
**Reported:** 2026-08-19  
**Status:** Open  

---

## Summary

The **Get Todo by ID** endpoint was working correctly but now fails — the request hangs and never returns JSON. List, create, update, and delete still work.

---

## Environment

- **API base URL:** `http://localhost:5001` (Docker) or `http://localhost:5000` (local `npm run dev`)
- **Auth:** None required (legacy in-memory todos)

---

## Steps to reproduce

1. Create a todo:

   ```http
   POST /api/v1/todos
   Content-Type: application/json

   {
     "title": "Buy groceries",
     "completed": false
   }
   ```

   **Expected response (201):**

   ```json
   {
     "id": 1,
     "title": "Buy groceries",
     "completed": false
   }
   ```

2. List todos (works):

   ```http
   GET /api/v1/todos
   ```

   **Response (200):**

   ```json
   [
     {
       "id": 1,
       "title": "Buy groceries",
       "completed": false
     }
   ]
   ```

3. Get todo by ID (broken):

   ```http
   GET /api/v1/todos/1
   ```

   **Expected (previously worked):**

   ```json
   {
     "id": 1,
     "title": "Buy groceries",
     "completed": false
   }
   ```

   **Actual:** Request hangs; no response body; client times out.

4. Optional — verify missing ID handling (also broken):

   ```http
   GET /api/v1/todos/999
   ```

   **Expected (previously worked):**

   ```json
   {
     "error": "Todo not found"
   }
   ```

   **Status:** 404  
   **Actual:** Request hangs.

---

## PowerShell sample

```powershell
# Setup — create sample data
Invoke-RestMethod http://localhost:5001/api/v1/todos -Method POST `
  -ContentType "application/json" `
  -Body '{"title":"Buy groceries","completed":false}'

# Works
Invoke-RestMethod http://localhost:5001/api/v1/todos

# Broken — hangs / no output
Invoke-RestMethod http://localhost:5001/api/v1/todos/1
```

---

## Affected endpoints

| Method | Endpoint | Status |
|--------|----------|--------|
| `GET` | `/api/v1/todos/:id` | Broken |
| `GET` | `/todos/:id` | Broken (same handler) |
| `GET` | `/api/v1/todos` | OK |
| `POST` | `/api/v1/todos` | OK |
| `PUT` | `/api/v1/todos/:id` | OK |
| `DELETE` | `/api/v1/todos/:id` | OK |

---

## Suspected area

- `server/src/controllers/todo.controller.js` — `getById` handler
- Route: `server/src/routes/todo.routes.js` — `GET /:id`

---

## Acceptance criteria

- [ ] `GET /api/v1/todos/1` returns `200` with the todo JSON when the ID exists
- [ ] `GET /api/v1/todos/999` returns `404` with `{ "error": "Todo not found" }` when the ID does not exist
- [ ] Behaviour matches list/create/update/delete (same in-memory store)
