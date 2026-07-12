import { Schema, model } from "mongoose";
import { ROLES, type Role } from "./constants.js";

export interface UserFields {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

const userSchema = new Schema<UserFields>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      // passwordHash must never leave the server (API contract)
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const User = model("User", userSchema);
