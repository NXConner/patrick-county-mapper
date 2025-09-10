import type { Geofence } from "@prisma/client";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";

export function isInsideGeofence(
  geofence: Geofence,
  lat: number,
  lng: number,
): boolean {
  if (!geofence.isActive) return false;
  if (geofence.type === "circle") {
    if (geofence.centerLat == null || geofence.centerLng == null || geofence.radiusMeters == null) return false;
    const toMeters = distanceMeters(geofence.centerLat, geofence.centerLng, lat, lng);
    return toMeters <= geofence.radiusMeters;
  }
  if (geofence.type === "polygon" && geofence.polygon) {
    const p = point([lng, lat]);
    const poly = polygon(geofence.polygon as any);
    return booleanPointInPolygon(p, poly);
  }
  return false;
}

export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Haversine
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

