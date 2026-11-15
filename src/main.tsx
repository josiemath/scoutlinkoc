import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { captureAuthRedirect } from "./lib/auth-redirect";

// Email links land on "?code=…"; move that out of the URL before the router reads it.
captureAuthRedirect();

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root is missing from index.html.");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
