import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { config } from "dotenv";
import {
  User,
  Vehicle,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
} from "./models/index.js";

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/transitops";

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected. Clearing existing data...");

    // Delete all documents in all 7 collections
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Trip.deleteMany({}),
      MaintenanceLog.deleteMany({}),
      FuelLog.deleteMany({}),
      Expense.deleteMany({}),
    ]);
    console.log("Collections cleared.");

    // 1. Users
    const passwordHash = await bcryptjs.hash("password123", 10);
    const usersData = [
      { name: "Raven K", email: "manager@transitops.in", role: "FLEET_MANAGER", passwordHash },
      { name: "Ankush Gupta", email: "dispatcher@transitops.in", role: "DISPATCHER", passwordHash },
      { name: "Dev Panchal", email: "safety@transitops.in", role: "SAFETY_OFFICER", passwordHash },
      { name: "Meera Shah", email: "finance@transitops.in", role: "FINANCIAL_ANALYST", passwordHash },
    ];
    const users = await User.insertMany(usersData);
    console.log(`Inserted ${users.length} users.`);

    // 2. Vehicles
    const vehiclesData = [
      { registrationNumber: "GJ01AB4521", name: "VAN-05", type: "VAN", maxLoadCapacityKg: 500, odometerKm: 74000, acquisitionCost: 620000, region: "Gandhinagar", status: "ON_TRIP" },
      { registrationNumber: "GJ01AB9981", name: "TRUCK-11", type: "TRUCK", maxLoadCapacityKg: 5000, odometerKm: 182000, acquisitionCost: 2450000, region: "Gandhinagar", status: "AVAILABLE" },
      { registrationNumber: "GJ01AB1120", name: "MINI-03", type: "MINI", maxLoadCapacityKg: 1000, odometerKm: 66000, acquisitionCost: 410000, region: "Gandhinagar", status: "IN_SHOP" },
      { registrationNumber: "GJ01AB0087", name: "VAN-09", type: "VAN", maxLoadCapacityKg: 750, odometerKm: 241900, acquisitionCost: 590000, region: "Gandhinagar", status: "RETIRED" },
      { registrationNumber: "GJ01CD2210", name: "TRK-12", type: "TRUCK", maxLoadCapacityKg: 4000, odometerKm: 98000, acquisitionCost: 1980000, region: "Gandhinagar", status: "AVAILABLE" },
      { registrationNumber: "GJ01CD7745", name: "MINI-08", type: "MINI", maxLoadCapacityKg: 1000, odometerKm: 31000, acquisitionCost: 450000, region: "Ahmedabad", status: "AVAILABLE" },
      { registrationNumber: "GJ01EF3301", name: "VAN-02", type: "VAN", maxLoadCapacityKg: 500, odometerKm: 12000, acquisitionCost: 640000, region: "Ahmedabad", status: "AVAILABLE" },
      { registrationNumber: "GJ01EF8892", name: "BIKE-01", type: "BIKE", maxLoadCapacityKg: 40, odometerKm: 8000, acquisitionCost: 95000, region: "Gandhinagar", status: "AVAILABLE" },
      ...Array.from({ length: 10 }).map((_, i) => ({
        registrationNumber: `GJ01XX${9000 + i}`,
        name: `TRK-X${i}`,
        type: i % 2 === 0 ? "TRUCK" : "VAN",
        maxLoadCapacityKg: i % 2 === 0 ? 5000 : 750,
        odometerKm: 20000 + (i * 15000),
        acquisitionCost: i % 2 === 0 ? 2500000 : 650000,
        region: i % 3 === 0 ? "Ahmedabad" : "Gandhinagar",
        status: "AVAILABLE",
      })),
    ];
    const vehicles = await Vehicle.insertMany(vehiclesData);
    console.log(`Inserted ${vehicles.length} vehicles.`);

    // 3. Drivers
    const driversData = [
      { name: "Alex", licenseNumber: "DL-88213", licenseCategory: ["LMV"], licenseExpiry: new Date("2028-12-31"), contact: "9876543210", safetyScore: 96, tripCompletionRate: 96, status: "ON_TRIP" },
      { name: "John", licenseNumber: "DL-44120", licenseCategory: ["HMV"], licenseExpiry: new Date("2025-03-31"), contact: "9822012345", safetyScore: 81, tripCompletionRate: 81, status: "SUSPENDED" },
      { name: "Priya", licenseNumber: "DL-77031", licenseCategory: ["LMV", "HMV"], licenseExpiry: new Date("2027-08-31"), contact: "9911054321", safetyScore: 99, tripCompletionRate: 99, status: "AVAILABLE" },
      { name: "Suresh", licenseNumber: "DL-90045", licenseCategory: ["HMV"], licenseExpiry: new Date("2027-01-31"), contact: "9744098765", safetyScore: 88, tripCompletionRate: 88, status: "OFF_DUTY" },
      { name: "Kavita", licenseNumber: "DL-55672", licenseCategory: ["LMV"], licenseExpiry: new Date("2029-05-31"), contact: "9801011223", safetyScore: 94, tripCompletionRate: 92, status: "AVAILABLE" },
      { name: "Ramesh", licenseNumber: "DL-33208", licenseCategory: ["LMV", "HMV"], licenseExpiry: new Date("2026-11-30"), contact: "9765099887", safetyScore: 90, tripCompletionRate: 87, status: "AVAILABLE" },
      ...Array.from({ length: 10 }).map((_, i) => ({
        name: `Driver${i}`,
        licenseNumber: `DL-XX${9000 + i}`,
        licenseCategory: i % 2 === 0 ? ["HMV", "LMV"] : ["LMV"],
        licenseExpiry: new Date(`202${6 + (i % 3)}-12-31`),
        contact: `980000${9000 + i}`,
        safetyScore: 85 + i,
        tripCompletionRate: 85 + i,
        status: "AVAILABLE",
      })),
    ];
    const drivers = await Driver.insertMany(driversData);
    console.log(`Inserted ${drivers.length} drivers.`);

    // Helper functions to get IDs
    const getVehicle = (regNo: string) => vehicles.find(v => v.registrationNumber === regNo)?._id;
    const getDriver = (name: string) => drivers.find(d => d.name === name)?._id;

    // 4. Trips
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    const tripsData = [
      { 
        code: "TR001", 
        source: "Gandhinagar Depot", 
        destination: "Ahmedabad Hub", 
        vehicle: getVehicle("GJ01AB4521"), 
        driver: getDriver("Alex"), 
        cargoWeightKg: 450, 
        plannedDistanceKm: 38, 
        status: "DISPATCHED", 
        dispatchedAt: today, 
        startOdometer: 74000 
      },
      { 
        code: "TR002", 
        source: "Vatva Industrial Area", 
        destination: "Sanand Warehouse", 
        vehicle: getVehicle("GJ01CD2210"), 
        driver: getDriver("Priya"), 
        cargoWeightKg: 2200, 
        plannedDistanceKm: 52, 
        status: "COMPLETED", 
        startOdometer: 97940, 
        endOdometer: 98000, 
        fuelUsedL: 9, 
        revenue: 8500,
        dispatchedAt: yesterday,
        completedAt: yesterday
      },
      { 
        code: "TR003", 
        source: "Mansa", 
        destination: "Kalol Depot", 
        vehicle: null, 
        driver: null, 
        cargoWeightKg: 300, 
        plannedDistanceKm: 25, 
        status: "DRAFT" 
      },
      { 
        code: "TR004", 
        source: "Ahmedabad Hub", 
        destination: "Gandhinagar Depot", 
        vehicle: getVehicle("GJ01CD7745"), 
        driver: getDriver("Kavita"), 
        cargoWeightKg: 800, 
        plannedDistanceKm: 40, 
        status: "CANCELLED", 
        cancelReason: "Vehicle went to shop" 
      },
      ...Array.from({ length: 10 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (1 + Math.floor(i / 2))); // spread over past months
        d.setDate(d.getDate() - (i * 3));
        const dispatched = new Date(d);
        const completed = new Date(d.getTime() + 86400000);
        return {
          code: `TR00${5 + i}`,
          source: "Surat Hub",
          destination: "Ahmedabad Hub",
          vehicle: getVehicle("GJ01AB9981"),
          driver: getDriver("Ramesh"),
          cargoWeightKg: 3000 + (i * 100),
          plannedDistanceKm: 280,
          status: "COMPLETED",
          startOdometer: 160000 + (i * 1000),
          endOdometer: 160000 + (i * 1000) + 280,
          fuelUsedL: 45,
          revenue: 18000 + (i * 1000),
          dispatchedAt: dispatched,
          completedAt: completed
        };
      })
    ];
    const trips = await Trip.insertMany(tripsData);
    console.log(`Inserted ${trips.length} trips.`);

    const getTrip = (code: string) => trips.find(t => t.code === code)?._id;

    // 5. MaintenanceLogs
    const maintenanceData = [
      { vehicle: getVehicle("GJ01AB1120"), serviceType: "Tyre Replace", cost: 6200, status: "ACTIVE", date: today }, // MINI-03
      { vehicle: getVehicle("GJ01AB9981"), serviceType: "Engine Repair", cost: 18000, status: "COMPLETED", date: yesterday, closedAt: yesterday }, // TRUCK-11
      ...Array.from({ length: 10 }).map((_, i) => ({
        vehicle: getVehicle(`GJ01XX${9000 + i}`),
        serviceType: i % 2 === 0 ? "Oil Change" : "Brake Inspection",
        cost: 1500 + (i * 200),
        status: "COMPLETED",
        date: new Date(Date.now() - (i * 86400000 * 3)),
        closedAt: new Date(Date.now() - (i * 86400000 * 3) + 86400000),
      })),
    ];
    const maintenanceLogs = await MaintenanceLog.insertMany(maintenanceData);
    console.log(`Inserted ${maintenanceLogs.length} maintenance logs.`);

    // 6. FuelLogs
    const fuelData = [
      { vehicle: getVehicle("GJ01CD2210"), tripId: getTrip("TR002"), liters: 9, cost: 810, date: yesterday }, // TR002 auto log
      { vehicle: getVehicle("GJ01AB4521"), tripId: null, liters: 42, cost: 3150, date: today }, // VAN-05 manual
      { vehicle: getVehicle("GJ01CD7745"), tripId: null, liters: 28, cost: 2050, date: today }, // MINI-08 manual
    ];
    const fuelLogs = await FuelLog.insertMany(fuelData);
    console.log(`Inserted ${fuelLogs.length} fuel logs.`);

    // 7. Expenses
    const expenseData = [
      { vehicle: getVehicle("GJ01CD2210"), tripId: getTrip("TR002"), category: "TOLL", amount: 340, date: yesterday, note: null }, // TR002 toll
      { vehicle: getVehicle("GJ01AB4521"), tripId: getTrip("TR001"), category: "TOLL", amount: 120, date: today, note: null }, // TR001 toll
      { vehicle: getVehicle("GJ01CD7745"), tripId: null, category: "MISC", amount: 150, date: today, note: "General cleaning" }, // MINI-08 misc
      ...Array.from({ length: 10 }).map((_, i) => ({
        vehicle: getVehicle(`GJ01XX${9000 + i}`),
        tripId: null,
        category: i % 2 === 0 ? "TOLL" : "MISC",
        amount: 200 + (i * 50),
        date: new Date(Date.now() - (i * 86400000 * 2)),
        note: i % 2 === 0 ? "Highway Toll" : "Parking Fee",
      })),
    ];
    const expenses = await Expense.insertMany(expenseData);
    console.log(`Inserted ${expenses.length} expenses.`);

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
