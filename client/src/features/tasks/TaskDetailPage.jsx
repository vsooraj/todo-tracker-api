import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  MessageSquare,
  Paperclip,
  Star,
  Tag,
} from "lucide-react";
import TaskForm from "../../components/TaskForm";
import {
  addTaskComment,
  createTask,
  getTaskDetail,
  updateTask,
} from "../../services/api";

const TABS = [
  { id: "details", label: "Details" },
  { id: "subtasks", label: "Sub-tasks" },
  { id: "comments", label: "Comments" },
  { id: "files", label: "Files" },
  { id: "activity", label: "Activity" },
];

function formatDueDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatRelativeTime(value) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `Yesterday, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function ActivityFeed({ activity }) {
  if (!activity?.length) return <p className="task-empty-state">No activity yet.</p>;
  return (
    <ul className="task-activity-feed">
      {activity.map((entry) => (
        <li key={entry.id}>
          <div className="activity-dot" />
          <div>
            <strong>{entry.userName}</strong>
            <span> {entry.action}</span>
            {entry.detail && <p>{entry.detail}</p>}
            <small>{formatRelativeTime(entry.createdAt)}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CommentsPanel({ comments, canManage, onSubmitComment }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSubmitComment(content.trim());
      setContent("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="task-comments-panel">
      {comments.length === 0 ? (
        <p className="task-empty-state">No comments yet. Start the discussion.</p>
      ) : (
        <ul className="task-comments-list">
          {comments.map((comment) => (
            <li key={comment.id}>
              <span className="kanban-avatar">{comment.authorName.slice(0, 1)}</span>
              <div>
                <div className="comment-meta">
                  <strong>{comment.authorName}</strong>
                  <span>{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p>{comment.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <form className="task-comment-form" onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a comment…"
            rows={3}
          />
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button" disabled={saving || !content.trim()}>
            {saving ? "Posting…" : "Add comment"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function TaskDetailPage({
  taskId,
  project,
  workspace,
  currentUserId,
  canManage,
  siblingTaskIds = [],
  onBack,
  onNavigateTask,
  onUpdated,
}) {
  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      setError("");
      try {
        const data = await getTaskDetail(taskId);
        setDetail(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [taskId]);

  const task = detail?.task;
  const comments = detail?.comments || [];
  const activity = detail?.activity || [];

  const currentIndex = useMemo(
    () => siblingTaskIds.indexOf(taskId),
    [siblingTaskIds, taskId]
  );

  const completedSubtasks = task?.completedSubtasks ?? 0;
  const totalSubtasks = task?.totalSubtasks ?? 0;
  const estimatedMinutes = (task?.estimatedEffortHours || 0) * 60;
  const loggedMinutes = task?.timeLoggedMinutes || 0;
  const remainingMinutes = Math.max(estimatedMinutes - loggedMinutes, 0);

  async function refreshDetail() {
    const data = await getTaskDetail(taskId);
    setDetail(data);
    if (onUpdated) onUpdated(data.task);
    return data;
  }

  async function handleSubtaskToggle(subtaskId) {
    if (!canManage || !task) return;
    setSaving(true);
    try {
      const subtasks = task.subtasks.map((item) => (
        item.id === subtaskId ? { ...item, completed: !item.completed, status: !item.completed ? "Done" : "To Do" } : item
      ));
      const completedCount = subtasks.filter((item) => item.completed).length;
      const progress = subtasks.length ? Math.round((completedCount / subtasks.length) * 100) : task.progress;
      await updateTask(task.id, { subtasks, progress });
      await refreshDetail();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(event) {
    if (!task) return;
    setSaving(true);
    try {
      await updateTask(task.id, { status: event.target.value });
      await refreshDetail();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleComment(content) {
    await addTaskComment(taskId, content);
    await refreshDetail();
  }

  async function handleCreateOrUpdate(payload) {
    if (task) {
      await updateTask(task.id, payload);
      setShowEditForm(false);
      await refreshDetail();
      return;
    }
    const created = await createTask(project.id, payload);
    if (onUpdated) onUpdated(created);
    onBack();
  }

  if (loading) return <p className="dashboard-loading">Loading task details…</p>;
  if (error && !task) return <div className="dashboard-error"><p>{error}</p><button type="button" className="secondary-button" onClick={onBack}>Go back</button></div>;
  if (!task) return null;

  const tabCounts = {
    subtasks: `${completedSubtasks}/${totalSubtasks}`,
    comments: String(comments.length),
    files: "0",
  };

  return (
    <section className="task-detail-page">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to project
      </button>

      <div className="task-detail-header">
        <div>
          <p className="project-breadcrumb">
            Projects &gt; {project.name} &gt; Task {task.taskNumber}
          </p>
          <div className="task-detail-title-row">
            <span className="task-detail-icon"><CheckSquare size={18} /></span>
            <span className="kanban-task-id">{task.taskNumber}</span>
            <Star size={16} className="task-star-icon" />
            <h1>{task.title}</h1>
          </div>
          <div className="task-detail-badges">
            <span className={`status-pill compact status-${statusClass(task.status)}`}>{task.status}</span>
            <span className={`priority-chip priority-${task.priority.toLowerCase()}`}>{task.priority} Priority</span>
            <span className="task-badge"><Calendar size={14} /> {formatDueDate(task.dueDate)}</span>
            {task.sprint && <span className="task-badge sprint">{task.sprint}</span>}
            {(task.tags || []).map((tag) => <span key={tag} className="task-tag">{tag}</span>)}
          </div>
        </div>
        <div className="task-detail-header-actions">
          {canManage && (
            <button type="button" className="secondary-button" onClick={() => setShowEditForm((value) => !value)}>
              <Edit3 size={16} />
              {showEditForm ? "Close edit" : "Edit task"}
            </button>
          )}
          {siblingTaskIds.length > 1 && (
            <div className="task-nav-buttons">
              <button
                type="button"
                className="icon-button"
                disabled={currentIndex <= 0}
                onClick={() => onNavigateTask?.(siblingTaskIds[currentIndex - 1])}
                aria-label="Previous task"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={currentIndex >= siblingTaskIds.length - 1}
                onClick={() => onNavigateTask?.(siblingTaskIds[currentIndex + 1])}
                aria-label="Next task"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showEditForm && canManage && (
        <div className="task-form-modal">
          <TaskForm
            project={project}
            workspace={workspace}
            currentUserId={currentUserId}
            initialValues={task}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      )}

      <div className="task-detail-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? "project-tab active" : "project-tab"}
            onClick={() => setActiveTab(id)}
          >
            {label}
            {tabCounts[id] && <span className="tab-count">{tabCounts[id]}</span>}
          </button>
        ))}
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

      <div className="task-detail-body">
        <div className="task-detail-main">
          {activeTab === "details" && (
            <>
              <div className="task-detail-top-grid">
                <div className="task-detail-description">
                  <h3>Description</h3>
                  <p>{task.description || "No description provided."}</p>
                </div>
                <div className="task-progress-card">
                  <h3>Progress</h3>
                  <div className="kanban-task-progress">
                    <div className="progress-track"><div className="progress-bar" style={{ width: `${task.progress}%` }} /></div>
                    <span>{task.progress}%</span>
                  </div>
                  {totalSubtasks > 0 && (
                    <p>{completedSubtasks} of {totalSubtasks} sub-tasks completed</p>
                  )}
                </div>
              </div>

              <div className="task-detail-meta-grid">
                <div className="task-meta-column">
                  <div><span>Project</span><strong>{task.projectName || project.name}</strong></div>
                  <div><span>Task Type</span><strong>{task.type}</strong></div>
                  <div><span>Assignee</span><strong>{task.assigneeName}</strong></div>
                  <div><span>Reporter</span><strong>{task.reporterName}</strong></div>
                  {(task.tags || []).length > 0 && (
                    <div className="task-meta-tags">
                      <span>Tags</span>
                      <div className="task-tag-list">
                        {task.tags.map((tag) => <span key={tag} className="task-tag">{tag}</span>)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="task-meta-column">
                  <label className="task-inline-field">
                    Status
                    <select value={task.status} onChange={handleStatusChange} disabled={!canManage || saving}>
                      {["To Do", "In Progress", "In Review", "Done"].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <div><span>Priority</span><strong>{task.priority}</strong></div>
                  <div><span>Due Date</span><strong>{formatDueDate(task.dueDate)}</strong></div>
                  <div><span>Sprint</span><strong>{task.sprint || "—"}</strong></div>
                  <div><span>Estimated Effort</span><strong>{task.estimatedEffortHours || 0} Hours</strong></div>
                  <div><span>Time Logged</span><strong>{formatMinutes(loggedMinutes)}</strong></div>
                </div>
                <div className="task-meta-widgets">
                  <div className="task-time-widget">
                    <h4><Clock size={14} /> Time Tracking</h4>
                    <div><span>Logged</span><strong>{formatMinutes(loggedMinutes)}</strong></div>
                    <div><span>Remaining</span><strong>{formatMinutes(remainingMinutes)}</strong></div>
                    <div><span>Total</span><strong>{formatMinutes(estimatedMinutes)}</strong></div>
                  </div>
                  {(task.blocks?.length > 0 || task.dependsOn?.length > 0) && (
                    <div className="task-deps-widget">
                      <h4>Dependencies</h4>
                      {task.blocks?.length > 0 && (
                        <div><span>Blocks</span><strong>{task.blocks.join(", ")}</strong></div>
                      )}
                      {task.dependsOn?.length > 0 && (
                        <div><span>Blocked by</span><strong>{task.dependsOn.join(", ")}</strong></div>
                      )}
                    </div>
                  )}
                  <div className="task-side-meta">
                    <div><span>Category</span><strong>{task.category || "—"}</strong></div>
                    <div><span>Impact</span><strong>{task.impact || "—"}</strong></div>
                    <div><span>Risk</span><strong>{task.risk || "—"}</strong></div>
                    <div><span>Environment</span><strong>{task.environment || "—"}</strong></div>
                    {task.relatedEpic && <div><span>Related Epic</span><strong>{task.relatedEpic}</strong></div>}
                  </div>
                </div>
              </div>

              {totalSubtasks > 0 && (
                <div className="task-subtasks-preview">
                  <h3>Sub-tasks ({completedSubtasks} / {totalSubtasks} completed)</h3>
                  <table className="subtask-table">
                    <thead>
                      <tr>
                        <th>Sub-task</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {task.subtasks.map((subtask) => (
                        <tr key={subtask.id}>
                          <td>
                            <label>
                              <input
                                type="checkbox"
                                checked={subtask.completed}
                                onChange={() => handleSubtaskToggle(subtask.id)}
                                disabled={!canManage || saving}
                              />
                              <span className={subtask.completed ? "completed" : ""}>{subtask.title}</span>
                            </label>
                          </td>
                          <td><span className={`status-pill compact status-${statusClass(subtask.status || "To Do")}`}>{subtask.status || "To Do"}</span></td>
                          <td>{formatDueDate(subtask.dueDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === "subtasks" && (
            <div className="task-subtasks-tab">
              <h3>Sub-tasks ({completedSubtasks} / {totalSubtasks} completed)</h3>
              {totalSubtasks === 0 ? (
                <p className="task-empty-state">No sub-tasks yet.</p>
              ) : (
                <table className="subtask-table">
                  <thead>
                    <tr>
                      <th>Sub-task</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {task.subtasks.map((subtask) => (
                      <tr key={subtask.id}>
                        <td>
                          <label>
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => handleSubtaskToggle(subtask.id)}
                              disabled={!canManage || saving}
                            />
                            <span className={subtask.completed ? "completed" : ""}>{subtask.title}</span>
                          </label>
                        </td>
                        <td><span className={`status-pill compact status-${statusClass(subtask.status || "To Do")}`}>{subtask.status || "To Do"}</span></td>
                        <td>{formatDueDate(subtask.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <CommentsPanel comments={comments} canManage={canManage} onSubmitComment={handleComment} />
          )}

          {activeTab === "files" && (
            <div className="task-files-tab">
              <Paperclip size={32} />
              <p>File attachments are coming soon.</p>
            </div>
          )}

          {activeTab === "activity" && <ActivityFeed activity={activity} />}
        </div>

        <aside className="task-detail-sidebar-panel">
          <div className="task-sidebar-section">
            <div className="task-sidebar-heading">
              <h3>Activity</h3>
              <button type="button" className="text-button" onClick={() => setActiveTab("activity")}>View all</button>
            </div>
            <ActivityFeed activity={activity.slice(0, 5)} />
          </div>
          <div className="task-sidebar-section">
            <div className="task-sidebar-heading">
              <h3><MessageSquare size={14} /> Comments</h3>
              <button type="button" className="text-button" onClick={() => setActiveTab("comments")}>Add comment</button>
            </div>
            <CommentsPanel comments={comments.slice(-3)} canManage={canManage} onSubmitComment={handleComment} />
          </div>
        </aside>
      </div>
    </section>
  );
}
