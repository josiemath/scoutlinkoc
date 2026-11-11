import { useState } from "react";
import { createHashRouter, RouterProvider } from "react-router";
import { AppProviders } from "@/app/AppProviders";
import { routes } from "@/app/routes";

/**
 * HashRouter keeps every route working on static GitHub Pages hosting:
 * "/scoutlink-oc/#/about" always loads index.html, including on refresh.
 */
export default function App() {
  const [router] = useState(() => createHashRouter(routes));
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
