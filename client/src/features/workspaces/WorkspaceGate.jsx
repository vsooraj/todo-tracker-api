import React, { useCallback, useEffect, useMemo, useState } from "react";
import CreateOrganisationModal from "../../components/CreateOrganisationModal";
import DashboardApp from "../dashboard/DashboardApp";
import { activateWorkspace, getWorkspaces } from "../../services/api";

export default function WorkspaceGate({ onSignOut }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => sessionStorage.getItem("active-workspace-id") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await getWorkspaces();
      setWorkspaces(items);

      if (items.length === 0) {
        setActiveWorkspaceId("");
        sessionStorage.removeItem("active-workspace-id");
        setShowCreateModal(true);
        return;
      }

      const preferred = items.find((workspace) => workspace.id === activeWorkspaceId) || items.find((workspace) => workspace.isActive) || items[0];
      setActiveWorkspaceId(preferred.id);
      sessionStorage.setItem("active-workspace-id", preferred.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId]
  );

  async function handleSwitch(workspaceId) {
    if (workspaceId === activeWorkspaceId) return;
    try {
      const workspace = await activateWorkspace(workspaceId);
      setActiveWorkspaceId(workspace.id);
      sessionStorage.setItem("active-workspace-id", workspace.id);
      setWorkspaces((items) => items.map((item) => ({
        ...item,
        isActive: item.id === workspace.id,
      })));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleCreated(workspace) {
    setWorkspaces((items) => [...items, { ...workspace, isActive: true }]);
    setActiveWorkspaceId(workspace.id);
    sessionStorage.setItem("active-workspace-id", workspace.id);
    setShowCreateModal(false);
  }

  if (loading) {
    return <main className="workspace-setup-page"><p>Loading your organisations…</p></main>;
  }

  if (error) {
    return (
      <main className="workspace-setup-page">
        <p className="dashboard-error" role="alert">{error}</p>
        <button type="button" className="primary-button" onClick={loadWorkspaces}>Retry</button>
      </main>
    );
  }

  const needsSetup = workspaces.length === 0;

  return (
    <>
      {needsSetup ? (
        <main className="workspace-setup-page">
          <div className="workspace-setup-copy">
            <p className="eyebrow">Welcome to Kairos</p>
            <h1>Create your organisation</h1>
            <p>Set up a workspace to manage projects, members, and tasks with your team.</p>
          </div>
        </main>
      ) : (
        <DashboardApp
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onSwitchWorkspace={handleSwitch}
          onCreateOrganisation={() => setShowCreateModal(true)}
          onSignOut={onSignOut}
        />
      )}

      <CreateOrganisationModal
        open={needsSetup || showCreateModal}
        required={needsSetup}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
