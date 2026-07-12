import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { User } from "../models/User.js";
import { ROLES } from "../models/constants.js";
import { fail, ok } from "../lib/respond.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();

// Brute-force / credential-stuffing guard on the two write-with-credentials
// endpoints. Kept off GET /me and the rest of the API — read-heavy demo
// clicking shouldn't ever hit a limit.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 429, "RATE_LIMITED", "Too many attempts. Try again in a few minutes.");
  },
});

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(ROLES),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: "24h",
  });
}

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, {
        issues: parsed.error.issues,
      });
      return;
    }
    const { name, email, password, role } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      fail(res, 409, "DUPLICATE_EMAIL", "An account with this email already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });
    ok(res, { token: signToken(user._id.toString(), user.role), user }, 201);
  } catch (err) {
    next(err);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      fail(res, 400, "VALIDATION", parsed.error.issues[0].message, {
        issues: parsed.error.issues,
      });
      return;
    }
    const { email, password } = parsed.data;

    // Same message for unknown email and wrong password (contract).
    const user = await User.findOne({ email: email.toLowerCase() });
    const valid = user && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !valid) {
      fail(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
      return;
    }

    ok(res, { token: signToken(user._id.toString(), user.role), user });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await User.findById(req.auth!.sub);
    if (!user) {
      fail(res, 404, "NOT_FOUND", "Account no longer exists.");
      return;
    }
    ok(res, user);
  } catch (err) {
    next(err);
  }
});

export default router;
