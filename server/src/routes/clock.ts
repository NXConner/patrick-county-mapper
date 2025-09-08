import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";

const router = Router();

// naive auth middleware: expects req.userId set by outer auth middleware
function requireUser(req: Request & { userId?: string }, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.post("/clock-in", requireUser, async (req: Request & { userId?: string }, res: Response) => {
  const userId: string = String(req.userId);
  const { timestamp, location } = req.body ?? {};
  const clockInAt = timestamp ? new Date(timestamp) : new Date();
  const shift = await prisma.shift.create({
    data: {
      employeeId: userId,
      clockInAt,
      clockInLoc: location ? location : undefined,
      status: "open",
    },
  });
  return res.json({ id: shift.id, clockInAt: shift.clockInAt });
});

router.post("/clock-out", requireUser, async (req: Request & { userId?: string }, res: Response) => {
  const userId: string = String(req.userId);
  const { timestamp, location } = req.body ?? {};
  const clockOutAt = timestamp ? new Date(timestamp) : new Date();
  // Close latest open shift
  const openShift = await prisma.shift.findFirst({ where: { employeeId: userId, status: "open" }, orderBy: { clockInAt: "desc" } });
  if (!openShift) return res.status(400).json({ error: "No open shift" });
  const shift = await prisma.shift.update({
    where: { id: openShift.id },
    data: { clockOutAt, clockOutLoc: location ? location : undefined, status: "closed" },
  });
  return res.json({ id: shift.id, clockOutAt: shift.clockOutAt });
});

export default router;

