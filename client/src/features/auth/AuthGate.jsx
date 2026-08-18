import React from "react";
import WorkspaceGate from "../workspaces/WorkspaceGate";

export default function AuthGate({ basicAuth = false, onSignOut }) {
  if (basicAuth) return <WorkspaceGate onSignOut={onSignOut} />;

  return (
    <main className="signed-in">
      <div>
        <h1>You’re signed in.</h1>
        <p>Your Kairos workspace is ready.</p>
      </div>
    </main>
  );
}
