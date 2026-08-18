import React, { useState } from "react";
import { SignIn } from "@clerk/clerk-react";
import Brand from "../components/Brand";
import LoginIllustration from "../components/LoginIllustration";
import { loginWithBasicCredentials } from "../services/api";

function BasicSignInForm({ onAuthenticated }) {
  const [email, setEmail] = useState("demo@todotracker.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await loginWithBasicCredentials(email, password);
      onAuthenticated();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="basic-auth-form" onSubmit={submit}>
      <div className="login-divider"><span />or<span /></div>
      <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      {error && <p className="login-error" role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign In"}</button>
      <p className="demo-note">Development demo: <code>demo@todotracker.local</code> / <code>Password123!</code></p>
    </form>
  );
}

export default function LoginPage({ basicAuth = false, onAuthenticated }) {
  return (
    <main className="auth-page">
      <section className="sign-in-panel"><div className="form-wrap"><Brand /><h1>Welcome Back! <span aria-hidden="true">👋</span></h1><p className="subtitle">Sign in to your account to continue</p>{basicAuth ? <BasicSignInForm onAuthenticated={onAuthenticated} /> : <SignIn routing="hash" signUpUrl="#/sign-up" fallbackRedirectUrl="/" />}</div></section>
      <LoginIllustration />
    </main>
  );
}
