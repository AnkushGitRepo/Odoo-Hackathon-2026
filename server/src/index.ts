import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routes/auth.js";
import { fail } from "./lib/respond.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { service: "transitops-api" } });
});

app.use("/api/auth", authRouter);

app.use("/api", (_req, res) => {
  fail(res, 404, "NOT_FOUND", "No such endpoint.");
});

// Central error handler — keeps the envelope even for unexpected failures.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  fail(res, 500, "INTERNAL", "Something went wrong on our side. Try again.");
});

const PORT = Number(process.env.PORT ?? 5001);

async function main() {
  const { MONGODB_URI, JWT_SECRET } = process.env;
  if (!MONGODB_URI || !JWT_SECRET) {
    console.error(
      "Missing env vars. Copy .env.example to server/.env and set MONGODB_URI + JWT_SECRET.",
    );
    process.exit(1);
  }
  if (MONGODB_URI.includes("<")) {
    console.error(
      "MONGODB_URI still contains .env.example placeholders (<user>/<password>/<cluster>).\n" +
        "Replace it with the real Atlas connection string — ask the team lead for server/.env values.",
    );
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
