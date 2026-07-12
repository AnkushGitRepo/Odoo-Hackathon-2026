import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { fail, ok } from "../lib/respond.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { checkDispatchEligibility } from "../lib/rules.js";
import { Trip, Vehicle, Driver, FuelLog, TRIP_STATUSES } from "../models/index.js";

const router = Router();

const createSchema = z.object({
  source: z.string().trim().min(1, "Source is required."),
  destination: z.string().trim().min(1, "Destination is required."),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  cargoWeightKg: z.number().positive("Cargo weight must be greater than 0."),
  plannedDistanceKm: z.number().positive("Planned distance must be greater than 0."),
});

const updateSchema = createSchema.partial();

const dispatchSchema = z
  .object({ vehicleId: z.string().optional(), driverId: z.string().optional() })
  .default({});

const completeSchema = z.object({
  endOdometer: z.number(),
  fuelUsedL: z.number().min(0),
  fuelCost: z.number().min(0),
  revenue: z.number().min(0),
});

const cancelSchema = z.object({ reason: z.string().trim().optional() }).default({});

async function nextTripCode(): Promise<string> {
  const trips = await Trip.find({}, { code: 1 });
  const maxNum = trips.reduce((max, t) => {
    const match = /^TR(\d+)$/.exec(t.code);
    return match ? Math.max(max, Number.parseInt(match[1], 10)) : max;
  }, 0);
  return `TR${String(maxNum + 1).padStart(3, "0")}`;
}

