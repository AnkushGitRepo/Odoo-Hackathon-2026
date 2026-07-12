import { Router } from "express";
import { z } from "zod";
import { MaintenanceLog, Vehicle, MAINTENANCE_STATUSES } from "../models/index.js";
import { fail, ok } from "../lib/respond.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const createMaintenanceSchema = z.object({
  vehicleId: z.string().trim().min(1, "Vehicle ID is required."),
  serviceType: z.string().trim().min(1, "Service type is required."),
  cost: z.number().min(0, "Cost must be a positive number."),
  date: z.string().datetime().optional(),
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { vehicleId, status } = req.query;
    const filter: Record<string, any> = {};

    if (typeof vehicleId === "string" && vehicleId.trim() !== "") {
      filter.vehicle = vehicleId;
    }
    if (typeof status === "string" && (MAINTENANCE_STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }

    const logs = await MaintenanceLog.find(filter)
      .sort({ createdAt: -1 })
      .populate("vehicle");
      
    ok(res, logs);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("FLEET_MANAGER"), async (req, res, next) => {
  try {
    const parsed = createMaintenanceSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, { issues: parsed.error.issues });
      return;
    }

    const { vehicleId, serviceType, cost, date } = parsed.data;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      fail(res, 404, "NOT_FOUND", "Vehicle not found.");
      return;
    }

    if (vehicle.status === "ON_TRIP") {
      fail(res, 400, "VEHICLE_ON_TRIP", "Complete or cancel its trip first.");
      return;
    }
    
    if (vehicle.status === "RETIRED") {
      fail(res, 400, "VEHICLE_RETIRED", "Cannot log maintenance for a retired vehicle.");
      return;
    }

    const activeLog = await MaintenanceLog.findOne({ vehicle: vehicleId, status: "ACTIVE" });
    if (activeLog) {
      fail(res, 400, "MAINTENANCE_ALREADY_ACTIVE", "Vehicle already has an active maintenance record.");
      return;
    }

    const logDate = date ? new Date(date) : new Date();

    const log = await MaintenanceLog.create({
      vehicle: vehicleId,
      serviceType,
      cost,
      date: logDate,
      status: "ACTIVE",
    });

    vehicle.status = "IN_SHOP";
    await vehicle.save();

    await log.populate("vehicle");

    ok(res, log, 201);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/close", requireAuth, requireRole("FLEET_MANAGER"), async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) {
      fail(res, 404, "NOT_FOUND", "Maintenance record not found.");
      return;
    }

    if (log.status !== "ACTIVE") {
      fail(res, 400, "MAINTENANCE_ALREADY_CLOSED", "This maintenance record is already closed.");
      return;
    }

    log.status = "COMPLETED";
    log.closedAt = new Date();
    await log.save();

    const vehicle = await Vehicle.findById(log.vehicle);
    if (vehicle && vehicle.status !== "RETIRED") {
      vehicle.status = "AVAILABLE";
      await vehicle.save();
    }

    await log.populate("vehicle");

    ok(res, log);
  } catch (err) {
    next(err);
  }
});

export default router;
