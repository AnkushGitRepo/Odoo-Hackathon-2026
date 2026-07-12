import { Router } from "express";
import { z } from "zod";
import { Driver, LICENSE_CATEGORIES, DRIVER_STATUSES } from "../models/index.js";
import { fail, ok } from "../lib/respond.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const createDriverSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  licenseNumber: z.string().trim().min(1, "License number is required."),
  licenseCategory: z.array(z.enum(LICENSE_CATEGORIES)).nonempty("At least one license category is required."),
  licenseExpiry: z.string().datetime({ message: "Invalid ISO date string for license expiry." }),
  contact: z.string().trim().min(1, "Contact is required."),
  safetyScore: z.number().min(0).max(100).optional().default(100),
  tripCompletionRate: z.number().min(0).max(100).optional().default(100),
});

const updateDriverSchema = z.object({
  name: z.string().trim().min(1).optional(),
  licenseNumber: z.string().trim().min(1).optional(),
  licenseCategory: z.array(z.enum(LICENSE_CATEGORIES)).nonempty("At least one license category is required.").optional(),
  licenseExpiry: z.string().datetime().optional(),
  contact: z.string().trim().min(1).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  tripCompletionRate: z.number().min(0).max(100).optional(),
  status: z.enum(DRIVER_STATUSES).optional(),
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, q } = req.query;
    const filter: Record<string, any> = {};

    if (typeof status === "string" && (DRIVER_STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }
    
    if (typeof q === "string" && q.trim() !== "") {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { licenseNumber: searchRegex }
      ];
    }

    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    ok(res, drivers);
  } catch (err) {
    next(err);
  }
});

router.get("/assignable", requireAuth, async (req, res, next) => {
  try {
    const drivers = await Driver.find({
      status: "AVAILABLE",
      licenseExpiry: { $gt: new Date() }
    }).sort({ name: 1 });
    ok(res, drivers);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      fail(res, 404, "NOT_FOUND", "Driver not found.");
      return;
    }
    ok(res, driver);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("FLEET_MANAGER", "SAFETY_OFFICER"), async (req, res, next) => {
  try {
    const parsed = createDriverSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, { issues: parsed.error.issues });
      return;
    }

    const existing = await Driver.findOne({ licenseNumber: parsed.data.licenseNumber });
    if (existing) {
      fail(res, 409, "DUPLICATE_LICENSE", "A driver with this license number already exists.");
      return;
    }

    const driver = await Driver.create({
      ...parsed.data,
      status: "AVAILABLE",
    });

    ok(res, driver, 201);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, requireRole("FLEET_MANAGER", "SAFETY_OFFICER"), async (req, res, next) => {
  try {
    const parsed = updateDriverSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, { issues: parsed.error.issues });
      return;
    }

    if (parsed.data.status === "ON_TRIP") {
      fail(res, 400, "INVALID_STATUS_CHANGE", "Cannot manually set status to ON_TRIP.");
      return;
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      fail(res, 404, "NOT_FOUND", "Driver not found.");
      return;
    }

    if (driver.status === "ON_TRIP" && parsed.data.status) {
      fail(res, 400, "DRIVER_ON_TRIP", "Cannot change status while driver is on a trip.");
      return;
    }

    if (parsed.data.licenseNumber && parsed.data.licenseNumber !== driver.licenseNumber) {
      const existing = await Driver.findOne({ licenseNumber: parsed.data.licenseNumber });
      if (existing) {
        fail(res, 409, "DUPLICATE_LICENSE", "A driver with this license number already exists.");
        return;
      }
    }

    Object.assign(driver, parsed.data);
    await driver.save();

    ok(res, driver);
  } catch (err) {
    next(err);
  }
});

export default router;
