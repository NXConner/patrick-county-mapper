import { prisma } from "../db.js";
import { isInsideGeofence } from "../utils/geofence.js";

export async function evaluateGeofencesForEmployee(
  employeeId: string,
  lat: number,
  lng: number,
  at: Date,
): Promise<{ entered: string[]; exited: string[] }> {
  const geofences = await prisma.geofence.findMany({ where: { isActive: true } });
  const statuses = await prisma.geofenceStatus.findMany({ where: { employeeId } });
  const statusByGeofenceId = new Map(statuses.map((s) => [s.geofenceId, s]));

  const entered: string[] = [];
  const exited: string[] = [];

  for (const gf of geofences) {
    const inside = isInsideGeofence(gf as any, lat, lng);
    const prev = statusByGeofenceId.get(gf.id);
    if (!prev) {
      await prisma.geofenceStatus.create({ data: { employeeId, geofenceId: gf.id, isInside: inside, lastChangedAt: at } });
      if (inside) {
        entered.push(gf.id);
        await prisma.geofenceEvent.create({ data: { employeeId, geofenceId: gf.id, type: "entered", at, lat, lng } });
      }
      continue;
    }
    if (prev.isInside !== inside) {
      await prisma.geofenceStatus.update({ where: { id: prev.id }, data: { isInside: inside, lastChangedAt: at } });
      if (inside) {
        entered.push(gf.id);
        await prisma.geofenceEvent.create({ data: { employeeId, geofenceId: gf.id, type: "entered", at, lat, lng } });
      } else {
        exited.push(gf.id);
        await prisma.geofenceEvent.create({ data: { employeeId, geofenceId: gf.id, type: "exited", at, lat, lng } });
      }
    }
  }

  return { entered, exited };
}

