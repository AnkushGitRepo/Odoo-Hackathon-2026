import { Schema, model } from "mongoose";
import { VEHICLE_TYPES, VEHICLE_STATUSES, type VehicleType, type VehicleStatus } from "./constants.js";

export interface VehicleFields {
  registrationNumber: string;
  name: string;
  type: VehicleType;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
}

const vehicleSchema = new Schema<VehicleFields>(
  {
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: VEHICLE_TYPES, required: true },
    maxLoadCapacityKg: { type: Number, required: true, min: 0.001 },
    odometerKm: { type: Number, required: true, default: 0, min: 0 },
    acquisitionCost: { type: Number, required: true },
    region: { type: String, default: "" },
    status: { type: String, enum: VEHICLE_STATUSES, required: true, default: "AVAILABLE" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Vehicle = model("Vehicle", vehicleSchema);
