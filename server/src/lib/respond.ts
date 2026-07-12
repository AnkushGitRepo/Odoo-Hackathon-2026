import type { Response } from "express";

/** Success envelope per AGENTS.md API contract. */
export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data });
}

/** Error envelope per AGENTS.md API contract. */
export function fail(
  res: Response,
  status: number,
  code: string,
  error: string,
  details?: object,
): Response {
  return res.status(status).json({
    success: false,
    error,
    code,
    ...(details ? { details } : {}),
  });
}
