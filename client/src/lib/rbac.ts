import type { Role } from "./types";

/** Mirrors the RBAC matrix in AGENTS.md — nav visibility only; the server is
 *  the authority on writes. */

export type Module =
  | "dashboard"
  | "fleet"
  | "drivers"
  | "trips"
  | "maintenance"
  | "expenses"
  | "analytics"
  | "settings";

export type Access = "full" | "view" | null;

const MATRIX: Record<Role, Record<Module, Access>> = {
  FLEET_MANAGER: {
    dashboard: "view",
    fleet: "full",
    drivers: "full",
    trips: "view",
    maintenance: "full",
    expenses: "view",
    analytics: "view",
    settings: "view",
  },
  DISPATCHER: {
    dashboard: "view",
    fleet: "view",
    drivers: "view",
    trips: "full",
    maintenance: "view",
    expenses: "view",
    analytics: null,
    settings: "view",
  },
  SAFETY_OFFICER: {
    dashboard: "view",
    fleet: "view",
    drivers: "full",
    trips: "view",
    maintenance: "view",
    expenses: null,
    analytics: null,
    settings: "view",
  },
  FINANCIAL_ANALYST: {
    dashboard: "view",
    fleet: "view",
    drivers: "view",
    trips: "view",
    maintenance: "view",
    expenses: "full",
    analytics: "full",
    settings: "view",
  },
};

export function can(role: Role, module: Module): Access {
  return MATRIX[role][module];
}
