import { Router } from "express";
import { z } from "zod";
import { FuelLog, Vehicle } from "../models/index.js";
import { fail, ok } from "../lib/respond.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const createFuelLogSchema = z.object({
  vehicleId: z.string().trim().min(1, "Vehicle ID is required."),
  tripId: z.string().trim().optional(),
  liters: z.number().min(0.1, "Liters must be greater than 0."),
  cost: z.number().min(0, "Cost must be a positive number."),
  date: z.string().datetime().optional(),
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const filter: Record<string, unknown> = {};

    if (typeof vehicleId === "string" && vehicleId.trim() !== "") {
      filter.vehicle = vehicleId;
    }

    const logs = await FuelLog.find(filter)
      .sort({ createdAt: -1 })
      .populate("vehicle");
      
    ok(res, logs);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("FINANCIAL_ANALYST"), async (req, res, next) => {
  try {
    const parsed = createFuelLogSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, { issues: parsed.error.issues });
      return;
    }

    const { vehicleId, tripId, liters, cost, date } = parsed.data;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      fail(res, 404, "NOT_FOUND", "Vehicle not found.");
      return;
    }

    const logDate = date ? new Date(date) : new Date();

    const log = await FuelLog.create({
      vehicle: vehicleId,
      tripId: tripId || null,
      liters,
      cost,
      date: logDate,
    });

    await log.populate("vehicle");

    ok(res, log, 201);
  } catch (err) {
    next(err);
  }
});

export default router;
