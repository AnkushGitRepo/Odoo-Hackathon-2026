import { Schema, model } from "mongoose";
import { LICENSE_CATEGORIES, DRIVER_STATUSES, type LicenseCategory, type DriverStatus } from "./constants.js";

export interface DriverFields {
  name: string;
  licenseNumber: string;
  /** A license can cover more than one class (e.g. LMV and HMV together). */
  licenseCategory: LicenseCategory[];
  licenseExpiry: Date;
  contact: string;
  safetyScore: number;
  tripCompletionRate: number;
  status: DriverStatus;
}

const driverSchema = new Schema<DriverFields>(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    licenseCategory: {
      type: [String],
      enum: LICENSE_CATEGORIES,
      required: true,
      validate: {
        validator: (value: string[]) => Array.isArray(value) && value.length > 0,
        message: "licenseCategory must contain at least one category.",
      },
    },
    licenseExpiry: { type: Date, required: true },
    contact: { type: String, required: true, trim: true },
    safetyScore: { type: Number, required: true, default: 100, min: 0, max: 100 },
    tripCompletionRate: { type: Number, required: true, default: 100, min: 0, max: 100 },
    status: { type: String, enum: DRIVER_STATUSES, required: true, default: "AVAILABLE" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        if (ret.licenseExpiry instanceof Date) {
          ret.licenseExpiry = ret.licenseExpiry.toISOString();
        }
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Driver = model("Driver", driverSchema);
