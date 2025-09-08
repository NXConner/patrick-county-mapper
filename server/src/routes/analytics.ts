import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

router.get("/analytics/geofence-time", requireRole("admin"), async (req: Request, res: Response) => {
  const { employeeId, from, to } = req.query as any;
  const start = from ? new Date(String(from)) : new Date(Date.now() - 7 * 86400000);
  const end = to ? new Date(String(to)) : new Date();
  const where: any = { at: { gte: start, lte: end } };
  if (employeeId) where.employeeId = String(employeeId);
  const events = await prisma.geofenceEvent.findMany({ where, orderBy: { at: "asc" } });
  // Aggregate naive: count enters/exits and durations per fence by pairing events
  const byFence = new Map<string, { seconds: number }>();
  const lastEnter = new Map<string, Date>();
  for (const e of events) {
    if (e.type === "entered") lastEnter.set(e.geofenceId, e.at);
    else if (e.type === "exited") {
      const startAt = lastEnter.get(e.geofenceId);
      if (startAt) {
        const secs = Math.max(0, (e.at.getTime() - startAt.getTime()) / 1000);
        const agg = byFence.get(e.geofenceId) || { seconds: 0 };
        agg.seconds += secs;
        byFence.set(e.geofenceId, agg);
        lastEnter.delete(e.geofenceId);
      }
    }
  }
  const result = Array.from(byFence.entries()).map(([geofenceId, v]) => ({ geofenceId, seconds: Math.round(v.seconds) }));
  res.json({ result });
});

router.get("/analytics/shift-summary", requireRole("admin"), async (_req: Request, res: Response) => {
  const shifts = await prisma.shift.groupBy({ by: ["employeeId"], _count: { _all: true } });
  res.json({ shifts });
});

router.get("/analytics/trip-stats", requireRole("admin"), async (req: Request, res: Response) => {
  const { employeeId, from, to } = req.query as any;
  const start = from ? new Date(String(from)) : new Date(Date.now() - 7 * 86400000);
  const end = to ? new Date(String(to)) : new Date();
  const tripWhere: any = { startAt: { gte: start, lte: end } };
  if (employeeId) tripWhere.employeeId = String(employeeId);
  const trips = await prisma.trip.findMany({ where: tripWhere });
  const totalMeters = trips.reduce((a, t) => a + t.distanceMeters, 0);
  const totalSeconds = trips.reduce((a, t) => a + t.durationSeconds, 0);
  res.json({ trips: trips.length, totalMeters, totalSeconds });
});

export default router;

