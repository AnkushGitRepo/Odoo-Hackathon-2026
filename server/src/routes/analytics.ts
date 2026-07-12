import { Router } from "express";
import { Vehicle, Trip, FuelLog, MaintenanceLog } from "../models/index.js";
import { ok } from "../lib/respond.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("FLEET_MANAGER", "FINANCIAL_ANALYST"), async (req, res, next) => {
  try {
    const allVehicles = await Vehicle.find();
    const completedTrips = await Trip.find({ status: "COMPLETED" });
    const allFuelLogs = await FuelLog.find();
    const allMaintenanceLogs = await MaintenanceLog.find();

    // 1. fuelEfficiencyKmPerL
    let totalCompletedKm = 0;
    let totalFuelUsedInCompleted = 0;
    for (const t of completedTrips) {
      if (t.endOdometer != null && t.startOdometer != null && t.fuelUsedL != null) {
        totalCompletedKm += (t.endOdometer - t.startOdometer);
        totalFuelUsedInCompleted += t.fuelUsedL;
      }
    }
    const fuelEfficiencyKmPerL = totalFuelUsedInCompleted > 0 
      ? Number((totalCompletedKm / totalFuelUsedInCompleted).toFixed(2)) 
      : null;

    // 2. fleetUtilizationPct
    const activeVehicles = allVehicles.filter(v => v.status !== "RETIRED");
    const onTripVehicles = allVehicles.filter(v => v.status === "ON_TRIP").length;
    const fleetUtilizationPct = activeVehicles.length === 0 
      ? 0 
      : Math.round((onTripVehicles / activeVehicles.length) * 100);

    // 3. totalOperationalCost
    const totalFuelCost = allFuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalMaintenanceCost = allMaintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost;

    // 4. Vehicle ROI Breakdown
    const vehicleRoi = [];
    for (const v of allVehicles) {
      if (v.acquisitionCost > 0 && v.status !== "RETIRED") {
        const vTrips = completedTrips.filter(t => t.vehicle?.toString() === v._id.toString());
        const revenue = vTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
        
        const vFuelCost = allFuelLogs.filter(l => l.vehicle?.toString() === v._id.toString()).reduce((sum, l) => sum + l.cost, 0);
        const vMaintCost = allMaintenanceLogs.filter(l => l.vehicle?.toString() === v._id.toString()).reduce((sum, l) => sum + l.cost, 0);
        
        const roiPct = Number((((revenue - (vMaintCost + vFuelCost)) / v.acquisitionCost) * 100).toFixed(2));
        
        vehicleRoi.push({
          vehicleId: v._id.toString(),
          registrationNumber: v.registrationNumber,
          name: v.name,
          revenue,
          fuelCost: vFuelCost,
          maintenanceCost: vMaintCost,
          acquisitionCost: v.acquisitionCost,
          operationalCost: vFuelCost + vMaintCost,
          roiPct
        });
      }
    }

    // 5. avgVehicleRoiPct
    const avgVehicleRoiPct = vehicleRoi.length > 0 
      ? Number((vehicleRoi.reduce((sum, r) => sum + r.roiPct, 0) / vehicleRoi.length).toFixed(2)) 
      : null;

    // 6. costliestVehicles
    const costliestVehicles = [...vehicleRoi]
      .sort((a, b) => b.operationalCost - a.operationalCost)
      .slice(0, 5)
      .map(({ vehicleId, registrationNumber, name, operationalCost }) => ({
        vehicleId, registrationNumber, name, operationalCost
      }));

    // 7. monthlyRevenue
    const monthlyRevenueMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenueMap[monthStr] = 0;
    }

    for (const t of completedTrips) {
      if (t.completedAt && t.revenue) {
        const d = new Date(t.completedAt);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyRevenueMap[monthStr] !== undefined) {
          monthlyRevenueMap[monthStr] += t.revenue;
        }
      }
    }
    
    const monthlyRevenue = Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({ month, revenue }));

    const data = {
      fuelEfficiencyKmPerL,
      fleetUtilizationPct,
      totalOperationalCost,
      avgVehicleRoiPct,
      monthlyRevenue,
      costliestVehicles,
      vehicleRoi: vehicleRoi.map(({ operationalCost, ...rest }) => rest)
    };

    ok(res, data);
  } catch (err) {
    next(err);
  }
});

router.get("/export.csv", requireAuth, requireRole("FLEET_MANAGER", "FINANCIAL_ANALYST"), async (req, res, next) => {
  try {
    const allVehicles = await Vehicle.find({ status: { $ne: "RETIRED" } });
    const completedTrips = await Trip.find({ status: "COMPLETED" });
    const allFuelLogs = await FuelLog.find();
    const allMaintenanceLogs = await MaintenanceLog.find();

    const rows = [];
    for (const v of allVehicles) {
      const vTrips = completedTrips.filter(t => t.vehicle?.toString() === v._id.toString());
      const revenue = vTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      
      const vFuelCost = allFuelLogs.filter(l => l.vehicle?.toString() === v._id.toString()).reduce((sum, l) => sum + l.cost, 0);
      const vMaintCost = allMaintenanceLogs.filter(l => l.vehicle?.toString() === v._id.toString()).reduce((sum, l) => sum + l.cost, 0);
      
      const operationalCost = vFuelCost + vMaintCost;
      let roiPct: number | string = 0;
      if (v.acquisitionCost > 0) {
        roiPct = Number((((revenue - operationalCost) / v.acquisitionCost) * 100).toFixed(2));
      } else {
        roiPct = "N/A";
      }

      rows.push({
        registrationNumber: v.registrationNumber,
        name: v.name,
        type: v.type,
        status: v.status,
        revenue,
        fuelCost: vFuelCost,
        maintenanceCost: vMaintCost,
        operationalCost,
        roiPct
      });
    }

    const csvHeader = "registrationNumber,name,type,status,revenue,fuelCost,maintenanceCost,operationalCost,roiPct";
    const csvRows = rows.map(r =>
      `${r.registrationNumber},"${r.name}",${r.type},${r.status},${r.revenue},${r.fuelCost},${r.maintenanceCost},${r.operationalCost},${r.roiPct}`
    );
    const csvData = [csvHeader, ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="transitops-report.csv"');
    res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
});

export default router;
