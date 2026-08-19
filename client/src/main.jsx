import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles.css";
import favicon from "./favicon.ico"; // Import the favicon

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Root() {
  if (!publishableKey) {
    return <App basicAuthEnabled />;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  );
}

function addFavicon() {
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = favicon;
  document.head.appendChild(link);
}

addFavicon(); // Call the function to add the favicon

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
);