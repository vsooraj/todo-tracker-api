import React from "react";
import { FolderKanban, Users } from "lucide-react";

export default function WorkspacePreview({ workspace, compact = false }) {
  if (!workspace) return null;

  const initials = workspace.name.slice(0, 1).toUpperCase();

  return (
    <div className={`workspace-preview ${compact ? "compact" : ""}`}>
      {!compact && <p className="workspace-preview-label">Workspace Preview</p>}
      <div className="workspace-preview-card">
        <div className="workspace-preview-main">
          {workspace.logoUrl ? (
            <img src={workspace.logoUrl} alt="" className="workspace-preview-logo" />
          ) : (
            <div className="workspace-preview-logo fallback">{initials}</div>
          )}
          <div className="workspace-preview-copy">
            <strong>{workspace.name || "Organisation name"}</strong>
            <span>{workspace.workspaceUrl || `${workspace.slug || "my-org"}.kairos.app`}</span>
          </div>
          <span className="workspace-preview-status">{workspace.status || "Active"}</span>
        </div>
        <div className="workspace-preview-meta">
          <span><FolderKanban size={14} /> {workspace.projectCount ?? 0} Projects</span>
          <span><Users size={14} /> {workspace.memberCount ?? workspace.members?.length ?? 1} Members</span>
        </div>
      </div>
    </div>
  );
}
