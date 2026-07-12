import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { ok } from "../lib/respond.js";
import { Vehicle, Trip, Driver, VEHICLE_TYPES, VEHICLE_STATUSES } from "../models/index.js";

const dashboardRouter = Router();

dashboardRouter.get("/kpis", requireAuth, async (req, res) => {
  try {
    const { type, status, region } = req.query;
    const vFilter: Record<string, any> = {};

    if (typeof type === "string" && (VEHICLE_TYPES as readonly string[]).includes(type)) {
      vFilter.type = type;
    }
    if (typeof status === "string" && (VEHICLE_STATUSES as readonly string[]).includes(status)) {
      vFilter.status = status;
    }
    if (typeof region === "string" && region.trim() !== "") {
      vFilter.region = region;
    }

    const vehicles = await Vehicle.find(vFilter);

    const availableVehicles = vehicles.filter(v => v.status === "AVAILABLE").length;
    const onTripVehicles = vehicles.filter(v => v.status === "ON_TRIP").length;
    const inMaintenance = vehicles.filter(v => v.status === "IN_SHOP").length;
    const retiredVehicles = vehicles.filter(v => v.status === "RETIRED").length;

    const activeVehicles = vehicles.length - retiredVehicles;
    const fleetUtilizationPct = activeVehicles === 0 ? 0 : Math.round((onTripVehicles / activeVehicles) * 100);

    const activeTrips = await Trip.countDocuments({ status: "DISPATCHED" });
    const pendingTrips = await Trip.countDocuments({ status: "DRAFT" });
    const driversOnDuty = await Driver.countDocuments({ status: { $in: ["AVAILABLE", "ON_TRIP"] } });
    
    const recentTrips = await Trip.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("vehicle driver");

    const data = {
      activeVehicles,
      availableVehicles,
      inMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilizationPct,
      vehicleStatusBreakdown: {
        AVAILABLE: availableVehicles,
        ON_TRIP: onTripVehicles,
        IN_SHOP: inMaintenance,
        RETIRED: retiredVehicles,
      },
      recentTrips,
    };

    return ok(res, data);
  } catch (error) {
    throw error;
  }
});

export default dashboardRouter;
