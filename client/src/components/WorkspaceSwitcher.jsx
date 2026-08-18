import React, { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import WorkspacePreview from "./WorkspacePreview";

export default function WorkspaceSwitcher({
  workspaces,
  activeWorkspace,
  onSwitch,
  onCreateClick,
}) {
  const [open, setOpen] = useState(false);

  if (!activeWorkspace) return null;

  return (
    <div className="workspace-switcher">
      <button type="button" className="workspace-switcher-trigger" onClick={() => setOpen((value) => !value)}>
        {activeWorkspace.logoUrl ? (
          <img src={activeWorkspace.logoUrl} alt="" className="workspace-switcher-logo" />
        ) : (
          <span className="workspace-switcher-logo fallback">{activeWorkspace.name.slice(0, 1)}</span>
        )}
        <div className="workspace-switcher-copy">
          <strong>{activeWorkspace.name}</strong>
          <small>{activeWorkspace.workspaceUrl}</small>
        </div>
        <ChevronDown size={16} />
      </button>

      {open && (
        <>
          <button type="button" className="workspace-switcher-overlay" aria-label="Close workspace menu" onClick={() => setOpen(false)} />
          <div className="workspace-switcher-menu">
            <p className="workspace-switcher-label">Switch workspace</p>
            <div className="workspace-switcher-list">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  className={workspace.id === activeWorkspace.id ? "workspace-switcher-item active" : "workspace-switcher-item"}
                  onClick={() => {
                    onSwitch(workspace.id);
                    setOpen(false);
                  }}
                >
                  <WorkspacePreview workspace={workspace} compact />
                </button>
              ))}
            </div>
            <button type="button" className="workspace-switcher-create" onClick={() => { onCreateClick(); setOpen(false); }}>
              <Plus size={16} />
              Create Organisation
            </button>
          </div>
        </>
      )}
    </div>
  );
}
