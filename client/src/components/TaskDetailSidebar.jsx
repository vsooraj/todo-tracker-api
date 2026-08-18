import React, { useState } from "react";
import { Calendar, CheckSquare, Tag, X } from "lucide-react";
import { updateTask } from "../services/api";

function formatDueDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function TaskDetailSidebar({ task, workspace, canManage, onClose, onUpdated, onMove, onOpenFullDetail }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggleSubtask(subtaskId) {
    if (!canManage) return;
    setSaving(true);
    setError("");
    try {
      const subtasks = task.subtasks.map((item) => (
        item.id === subtaskId ? { ...item, completed: !item.completed } : item
      ));
      const completedCount = subtasks.filter((item) => item.completed).length;
      const progress = subtasks.length ? Math.round((completedCount / subtasks.length) * 100) : task.progress;
      const updated = await updateTask(task.id, { subtasks, progress });
      onUpdated(updated);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(event) {
    const status = event.target.value;
    setSaving(true);
    try {
      if (onMove) await onMove(task, status);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const completedSubtasks = task.subtasks?.filter((item) => item.completed).length || 0;

  return (
    <aside className="task-detail-sidebar">
      <div className="task-detail-sidebar-header">
        <div>
          <span className="kanban-task-id">{task.taskNumber}</span>
          <h3>{task.title}</h3>
        </div>
        <button type="button" className="icon-button" aria-label="Close task details" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <label className="task-detail-field">
        Status
        <select value={task.status} onChange={handleStatusChange} disabled={!canManage || saving}>
          {["To Do", "In Progress", "In Review", "Done"].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </label>

      <div className="task-detail-section">
        <h4>Description</h4>
        <p>{task.description || "No description provided."}</p>
      </div>

      <div className="task-detail-grid">
        <div><span>Assignee</span><strong>{task.assigneeName}</strong></div>
        <div><span>Reporter</span><strong>{task.reporterName}</strong></div>
        <div><span>Priority</span><strong>{task.priority}</strong></div>
        <div><span>Due Date</span><strong>{formatDueDate(task.dueDate)}</strong></div>
        <div><span>Sprint</span><strong>{task.sprint || "—"}</strong></div>
        <div><span>Type</span><strong>{task.type}</strong></div>
      </div>

      {task.tags?.length > 0 && (
        <div className="task-detail-section">
          <h4><Tag size={14} /> Tags</h4>
          <div className="task-tag-list">
            {task.tags.map((tag) => <span key={tag} className="task-tag">{tag}</span>)}
          </div>
        </div>
      )}

      <div className="task-detail-section">
        <h4>Progress</h4>
        <div className="kanban-task-progress">
          <div className="progress-track"><div className="progress-bar" style={{ width: `${task.progress}%` }} /></div>
          <span>{task.progress}%</span>
        </div>
      </div>

      {task.subtasks?.length > 0 && (
        <div className="task-detail-section">
          <h4><CheckSquare size={14} /> Sub-tasks ({completedSubtasks}/{task.subtasks.length})</h4>
          <ul className="subtask-list">
            {task.subtasks.map((subtask) => (
              <li key={subtask.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(subtask.id)}
                    disabled={!canManage || saving}
                  />
                  <span className={subtask.completed ? "completed" : ""}>{subtask.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="task-detail-section">
        <h4><Calendar size={14} /> Comments</h4>
        <p className="task-comments-count">{task.commentCount} comment{task.commentCount === 1 ? "" : "s"}</p>
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

      <button type="button" className="secondary-button task-full-details" onClick={onOpenFullDetail}>View Full Details</button>
    </aside>
  );
}
