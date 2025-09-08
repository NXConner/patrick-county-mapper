import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";
import { DateTime } from "luxon";
import geolib from "geolib";

const router = Router();

function requireUser(req: Request & { userId?: string }, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// Helper to determine moving vs stationary with simple threshold
function isMovingThreshold(speedMps?: number, lastPoint?: { lat: number; lng: number; ts: number }, point?: { lat: number; lng: number; ts: number }): boolean | undefined {
  if (speedMps != null) return speedMps > 0.8; // ~3 km/h
  if (lastPoint && point) {
    const meters = geolib.getDistance({ latitude: lastPoint.lat, longitude: lastPoint.lng }, { latitude: point.lat, longitude: point.lng });
    const seconds = Math.max(1, (point.ts - lastPoint.ts) / 1000);
    const calcSpeed = meters / seconds;
    return calcSpeed > 0.8;
  }
  return undefined;
}

router.post("/locations", requireUser, async (req: Request & { userId?: string }, res: Response) => {
  const userId: string = String(req.userId);
  const { samples } = req.body ?? {};
  if (!Array.isArray(samples) || samples.length === 0) return res.status(400).json({ error: "No samples" });

  // Fetch last location for movement heuristic
  const last = await prisma.locationSample.findFirst({ where: { employeeId: userId }, orderBy: { timestamp: "desc" } });
  const lastPoint = last ? { lat: last.lat, lng: last.lng, ts: last.timestamp.getTime() } : undefined;

  const toCreate = samples.map((s: any) => {
    const ts = DateTime.fromISO(s.timestamp ?? new Date().toISOString()).toJSDate();
    const moving = isMovingThreshold(s.speedMps, lastPoint, s.lat && s.lng ? { lat: s.lat, lng: s.lng, ts: DateTime.fromISO(s.timestamp ?? new Date().toISOString()).toMillis() } : undefined);
    const row = {
      timestamp: ts,
      employeeId: userId,
      deviceId: s.deviceId,
      lat: s.lat,
      lng: s.lng,
      accuracyMeters: s.accuracyMeters,
      altitudeMeters: s.altitudeMeters,
      speedMps: s.speedMps,
      headingDeg: s.headingDeg,
      isMoving: moving ?? null,
      source: s.source,
    };
    return row;
  });

  const created = await prisma.locationSample.createMany({ data: toCreate });
  res.json({ inserted: created.count });
});

router.post("/phone-usage", requireUser, async (req: Request & { userId?: string }, res: Response) => {
  const userId: string = String(req.userId);
  const { events } = req.body ?? {};
  if (!Array.isArray(events) || events.length === 0) return res.status(400).json({ error: "No events" });
  const toCreate = events.map((e: any) => ({
    timestamp: new Date(e.timestamp ?? Date.now()),
    employeeId: userId,
    deviceId: e.deviceId,
    event: e.event,
    appPackage: e.appPackage,
    durationSec: e.durationSec,
    metadata: e.metadata,
  }));
  const created = await prisma.phoneUsage.createMany({ data: toCreate });
  res.json({ inserted: created.count });
});

export default router;

