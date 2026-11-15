import { useOutletContext } from "react-router";
import type { Account } from "@/lib/account";

export interface AppOutletContext {
  account: Account;
}

/** The signed-in account, available to every page inside the authenticated layout. */
export function useAppAccount(): Account {
  return useOutletContext<AppOutletContext>().account;
}

/**
 * Who may open a page inside the authenticated layout. The database enforces
 * the same rules; these only decide what to show.
 * - member: any signed-in account, including suspended ones (to see their status)
 * - editable: pending or verified accounts
 * - admin: verified council or platform administrators
 */
export type RouteAccess = "member" | "editable" | "admin";

export interface AppRouteHandle {
  access?: RouteAccess;
}
