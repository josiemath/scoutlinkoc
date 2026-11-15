import { render } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AppProviders } from "@/app/AppProviders";
import { routes } from "@/app/routes";

/** Renders the real route table at a given path, inside the real app providers. */
export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(
    <AppProviders>
      <RouterProvider router={router} useTransitions={false} />
    </AppProviders>
  );
  return { router, ...utils };
}
