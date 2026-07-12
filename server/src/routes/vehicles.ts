import { Router } from "express";
import { z } from "zod";
import { fail, ok } from "../lib/respond.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  Vehicle,
  MaintenanceLog,
  FuelLog,
  VEHICLE_TYPES,
  VEHICLE_STATUSES,
} from "../models/index.js";

const router = Router();

const createSchema = z.object({
  registrationNumber: z.string().trim().min(1, "Registration number is required."),
  name: z.string().trim().min(1, "Name is required."),
  type: z.enum(VEHICLE_TYPES),
  maxLoadCapacityKg: z.number().positive("Max load capacity must be greater than 0."),
  odometerKm: z.number().min(0).optional(),
  acquisitionCost: z.number().min(0, "Acquisition cost cannot be negative."),
  region: z.string().trim().optional(),
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(VEHICLE_STATUSES).optional(),
});

router.get("/dispatchable", requireAuth, async (_req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ status: "AVAILABLE" }).sort({ name: 1 });
    ok(res, vehicles);
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { type, status, region, q } = req.query;
    const filter: Record<string, unknown> = {};

    if (typeof type === "string" && (VEHICLE_TYPES as readonly string[]).includes(type)) {
      filter.type = type;
    }
    if (typeof status === "string" && (VEHICLE_STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }
    if (typeof region === "string" && region.trim() !== "") {
      filter.region = region;
    }
    if (typeof q === "string" && q.trim() !== "") {
      const pattern = new RegExp(q.trim(), "i");
      filter.$or = [{ registrationNumber: pattern }, { name: pattern }];
    }

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    ok(res, vehicles);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      fail(res, 404, "NOT_FOUND", "Vehicle not found.");
      return;
    }

    const [fuelLogs, maintenanceLogs] = await Promise.all([
      FuelLog.find({ vehicle: vehicle._id }),
      MaintenanceLog.find({ vehicle: vehicle._id }),
    ]);
    const fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);

    ok(res, {
      vehicle,
      costs: { fuelCost, maintenanceCost, operationalCost: fuelCost + maintenanceCost },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("FLEET_MANAGER"), async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, {
        issues: parsed.error.issues,
      });
      return;
    }
    const { registrationNumber, ...rest } = parsed.data;
    const regNo = registrationNumber.toUpperCase();

    const existing = await Vehicle.findOne({ registrationNumber: regNo });
    if (existing) {
      fail(
        res,
        409,
        "DUPLICATE_REGISTRATION",
        `A vehicle with registration number ${regNo} already exists.`,
      );
      return;
    }

    const vehicle = await Vehicle.create({ registrationNumber: regNo, ...rest });
    ok(res, vehicle, 201);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, requireRole("FLEET_MANAGER"), async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, {
        issues: parsed.error.issues,
      });
      return;
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      fail(res, 404, "NOT_FOUND", "Vehicle not found.");
      return;
    }

    const { registrationNumber, status, ...rest } = parsed.data;

    if (status !== undefined) {
      if (status === "ON_TRIP") {
        fail(
          res,
          400,
          "INVALID_STATUS_CHANGE",
          "Vehicle status becomes On Trip only when a trip is dispatched.",
        );
        return;
      }
      if (status === "AVAILABLE") {
        const activeMaintenance = await MaintenanceLog.findOne({
          vehicle: vehicle._id,
          status: "ACTIVE",
        });
        if (activeMaintenance) {
          fail(
            res,
            400,
            "VEHICLE_IN_SHOP",
            "This vehicle has an active maintenance record and cannot be marked Available.",
          );
          return;
        }
      }
    }

    if (registrationNumber !== undefined) {
      const regNo = registrationNumber.toUpperCase();
      const existing = await Vehicle.findOne({
        registrationNumber: regNo,
        _id: { $ne: vehicle._id },
      });
      if (existing) {
        fail(
          res,
          409,
          "DUPLICATE_REGISTRATION",
          `A vehicle with registration number ${regNo} already exists.`,
        );
        return;
      }
      vehicle.registrationNumber = regNo;
    }

    Object.assign(vehicle, rest);
    if (status !== undefined) vehicle.status = status;

    await vehicle.save();
    ok(res, vehicle);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, requireRole("FLEET_MANAGER"), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      fail(res, 404, "NOT_FOUND", "Vehicle not found.");
      return;
    }
    vehicle.status = "RETIRED";
    await vehicle.save();
    ok(res, vehicle);
  } catch (error) {
    next(error);
  }
});

export default router;
