import React from "react";
import { UserButton } from "@clerk/clerk-react";
import Brand from "../../components/Brand";
import WorkspaceHome from "../workspaces/WorkspaceHome";

export default function AuthGate({ basicAuth = false, onSignOut }) {
  if (basicAuth) return <WorkspaceHome onSignOut={onSignOut} />;
  return <main className="signed-in"><div><Brand /><h1>You’re signed in.</h1><p>Your Kairos workspace is ready.</p></div>{basicAuth ? <button className="local-sign-out" type="button" onClick={onSignOut}>Sign out</button> : <UserButton afterSignOutUrl="/" />}</main>;
}
