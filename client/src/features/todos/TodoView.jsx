import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  CheckSquare,
  ListTodo,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { createTodo, deleteTodo, getTodos, updateTodo } from "../../services/api";

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "title-asc", label: "Title A–Z" },
  { id: "title-desc", label: "Title Z–A" },
  { id: "active-first", label: "Active first" },
  { id: "done-first", label: "Done first" },
];

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "done", label: "Done" },
];

export default function TodoView() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    setLoading(true);
    setError("");
    try {
      const items = await getTodos();
      setTodos(Array.isArray(items) ? items : []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredTodos = useMemo(() => {
    let items = [...todos];

    if (filter === "active") items = items.filter((todo) => todo.completed);
    if (filter === "done") items = items.filter((todo) => !todo.completed);

    const query = search.trim().toLowerCase();
    if (query) {
      items = items.filter((todo) => (
        todo.title.toLowerCase().includes(query)
        || String(todo.id).includes(query)
      ));
    }

    items.sort((left, right) => {
      if (sortBy === "oldest") return left.id - right.id;
      if (sortBy === "newest") return right.id - left.id;
      if (sortBy === "title-asc") return left.title.localeCompare(right.title);
      if (sortBy === "title-desc") return right.title.localeCompare(left.title);
      if (sortBy === "active-first") return Number(left.completed) - Number(right.completed);
      if (sortBy === "done-first") return Number(right.completed) - Number(left.completed);
      return 0;
    });

    return items;
  }, [todos, search, sortBy, filter]);

  async function handleCreate(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setSaving(true);
    setError("");
    try {
      const todo = await createTodo({ title: trimmed, completed: false });
      setTodos((items) => [...items, todo]);
      setTitle("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(todo) {
    setError("");
    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((items) => items.map((item) => (item.id === todo.id ? updated : item)));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
  }

  async function saveEdit(todo) {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setError("Title cannot be empty.");
      return;
    }
    if (trimmed === todo.title) {
      cancelEdit();
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await updateTodo(todo.id, { title: trimmed });
      setTodos((items) => items.map((item) => (item.id === todo.id ? updated : item)));
      cancelEdit();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(todoId) {
    setError("");
    try {
      await deleteTodo(todoId);
      setTodos((items) => items.filter((item) => item.id !== todoId));
      if (editingId === todoId) cancelEdit();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const completedCount = todos.filter((todo) => todo.completed).length;

  if (loading) return <p className="dashboard-loading">Loading todos…</p>;

  return (
    <section className="todo-view">
      <div className="todo-view-header">
        <div>
          <p className="eyebrow">Legacy API</p>
          <h1>Todos</h1>
          <p className="todo-view-subtitle">
            List, add, edit, delete, search &amp; sort via <code>/api/v1/todos</code>
          </p>
        </div>
        <div className="todo-view-stats">
          <span><ListTodo size={16} /> {todos.length} total</span>
          <span><CheckSquare size={16} /> {completedCount} done</span>
        </div>
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

      <form className="todo-create-form" onSubmit={handleCreate}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to be done?"
          maxLength={200}
          disabled={saving}
        />
        <button type="submit" className="primary-button" disabled={saving || !title.trim()}>
          <Plus size={16} />
          Add
        </button>
      </form>

      <div className="todo-toolbar">
        <label className="todo-search">
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or ID…"
          />
        </label>
        <label className="todo-sort">
          <SlidersHorizontal size={14} />
          Sort
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <div className="todo-filters">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={filter === option.id ? "toolbar-chip active" : "toolbar-chip"}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {todos.length === 0 ? (
        <div className="dashboard-placeholder todo-empty">
          <ListTodo size={32} />
          <h2>No todos yet</h2>
          <p>Add your first item above. Data is stored in memory and resets when the API restarts.</p>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="dashboard-placeholder todo-empty">
          <Search size={32} />
          <h2>No matches</h2>
          <p>Try a different search or filter.</p>
        </div>
      ) : (
        <ul className="todo-list-panel">
          {filteredTodos.map((todo) => (
            <li key={todo.id} className={todo.completed ? "todo-item completed" : "todo-item"}>
              <label className="todo-item-check">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo)}
                  disabled={editingId === todo.id}
                  aria-label={`Mark "${todo.title}" complete`}
                />
              </label>

              {editingId === todo.id ? (
                <form
                  className="todo-edit-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveEdit(todo);
                  }}
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    maxLength={200}
                    autoFocus
                    disabled={saving}
                  />
                  <button type="submit" className="secondary-button" disabled={saving}>Save</button>
                  <button type="button" className="icon-button" onClick={cancelEdit} aria-label="Cancel edit">
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <span className="todo-item-title">{todo.title}</span>
              )}

              <div className="todo-item-meta">
                <span className="todo-item-id">#{todo.id}</span>
                {editingId !== todo.id && (
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => startEdit(todo)}
                    aria-label={`Edit ${todo.title}`}
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className="icon-button todo-delete"
                  onClick={() => handleDelete(todo.id)}
                  aria-label={`Delete ${todo.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {filteredTodos.length > 0 && (
        <p className="todo-result-count">
          <ArrowDownAZ size={14} />
          Showing {filteredTodos.length} of {todos.length} todos
        </p>
      )}
    </section>
  );
}
