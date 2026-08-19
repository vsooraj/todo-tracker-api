# BUG-043: Todo Active / Done filters show the wrong items

**Type:** Bug  
**Priority:** Medium  
**Component:** Todo UI (frontend)  
**Reported:** 2026-08-19  
**Status:** Open  

---

## Summary

On the **Todos** page, the **Active** and **Done** filter chips return the opposite set of items. **All** and search/sort still work.

---

## Environment

- **Client:** http://localhost:8080 (Docker) or http://localhost:5173 (`npm run client:dev`)
- **API:** Legacy in-memory `/api/v1/todos` (no auth)

---

## Steps to reproduce

1. Open the app and go to **Todos** in the sidebar.
2. Add two todos, e.g. `Task A` and `Task B`.
3. Mark **Task A** complete (checkbox checked); leave **Task B** active.
4. Click the **Active** filter chip.

   **Expected:** Only **Task B** (unchecked) is listed.  
   **Actual:** Only **Task A** (checked) is listed.

5. Click the **Done** filter chip.

   **Expected:** Only **Task A** (checked) is listed.  
   **Actual:** Only **Task B** (unchecked) is listed.

6. Click **All**.

   **Expected / actual:** Both todos appear — this filter is unaffected.

---

## Notes

- Toggle, edit, delete, and create still work; only the Active/Done filter labels are wrong.
- Sort options **Active first** / **Done first** are not affected (only the filter chips).

---

## Suspected area

- `client/src/features/todos/TodoView.jsx` — `filteredTodos` `useMemo`, filter branch for `active` / `done`

---

## Acceptance criteria

- [ ] **Active** shows todos where `completed === false`
- [ ] **Done** shows todos where `completed === true`
- [ ] **All** continues to show every todo
- [ ] Filter works together with search and sort
