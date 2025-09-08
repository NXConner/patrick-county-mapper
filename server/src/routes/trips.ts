import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";

const router = Router();

function requireUser(req: Request & { userId?: string }, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.get("/trips", requireUser, async (req: Request & { userId?: string }, res: Response) => {
  const userId: string = String(req.userId);
  const trips = await prisma.trip.findMany({ where: { employeeId: userId }, orderBy: { startAt: "desc" } });
  res.json(trips);
});

export default router;