const POPULATE = "vehicle driver";

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, q } = req.query;
    const filter: Record<string, unknown> = {};

    if (typeof status === "string" && (TRIP_STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }
    if (typeof q === "string" && q.trim() !== "") {
      const pattern = new RegExp(q.trim(), "i");
      filter.$or = [{ code: pattern }, { source: pattern }, { destination: pattern }];
    }

    const trips = await Trip.find(filter).sort({ createdAt: -1 }).populate(POPULATE);
    ok(res, trips);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id).populate(POPULATE);
    if (!trip) {
      fail(res, 404, "NOT_FOUND", "Trip not found.");
      return;
    }
    ok(res, trip);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("DISPATCHER"), async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, {
        issues: parsed.error.issues,
      });
      return;
    }
    const { vehicleId, driverId, cargoWeightKg, ...rest } = parsed.data;

    let vehicle = null;
    let driver = null;
    if (vehicleId) {
      vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        fail(res, 404, "NOT_FOUND", "Selected vehicle not found.");
        return;
      }
    }
    if (driverId) {
      driver = await Driver.findById(driverId);
      if (!driver) {
        fail(res, 404, "NOT_FOUND", "Selected driver not found.");
        return;
      }
    }
    if (vehicle && driver) {
      const failure = checkDispatchEligibility(vehicle, driver, cargoWeightKg);
      if (failure) {
        fail(res, 400, failure.code, failure.message, failure.details);
        return;
      }
    }

    const code = await nextTripCode();
    const trip = await Trip.create({
      code,
      cargoWeightKg,
      vehicle: vehicle?._id ?? null,
      driver: driver?._id ?? null,
      ...rest,
    });
    await trip.populate(POPULATE);
    ok(res, trip, 201);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, requireRole("DISPATCHER"), async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, {
        issues: parsed.error.issues,
      });
      return;
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      fail(res, 404, "NOT_FOUND", "Trip not found.");
      return;
    }
    if (trip.status !== "DRAFT") {
      fail(res, 400, "TRIP_NOT_DRAFT", "Only draft trips can be edited.");
      return;
    }

    const { vehicleId, driverId, ...rest } = parsed.data;
    Object.assign(trip, rest);
    if (vehicleId !== undefined) trip.vehicle = new mongoose.Types.ObjectId(vehicleId);
    if (driverId !== undefined) trip.driver = new mongoose.Types.ObjectId(driverId);

    await trip.save();
    await trip.populate(POPULATE);
    ok(res, trip);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/dispatch",
  requireAuth,
  requireRole("DISPATCHER"),
  async (req, res, next) => {
    try {
      const parsed = dispatchSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        fail(res, 400, "VALIDATION", parsed.error.issues[0].message, {
          issues: parsed.error.issues,
        });
        return;
      }

      const trip = await Trip.findById(req.params.id);
      if (!trip) {
        fail(res, 404, "NOT_FOUND", "Trip not found.");
        return;
      }
      if (trip.status !== "DRAFT") {
        fail(res, 400, "TRIP_NOT_DRAFT", "Only draft trips can be dispatched.");
        return;
      }

      const vehicleId = parsed.data.vehicleId ?? trip.vehicle?.toString();
      const driverId = parsed.data.driverId ?? trip.driver?.toString();
      if (!vehicleId || !driverId) {
        fail(res, 400, "TRIP_UNASSIGNED", "Assign a vehicle and driver before dispatching.");
        return;
      }

      const vehicle = await Vehicle.findById(vehicleId);
      const driver = await Driver.findById(driverId);
      if (!vehicle || !driver) {
        fail(res, 404, "NOT_FOUND", "Selected vehicle or driver not found.");
        return;
      }

      const failure = checkDispatchEligibility(vehicle, driver, trip.cargoWeightKg);
      if (failure) {
        fail(res, 400, failure.code, failure.message, failure.details);
        return;
      }

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          trip.vehicle = vehicle._id;
          trip.driver = driver._id;
          trip.status = "DISPATCHED";
          trip.dispatchedAt = new Date();
          trip.startOdometer = vehicle.odometerKm;
          await trip.save({ session });

          vehicle.status = "ON_TRIP";
          await vehicle.save({ session });

          driver.status = "ON_TRIP";
          await driver.save({ session });
        });
      } finally {
        await session.endSession();
      }

      await trip.populate(POPULATE);
      ok(res, trip);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/complete",
  requireAuth,
  requireRole("DISPATCHER"),
  async (req, res, next) => {
    try {
      const parsed = completeSchema.safeParse(req.body);
      if (!parsed.success) {
        fail(res, 400, "VALIDATION", parsed.error.issues[0].message, {
          issues: parsed.error.issues,
        });
        return;
      }
      const { endOdometer, fuelUsedL, fuelCost, revenue } = parsed.data;

      const trip = await Trip.findById(req.params.id);
      if (!trip) {
        fail(res, 404, "NOT_FOUND", "Trip not found.");
        return;
      }
      if (trip.status !== "DISPATCHED") {
        fail(res, 400, "TRIP_NOT_DISPATCHED", "Only dispatched trips can be completed.");
        return;
      }
      if (trip.startOdometer !== null && endOdometer < trip.startOdometer) {
        fail(res, 400, "ODOMETER_INVALID", "End odometer cannot be less than the start odometer.", {
          startOdometer: trip.startOdometer,
        });
        return;
      }

      const [vehicle, driver] = await Promise.all([
        Vehicle.findById(trip.vehicle),
        Driver.findById(trip.driver),
      ]);
      if (!vehicle || !driver) {
        fail(res, 404, "NOT_FOUND", "Trip's vehicle or driver no longer exists.");
        return;
      }

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          trip.status = "COMPLETED";
          trip.completedAt = new Date();
          trip.endOdometer = endOdometer;
          trip.fuelUsedL = fuelUsedL;
          trip.revenue = revenue;
          await trip.save({ session });

          vehicle.status = "AVAILABLE";
          vehicle.odometerKm = endOdometer;
          await vehicle.save({ session });

          driver.status = "AVAILABLE";
          await driver.save({ session });

          await FuelLog.create(
            [{ vehicle: vehicle._id, tripId: trip._id, liters: fuelUsedL, cost: fuelCost, date: new Date() }],
            { session },
          );
        });
      } finally {
        await session.endSession();
      }

      await trip.populate(POPULATE);
      ok(res, trip);
    } catch (error) {
      next(error);
    }
  },
);

router.post("/:id/cancel", requireAuth, requireRole("DISPATCHER"), async (req, res, next) => {
  try {
    const parsed = cancelSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, {
        issues: parsed.error.issues,
      });
      return;
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      fail(res, 404, "NOT_FOUND", "Trip not found.");
      return;
    }
    if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
      fail(res, 400, "TRIP_ALREADY_CLOSED", "This trip is already completed or cancelled.");
      return;
    }

    const wasDispatched = trip.status === "DISPATCHED";

    if (wasDispatched) {
      const [vehicle, driver] = await Promise.all([
        Vehicle.findById(trip.vehicle),
        Driver.findById(trip.driver),
      ]);
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          trip.status = "CANCELLED";
          trip.cancelReason = parsed.data.reason ?? null;
          await trip.save({ session });

          if (vehicle) {
            vehicle.status = "AVAILABLE";
            await vehicle.save({ session });
          }
          if (driver) {
            driver.status = "AVAILABLE";
            await driver.save({ session });
          }
        });
      } finally {
        await session.endSession();
      }
    } else {
      trip.status = "CANCELLED";
      trip.cancelReason = parsed.data.reason ?? null;
      await trip.save();
    }

    await trip.populate(POPULATE);
    ok(res, trip);
  } catch (error) {
    next(error);
  }
});

export default router;
