export function metersToMiles(distanceMeters: number): number {
  return distanceMeters / 1609.344;
}

export function mpsToMph(speedMps: number): number {
  return speedMps * 2.2369362921;
}

export function estimateFuelUsedLiters(distanceMeters: number, mpg: number = 25): number {
  const miles = metersToMiles(distanceMeters);
  const gallonsUsed = miles / Math.max(1e-6, mpg);
  return gallonsUsed * 3.785411784;
}

export function estimateTravelTimeSeconds(distanceMeters: number, avgSpeedMps: number): number {
  if (!avgSpeedMps || avgSpeedMps <= 0) return 0;
  return distanceMeters / avgSpeedMps;
}

