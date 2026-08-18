import React, { useState } from "react";

const statusOptions = ["Planning", "Active", "Completed"];
const priorityOptions = ["Low", "Medium", "High"];

export default function ProjectForm({ workspaceId, onSubmit, onCancel, initialValues = null }) {
  const [name, setName] = useState(initialValues?.name || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [status, setStatus] = useState(initialValues?.status || "Planning");
  const [priority, setPriority] = useState(initialValues?.priority || "Medium");
  const [startDate, setStartDate] = useState(initialValues?.startDate || "");
  const [endDate, setEndDate] = useState(initialValues?.endDate || "");
  const [progress, setProgress] = useState(initialValues?.progress ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = initialValues
        ? { name, description, status, priority, startDate: startDate || null, endDate: endDate || null, progress: Number(progress) }
        : { workspaceId, name, description, status, priority, startDate: startDate || null, endDate: endDate || null };
      await onSubmit(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <label>
        Project name
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Website Redesign" maxLength="120" required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this project about?" rows="3" />
      </label>
      <div className="project-form-row">
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Priority
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            {priorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <div className="project-form-row">
        <label>
          Start date
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          End date
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
      </div>
      {initialValues && (
        <label>
          Progress ({progress}%)
          <input type="range" min="0" max="100" value={progress} onChange={(event) => setProgress(event.target.value)} />
        </label>
      )}
      {error && <p className="login-error" role="alert">{error}</p>}
      <div className="project-form-actions">
        {onCancel && <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>}
        <button type="submit" disabled={loading}>{loading ? "Saving…" : initialValues ? "Update project" : "Create project"}</button>
      </div>
    </form>
  );
}
