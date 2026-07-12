import { Schema, model, Types } from "mongoose";

export interface FuelLogFields {
  vehicle: Types.ObjectId;
  tripId: Types.ObjectId | null;
  liters: number;
  cost: number;
  date: Date;
}

const fuelLogSchema = new Schema<FuelLogFields>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", default: null },
    liters: { type: Number, required: true },
    cost: { type: Number, required: true },
    date: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        if (ret.date instanceof Date) {
          ret.date = ret.date.toISOString();
        }
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const FuelLog = model("FuelLog", fuelLogSchema);
