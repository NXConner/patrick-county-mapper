import { prisma } from "../db.js";
import geolib from "geolib";
import { estimateFuelUsedLiters } from "../utils/metrics.js";

export async function upsertTripForMovement(
  employeeId: string,
  at: Date,
  lat: number,
  lng: number,
  speedMps?: number | null,
): Promise<void> {
  const recent = await prisma.trip.findFirst({ where: { employeeId, endAt: null }, orderBy: { startAt: "desc" } });
  if (!recent) {
    // start a new trip if moving
    if (speedMps && speedMps > 1.4) {
      await prisma.trip.create({ data: { employeeId, startAt: at, startLat: lat, startLng: lng } });
    }
    return;
  }

  // update ongoing trip
  const lastLoc = await prisma.locationSample.findFirst({ where: { employeeId }, orderBy: { timestamp: "desc" } });
  if (!lastLoc) return;
  const distance = geolib.getDistance({ latitude: lastLoc.lat, longitude: lastLoc.lng }, { latitude: lat, longitude: lng });
  const durationSec = Math.max(1, (at.getTime() - recent.startAt.getTime()) / 1000);
  const totalMeters = recent.distanceMeters + distance;
  const avgSpeed = totalMeters / durationSec;
  const maxSpeed = Math.max(recent.maxSpeedMps ?? 0, speedMps ?? 0);
  const fuel = estimateFuelUsedLiters(totalMeters);
  await prisma.trip.update({
    where: { id: recent.id },
    data: {
      distanceMeters: totalMeters,
      durationSeconds: Math.floor(durationSec),
      avgSpeedMps: avgSpeed,
      maxSpeedMps: maxSpeed,
      fuelUsedLiters: fuel,
    },
  });

  // Close trip if stopped for > 3 minutes or speed is very low
  if (!speedMps || speedMps < 0.5) {
    const lastMoving = await prisma.locationSample.findFirst({ where: { employeeId, isMoving: true }, orderBy: { timestamp: "desc" } });
    if (lastMoving) {
      const stoppedMs = at.getTime() - lastMoving.timestamp.getTime();
      if (stoppedMs > 3 * 60 * 1000) {
        await prisma.trip.update({ where: { id: recent.id }, data: { endAt: at, endLat: lat, endLng: lng } });
      }
    }
  }
}

export async function driverPassengerHeuristic(employeeId: string, at: Date): Promise<boolean | null> {
  // simplistic rule: if there are phone usage events overlapping with moving at high speed, likely passenger
  const lastUsage = await prisma.phoneUsage.findFirst({ where: { employeeId }, orderBy: { timestamp: "desc" } });
  const lastLoc = await prisma.locationSample.findFirst({ where: { employeeId }, orderBy: { timestamp: "desc" } });
  if (!lastLoc) return null;
  if (lastLoc.speedMps && lastLoc.speedMps > 6.7) { // > 15 mph
    if (lastUsage && at.getTime() - lastUsage.timestamp.getTime() < 2 * 60 * 1000) return false; // passenger
    return true; // assume driver
  }
  return null;
}

