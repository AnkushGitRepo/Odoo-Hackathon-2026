import { Schema, model, Types } from "mongoose";
import { TRIP_STATUSES, type TripStatus } from "./constants.js";

export interface TripFields {
  code: string;
  source: string;
  destination: string;
  vehicle: Types.ObjectId | null;
  driver: Types.ObjectId | null;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  status: TripStatus;
  revenue: number | null;
  startOdometer: number | null;
  endOdometer: number | null;
  fuelUsedL: number | null;
  cancelReason: string | null;
  dispatchedAt: Date | null;
  completedAt: Date | null;
}

const tripSchema = new Schema<TripFields>(
  {
    code: { type: String, required: true, unique: true },
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", default: null },
    driver: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
    cargoWeightKg: { type: Number, required: true },
    plannedDistanceKm: { type: Number, required: true },
    status: { type: String, enum: TRIP_STATUSES, required: true, default: "DRAFT" },
    revenue: { type: Number, default: null },
    startOdometer: { type: Number, default: null },
    endOdometer: { type: Number, default: null },
    fuelUsedL: { type: Number, default: null },
    cancelReason: { type: String, default: null },
    dispatchedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        if (ret.dispatchedAt instanceof Date) {
          ret.dispatchedAt = ret.dispatchedAt.toISOString();
        }
        if (ret.completedAt instanceof Date) {
          ret.completedAt = ret.completedAt.toISOString();
        }
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Trip = model("Trip", tripSchema);
