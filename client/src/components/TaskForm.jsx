import React, { useState } from "react";

const STATUS_OPTIONS = ["To Do", "In Progress", "In Review", "Done"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const TYPE_OPTIONS = ["Task", "Bug", "Feature", "Improvement"];
const CATEGORY_OPTIONS = ["Development", "Design", "Testing", "DevOps"];
const IMPACT_OPTIONS = ["Low", "Medium", "High"];
const RISK_OPTIONS = ["Low", "Medium", "High"];
const ENVIRONMENT_OPTIONS = ["Development", "Staging", "Production"];

function buildInitialState(initialValues, projectId, currentUserId) {
  return {
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    projectId: initialValues?.projectId || projectId || "",
    type: initialValues?.type || "Task",
    status: initialValues?.status || "To Do",
    priority: initialValues?.priority || "Medium",
    dueDate: initialValues?.dueDate || "",
    sprint: initialValues?.sprint || "",
    assigneeId: initialValues?.assigneeId || currentUserId || "",
    reporterId: initialValues?.reporterId || currentUserId || "",
    collaborators: initialValues?.collaborators || [],
    estimatedEffortHours: initialValues?.estimatedEffortHours ?? 8,
    tags: initialValues?.tags?.join(", ") || "",
    category: initialValues?.category || "Development",
    impact: initialValues?.impact || "Medium",
    risk: initialValues?.risk || "Medium",
    environment: initialValues?.environment || "Staging",
    relatedEpic: initialValues?.relatedEpic || "",
  };
}

export default function TaskForm({
  project,
  workspace,
  currentUserId,
  initialValues = null,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => buildInitialState(initialValues, project?.id, currentUserId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [collaboratorId, setCollaboratorId] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addCollaborator() {
    if (!collaboratorId || form.collaborators.includes(collaboratorId)) return;
    updateField("collaborators", [...form.collaborators, collaboratorId]);
    setCollaboratorId("");
  }

  function removeCollaborator(userId) {
    updateField("collaborators", form.collaborators.filter((id) => id !== userId));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        sprint: form.sprint || null,
        assigneeId: form.assigneeId || currentUserId,
        collaborators: form.collaborators,
        estimatedEffortHours: Number(form.estimatedEffortHours) || 0,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        category: form.category,
        impact: form.impact,
        risk: form.risk,
        environment: form.environment,
        relatedEpic: form.relatedEpic || null,
      };
      await onSubmit(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const members = workspace?.members || [];

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="task-form-grid">
        <section className="task-form-section">
          <h3>Task Information</h3>
          <label>
            Task Title <span className="required">*</span>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Design API endpoints for account summary"
              maxLength={200}
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Describe the task scope and acceptance criteria…"
              rows={5}
            />
          </label>
          <div className="task-form-row">
            <label>
              Project <span className="required">*</span>
              <input value={project?.name || "—"} disabled />
            </label>
            <label>
              Task Type
              <select value={form.type} onChange={(event) => updateField("type", event.target.value)}>
                {TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <div className="task-form-row">
            <label>
              Status <span className="required">*</span>
              <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Priority <span className="required">*</span>
              <select value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>
                {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <div className="task-form-row">
            <label>
              Due Date <span className="required">*</span>
              <input type="date" value={form.dueDate} onChange={(event) => updateField("dueDate", event.target.value)} />
            </label>
            <label>
              Sprint
              <input
                value={form.sprint}
                onChange={(event) => updateField("sprint", event.target.value)}
                placeholder="Sprint 3 (Current)"
              />
            </label>
          </div>
        </section>

        <aside className="task-form-sidebar">
          <h3>Additional Options</h3>
          <label>
            Category
            <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
              {CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Impact
            <select value={form.impact} onChange={(event) => updateField("impact", event.target.value)}>
              {IMPACT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Risk
            <select value={form.risk} onChange={(event) => updateField("risk", event.target.value)}>
              {RISK_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Environment
            <select value={form.environment} onChange={(event) => updateField("environment", event.target.value)}>
              {ENVIRONMENT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Related Epic
            <input
              value={form.relatedEpic}
              onChange={(event) => updateField("relatedEpic", event.target.value)}
              placeholder="EP-12 Account Management"
            />
          </label>
          <div className="task-form-tip">
            Clear task details, priority and due dates help your team stay focused and deliver quality on time.
          </div>
        </aside>

        <section className="task-form-section task-form-assignment">
          <h3>Assignment &amp; Details</h3>
          <div className="task-form-row">
            <label>
              Assignee <span className="required">*</span>
              <select value={form.assigneeId} onChange={(event) => updateField("assigneeId", event.target.value)}>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>{member.name || member.email}</option>
                ))}
              </select>
            </label>
            <label>
              Reporter
              <select value={form.reporterId} onChange={(event) => updateField("reporterId", event.target.value)} disabled>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>{member.name || member.email}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Collaborators
            <div className="task-form-collaborators">
              {form.collaborators.map((userId) => {
                const member = members.find((item) => item.userId === userId);
                return (
                  <span key={userId} className="collaborator-chip">
                    {member?.name || userId}
                    <button type="button" onClick={() => removeCollaborator(userId)} aria-label="Remove collaborator">×</button>
                  </span>
                );
              })}
              <div className="collaborator-add">
                <select value={collaboratorId} onChange={(event) => setCollaboratorId(event.target.value)}>
                  <option value="">Add collaborator…</option>
                  {members.filter((member) => !form.collaborators.includes(member.userId)).map((member) => (
                    <option key={member.userId} value={member.userId}>{member.name || member.email}</option>
                  ))}
                </select>
                <button type="button" className="secondary-button" onClick={addCollaborator}>Add</button>
              </div>
            </div>
          </label>
          <div className="task-form-row">
            <label>
              Estimated Effort (hours)
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.estimatedEffortHours}
                onChange={(event) => updateField("estimatedEffortHours", event.target.value)}
              />
            </label>
            <label>
              Tags
              <input
                value={form.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                placeholder="Backend, API, Accounts"
              />
            </label>
          </div>
        </section>
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

      <div className="task-form-actions">
        {onCancel && <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Saving…" : initialValues ? "Update task" : "Create task"}
        </button>
      </div>
    </form>
  );
}
