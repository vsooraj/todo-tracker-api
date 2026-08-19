import React, { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import AuthGate from "./features/auth/AuthGate";
import LoginPage from "./pages/LoginPage";

function BasicAuthApp() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem("basic-authenticated") === "true");
  const signOut = () => { sessionStorage.removeItem("basic-authenticated"); sessionStorage.removeItem("basic-authorization"); setAuthenticated(false); };
  const signIn = () => { sessionStorage.setItem("basic-authenticated", "true"); setAuthenticated(true); };
  return authenticated ? <AuthGate basicAuth onSignOut={signOut} /> : <LoginPage basicAuth onAuthenticated={signIn} />;
}

export default function App({ basicAuthEnabled = false }) {
  React.useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = '/favicon.ico';
    document.head.appendChild(link);
  }, []);

  if (basicAuthEnabled) return <BasicAuthApp />;

  return (
    <>
      <SignedOut><LoginPage /></SignedOut>
      <SignedIn><AuthGate /></SignedIn>
    </>
  );
}