import { useState } from "react";
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AppProviders } from "@/app/AppProviders";
import { routes } from "@/app/routes";

/**
 * HashRouter keeps every route working on static GitHub Pages hosting:
 * "/scoutlink-oc/#/about" always loads index.html, including on refresh.
 *
 * Route changes render synchronously (useTransitions={false}) so that leaving
 * the signed-in area is committed before the session ends; see UserMenu.
 */
export default function App() {
  const [router] = useState(() => createHashRouter(routes));
  return (
    <AppProviders>
      <RouterProvider router={router} useTransitions={false} />
    </AppProviders>
  );
}
