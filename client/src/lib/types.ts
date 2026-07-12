/** Mirrors the binding API contract in AGENTS.md — change the contract first. */

export type Role =
  | "FLEET_MANAGER"
  | "DISPATCHER"
  | "SAFETY_OFFICER"
  | "FINANCIAL_ANALYST";

export type VehicleType = "VAN" | "TRUCK" | "MINI" | "BIKE";
export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED";
export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";
export type LicenseCategory = "LMV" | "HMV";
export type TripStatus = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
export type MaintenanceStatus = "ACTIVE" | "COMPLETED";
export type ExpenseCategory = "TOLL" | "MISC";

export const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  FLEET_MANAGER: "Vehicles, maintenance, and fleet health",
  DISPATCHER: "Trips, dispatch, and the live board",
  SAFETY_OFFICER: "Drivers, licenses, and compliance",
  FINANCIAL_ANALYST: "Fuel, expenses, and analytics",
};

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Vehicle {
  _id: string;
  registrationNumber: string;
  name: string;
  type: VehicleType;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  _id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  tripCompletionRate: number;
  status: DriverStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  _id: string;
  code: string;
  source: string;
  destination: string;
  vehicle: Vehicle | null;
  driver: Driver | null;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  status: TripStatus;
  revenue: number | null;
  startOdometer: number | null;
  endOdometer: number | null;
  fuelUsedL: number | null;
  cancelReason: string | null;
  dispatchedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardKpis {
  activeVehicles: number;
  availableVehicles: number;
  inMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPct: number;
  vehicleStatusBreakdown: Record<VehicleStatus, number>;
  recentTrips: Trip[];
}
