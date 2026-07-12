import type { VehicleStatus, DriverStatus } from "../models/constants.js";

/** Pure business-rules module — the 10 mandatory rules from AGENTS.md live
 *  here and ONLY here. Routes call these; never duplicate a rule inline. */

export interface RuleFailure {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DispatchVehicle {
  status: VehicleStatus;
  maxLoadCapacityKg: number;
}

export interface DispatchDriver {
  status: DriverStatus;
  licenseExpiry: Date;
}

/** Rules 2 & 4: only an AVAILABLE vehicle may be dispatched — this alone
 *  excludes Retired, In Shop, and already On Trip vehicles. */
export function checkVehicleAvailable(vehicle: DispatchVehicle): RuleFailure | null {
  if (vehicle.status !== "AVAILABLE") {
    return {
      code: "VEHICLE_NOT_AVAILABLE",
      message: `Vehicle is ${vehicle.status.replace(/_/g, " ")} and cannot be dispatched.`,
      details: { vehicleStatus: vehicle.status },
    };
  }
  return null;
}

/** Rules 3 & 4: expired license, suspended, or any non-Available driver
 *  (including already On Trip) cannot be assigned. Checked in this order. */
export function checkDriverAssignable(driver: DispatchDriver): RuleFailure | null {
  if (driver.licenseExpiry.getTime() < Date.now()) {
    return {
      code: "DRIVER_LICENSE_EXPIRED",
      message: "Driver's license has expired and cannot be assigned to a trip.",
      details: { licenseExpiry: driver.licenseExpiry.toISOString() },
    };
  }
  if (driver.status === "SUSPENDED") {
    return {
      code: "DRIVER_SUSPENDED",
      message: "Driver is suspended and cannot be assigned to a trip.",
    };
  }
  if (driver.status !== "AVAILABLE") {
    return {
      code: "DRIVER_NOT_AVAILABLE",
      message: `Driver is ${driver.status.replace(/_/g, " ")} and cannot be assigned.`,
      details: { driverStatus: driver.status },
    };
  }
  return null;
}

/** Rule 5: cargo weight must not exceed the vehicle's max load capacity. */
export function checkCapacity(
  vehicle: DispatchVehicle,
  cargoWeightKg: number,
): RuleFailure | null {
  if (cargoWeightKg > vehicle.maxLoadCapacityKg) {
    const excessKg = cargoWeightKg - vehicle.maxLoadCapacityKg;
    return {
      code: "CAPACITY_EXCEEDED",
      message: `Capacity exceeded by ${excessKg} kg — dispatch blocked`,
      details: { capacityKg: vehicle.maxLoadCapacityKg, cargoWeightKg, excessKg },
    };
  }
  return null;
}

/** Combined rules 2-5 in the AGENTS.md dispatch validation order. Shared by
 *  trip creation (when a vehicle/driver is supplied up front) and dispatch. */
export function checkDispatchEligibility(
  vehicle: DispatchVehicle,
  driver: DispatchDriver,
  cargoWeightKg: number,
): RuleFailure | null {
  return (
    checkVehicleAvailable(vehicle) ??
    checkDriverAssignable(driver) ??
    checkCapacity(vehicle, cargoWeightKg)
  );
}
