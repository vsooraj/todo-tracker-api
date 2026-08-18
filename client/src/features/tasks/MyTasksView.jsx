import React, { useEffect, useMemo, useState } from "react";
import { Calendar, CheckSquare } from "lucide-react";
import { getMyTasks } from "../../services/api";

function formatDueDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "Done") return false;
  return new Date(task.dueDate) < new Date();
}

export default function MyTasksView({ workspace, onOpenTask }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      setError("");
      try {
        const items = await getMyTasks(workspace.id);
        setTasks(items);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [workspace.id]);

  const filteredTasks = useMemo(() => {
    if (filter === "overdue") return tasks.filter(isOverdue);
    if (filter === "open") return tasks.filter((task) => task.status !== "Done");
    return tasks;
  }, [tasks, filter]);

  if (loading) return <p className="dashboard-loading">Loading your tasks…</p>;

  return (
    <section className="my-tasks-view">
      <div className="my-tasks-header">
        <div>
          <p className="eyebrow">Tasks</p>
          <h1>My Tasks</h1>
          <p className="my-tasks-subtitle">Open and overdue assignments across {workspace.name}.</p>
        </div>
        <div className="my-tasks-filters">
          {[
            { id: "all", label: "All" },
            { id: "open", label: "Open" },
            { id: "overdue", label: "Overdue" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={filter === id ? "toolbar-chip active" : "toolbar-chip"}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

      {filteredTasks.length === 0 ? (
        <div className="dashboard-placeholder">
          <CheckSquare size={32} />
          <h2>No tasks found</h2>
          <p>You have no {filter === "all" ? "" : filter} tasks assigned in this workspace.</p>
        </div>
      ) : (
        <div className="my-tasks-list">
          {filteredTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              className={isOverdue(task) ? "my-task-card overdue" : "my-task-card"}
              onClick={() => onOpenTask?.(task)}
            >
              <div className="my-task-card-top">
                <span className="kanban-task-id">{task.taskNumber}</span>
                <span className={`status-pill compact status-${task.status.toLowerCase().replace(/\s+/g, "-")}`}>{task.status}</span>
              </div>
              <strong>{task.title}</strong>
              <div className="my-task-card-meta">
                <span>{task.projectName}</span>
                <span><Calendar size={12} /> {formatDueDate(task.dueDate)}</span>
                <span className={`priority-chip priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
