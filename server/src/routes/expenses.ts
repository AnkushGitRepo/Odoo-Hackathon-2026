import { Router } from "express";
import { z } from "zod";
import { Expense, Vehicle, MaintenanceLog, FuelLog, EXPENSE_CATEGORIES } from "../models/index.js";
import { fail, ok } from "../lib/respond.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const createExpenseSchema = z.object({
  vehicleId: z.string().trim().min(1, "Vehicle ID is required."),
  tripId: z.string().trim().optional(),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().min(0, "Amount must be positive."),
  date: z.string().datetime().optional(),
  note: z.string().optional(),
});

router.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ status: { $ne: "RETIRED" } });
    
    const rows = await Promise.all(vehicles.map(async (v) => {
      const fuelLogs = await FuelLog.find({ vehicle: v._id });
      const maintenanceLogs = await MaintenanceLog.find({ vehicle: v._id });
      const expenses = await Expense.find({ vehicle: v._id });

      const fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
      const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
      const tollMiscCost = expenses.reduce((sum, log) => sum + log.amount, 0);
      const operationalCost = fuelCost + maintenanceCost;

      return {
        vehicleId: v._id.toString(),
        registrationNumber: v.registrationNumber,
        name: v.name,
        fuelCost,
        maintenanceCost,
        tollMiscCost,
        operationalCost
      };
    }));

    const totalOperationalCost = rows.reduce((sum, row) => sum + row.operationalCost, 0);

    ok(res, { rows, totalOperationalCost });
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const filter: Record<string, unknown> = {};

    if (typeof vehicleId === "string" && vehicleId.trim() !== "") {
      filter.vehicle = vehicleId;
    }

    const expenses = await Expense.find(filter)
      .sort({ createdAt: -1 })
      .populate("vehicle");
      
    ok(res, expenses);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("FINANCIAL_ANALYST"), async (req, res, next) => {
  try {
    const parsed = createExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, { issues: parsed.error.issues });
      return;
    }

    const { vehicleId, tripId, category, amount, date, note } = parsed.data;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      fail(res, 404, "NOT_FOUND", "Vehicle not found.");
      return;
    }

    const expDate = date ? new Date(date) : new Date();

    const expense = await Expense.create({
      vehicle: vehicleId,
      tripId: tripId || null,
      category,
      amount,
      date: expDate,
      note: note || null,
    });

    await expense.populate("vehicle");

    ok(res, expense, 201);
  } catch (err) {
    next(err);
  }
});

export default router;
