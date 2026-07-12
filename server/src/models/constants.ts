/** Enum constants per AGENTS.md API contract — the client mirrors these in
 *  client/src/lib/types.ts. Change the contract first, then both files. */

export const ROLES = [
  "FLEET_MANAGER",
  "DISPATCHER",
  "SAFETY_OFFICER",
  "FINANCIAL_ANALYST",
] as const;
export type Role = (typeof ROLES)[number];

export const VEHICLE_TYPES = ["VAN", "TRUCK", "MINI", "BIKE"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_STATUSES = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const DRIVER_STATUSES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const LICENSE_CATEGORIES = ["LMV", "HMV"] as const;
export type LicenseCategory = (typeof LICENSE_CATEGORIES)[number];

export const TRIP_STATUSES = ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const MAINTENANCE_STATUSES = ["ACTIVE", "COMPLETED"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const EXPENSE_CATEGORIES = ["TOLL", "MISC"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
