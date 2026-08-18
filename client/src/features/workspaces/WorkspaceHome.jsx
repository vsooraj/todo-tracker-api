import React, { useEffect, useState } from "react";
import Brand from "../../components/Brand";
import { createWorkspace, getWorkspaces } from "../../services/api";

export default function WorkspaceHome({ onSignOut }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkspaces().then(setWorkspaces).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const workspace = await createWorkspace(name);
      setWorkspaces((items) => [...items, workspace]);
      setName("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="workspace-page">
      <header><Brand /><button className="text-button" type="button" onClick={onSignOut}>Sign out</button></header>
      <section className="workspace-content">
        <p className="eyebrow">Kairos workspace</p>
        <h1>{workspaces.length ? "Choose your workspace" : "Create your first workspace"}</h1>
        <p className="workspace-copy">Workspaces keep your projects, members, and tasks together.</p>
        {loading ? <p>Loading workspaces…</p> : <div className="workspace-list">{workspaces.map((workspace) => <article key={workspace.id}><span>{workspace.name.slice(0, 1).toUpperCase()}</span><div><strong>{workspace.name}</strong><small>{workspace.members.length} member · Admin</small></div></article>)}</div>}
        <form className="workspace-form" onSubmit={submit}><label>Workspace name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Apollo Studio" maxLength="100" required /></label>{error && <p className="login-error" role="alert">{error}</p>}<button type="submit">Create workspace</button></form>
      </section>
    </main>
  );
}
