import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";

export function requireAuth(req: Request & { userId?: string }, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
}

export function requireRole(role: string) {
  return async (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await prisma.employee.findUnique({ where: { id: String(req.userId) } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.role !== role) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

