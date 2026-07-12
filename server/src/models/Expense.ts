import { Schema, model, Types } from "mongoose";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "./constants.js";

export interface ExpenseFields {
  vehicle: Types.ObjectId;
  tripId: Types.ObjectId | null;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  note: string | null;
}

const expenseSchema = new Schema<ExpenseFields>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", default: null },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String, default: null },
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

export const Expense = model("Expense", expenseSchema);
