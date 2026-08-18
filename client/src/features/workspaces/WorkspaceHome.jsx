import React, { useEffect, useMemo, useState } from "react";
import Brand from "../../components/Brand";
import MemberInvitations from "../../components/MemberInvitations";
import { activateWorkspace, createWorkspace, getWorkspaces, getPendingInvitations, acceptInvitation } from "../../services/api";

export default function WorkspaceHome({ onSignOut }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(() => sessionStorage.getItem("active-workspace-id") || "");
  const [switchingWorkspaceId, setSwitchingWorkspaceId] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [currentUserId] = useState(() => sessionStorage.getItem("user-id") || "demo-user");
  const [acceptingInviteId, setAcceptingInviteId] = useState(null);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || workspaces[0] || null,
    [selectedWorkspaceId, workspaces]
  );

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const items = await getWorkspaces();
        setWorkspaces(items);

        if (items.length === 0) {
          setSelectedWorkspaceId("");
          return;
        }

        const preferred = items.find((workspace) => workspace.id === selectedWorkspaceId) || items[0];
        setSelectedWorkspaceId(preferred.id);
        sessionStorage.setItem("active-workspace-id", preferred.id);

        // Load pending invitations
        try {
          const invites = await getPendingInvitations();
          setPendingInvitations(invites || []);
        } catch (invitationError) {
          console.error("Could not load invitations:", invitationError.message);
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaces();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const workspace = await createWorkspace(name);
      setWorkspaces((items) => [...items, workspace]);
      setSelectedWorkspaceId(workspace.id);
      sessionStorage.setItem("active-workspace-id", workspace.id);
      setName("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function switchWorkspace(workspaceId) {
    if (workspaceId === selectedWorkspaceId) return;
    setError("");
    setSwitchingWorkspaceId(workspaceId);
    try {
      const workspace = await activateWorkspace(workspaceId);
      setSelectedWorkspaceId(workspace.id);
      sessionStorage.setItem("active-workspace-id", workspace.id);
      setWorkspaces((items) => items.map((item) => ({ ...item, active: item.id === workspace.id })));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSwitchingWorkspaceId(null);
    }
  }

  async function acceptInvite(invitationId) {
    setError("");
    setAcceptingInviteId(invitationId);
    try {
      const result = await acceptInvitation(invitationId);
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      setWorkspaces((prev) => [...prev, result.workspace]);
      if (!selectedWorkspaceId) {
        setSelectedWorkspaceId(result.workspace.id);
        sessionStorage.setItem("active-workspace-id", result.workspace.id);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAcceptingInviteId(null);
    }
  }

  return (
    <main className="workspace-page">
      <header>
        <Brand />
        <button className="text-button" type="button" onClick={onSignOut}>Sign out</button>
      </header>
      <section className="workspace-content">
        <p className="eyebrow">Kairos workspace</p>
        <div className="workspace-header-panel">
          <div>
            <h1>{workspaces.length ? (activeWorkspace ? `Workspace: ${activeWorkspace.name}` : "Choose your workspace") : "Create your first workspace"}</h1>
            <p className="workspace-copy">Workspaces keep your projects, members, and tasks together.</p>
          </div>
          {activeWorkspace && (
            <span className="workspace-summary-badge">{activeWorkspace.members?.length || 1} members</span>
          )}
        </div>

        {switchingWorkspaceId && (
          <div className="workspace-switch-banner" role="status">
            Switching to {workspaces.find((workspace) => workspace.id === switchingWorkspaceId)?.name || "workspace"}…
          </div>
        )}

        {pendingInvitations.length > 0 && (
          <div className="pending-invitations-section">
            <div className="invitations-header">
              <h3>Workspace Invitations</h3>
              <p>You've been invited to join these workspaces.</p>
            </div>
            <div className="invitations-grid">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="invitation-card">
                  <div className="invitation-card-body">
                    <p className="invitation-text">Join <strong>{invitation.workspaceId}</strong></p>
                    <small className="invitation-date">
                      Invited {new Date(invitation.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="invitation-accept-btn"
                    onClick={() => acceptInvite(invitation.id)}
                    disabled={acceptingInviteId === invitation.id}
                  >
                    {acceptingInviteId === invitation.id ? "Accepting…" : "Accept"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p>Loading workspaces…</p>
        ) : (
          <div className="workspace-list">
            {workspaces.map((workspace) => {
              const isActive = workspace.id === selectedWorkspaceId;
              const isSwitching = switchingWorkspaceId === workspace.id;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  className={isActive ? "workspace-card active" : "workspace-card"}
                  onClick={() => switchWorkspace(workspace.id)}
                  aria-pressed={isActive}
                  disabled={isSwitching || isActive}
                >
                  <span className="workspace-card-mark">{workspace.name.slice(0, 1).toUpperCase()}</span>
                  <div className="workspace-card-body">
                    <div className="workspace-card-header">
                      <strong>{workspace.name}</strong>
                      <span className={isActive ? "workspace-badge active" : "workspace-badge"}>{isActive ? "Active" : isSwitching ? "Switching…" : "Select"}</span>
                    </div>
                    <small>{workspace.members?.length || 1} member</small>
                    <div className="workspace-card-meta">{isActive ? "Current workspace" : isSwitching ? "Switching workspace…" : "Open workspace"}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {activeWorkspace && <MemberInvitations workspace={activeWorkspace} currentUserId={currentUserId} />}

        <form className="workspace-form" onSubmit={submit}>
          <label>
            Workspace name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Apollo Studio" maxLength="100" required />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit">Create workspace</button>
        </form>
      </section>
    </main>
  );
}
