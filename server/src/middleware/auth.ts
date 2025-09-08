import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export function attachUser(req: Request & { userId?: string }, _res: Response, next: NextFunction) {
  const header = req.headers["authorization"];
  if (!header) return next();
  const token = header.replace(/^Bearer\s+/i, "").trim();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as any;
    if (payload && payload.sub) req.userId = String(payload.sub);
  } catch {
    // ignore invalid token
  }
  next();
}

