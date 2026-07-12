import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { fail } from "../lib/respond.js";
import type { Role } from "../models/constants.js";

export interface AuthPayload {
  sub: string;
  role: Role;
}

export interface AuthedRequest extends Request {
  auth?: AuthPayload;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    fail(res, 401, "UNAUTHORIZED", "Authentication required.");
    return;
  }
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    next();
  } catch {
    fail(res, 401, "UNAUTHORIZED", "Session expired or invalid. Please sign in again.");
  }
}

/** RBAC guard — allow only the listed roles (use after requireAuth). */
export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      fail(res, 401, "UNAUTHORIZED", "Authentication required.");
      return;
    }
    if (!roles.includes(req.auth.role)) {
      fail(res, 403, "FORBIDDEN", "Your role does not allow this action.");
      return;
    }
    next();
  };
}
