import { Schema, model, Types } from "mongoose";
import { MAINTENANCE_STATUSES, type MaintenanceStatus } from "./constants.js";

export interface MaintenanceLogFields {
  vehicle: Types.ObjectId;
  serviceType: string;
  cost: number;
  date: Date;
  status: MaintenanceStatus;
  closedAt: Date | null;
}

const maintenanceLogSchema = new Schema<MaintenanceLogFields>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    serviceType: { type: String, required: true, trim: true },
    cost: { type: Number, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: MAINTENANCE_STATUSES, required: true, default: "ACTIVE" },
    closedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        if (ret.date instanceof Date) {
          ret.date = ret.date.toISOString();
        }
        if (ret.closedAt instanceof Date) {
          ret.closedAt = ret.closedAt.toISOString();
        }
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const MaintenanceLog = model("MaintenanceLog", maintenanceLogSchema);
