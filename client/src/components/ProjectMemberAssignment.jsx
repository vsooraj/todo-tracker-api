import React, { useState } from "react";
import { addProjectMember } from "../services/api";

export default function ProjectMemberAssignment({ project, workspace, onMemberAdded }) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableMembers = (workspace?.members || []).filter(
    (member) => !project.members.some((projectMember) => projectMember.userId === member.userId)
  );

  async function handleAssign(event) {
    event.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    setError("");
    try {
      const result = await addProjectMember(project.id, selectedUserId);
      onMemberAdded(result.project);
      setSelectedUserId("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (availableMembers.length === 0) {
    return (
      <div className="project-members-panel">
        <h4>Project team</h4>
        <p className="project-members-copy">All workspace members are already on this project.</p>
      </div>
    );
  }

  return (
    <div className="project-members-panel">
      <h4>Assign team member</h4>
      <form className="project-member-form" onSubmit={handleAssign}>
        <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} required>
          <option value="">Select a workspace member</option>
          {availableMembers.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name || member.email || member.userId} ({member.role})
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading}>{loading ? "Assigning…" : "Add to project"}</button>
      </form>
      {error && <p className="login-error" role="alert">{error}</p>}
    </div>
  );
}
