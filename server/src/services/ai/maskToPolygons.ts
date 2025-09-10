// Minimal marching-squares based mask->polygon extraction for binary masks
// Input: Uint8ClampedArray mask with width/height; any non-zero is foreground
// Output: GeoJSON Polygon features in lon/lat space using AOI bounds

import type { Feature, FeatureCollection, Polygon } from "geojson";

export interface RasterMask {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface Bounds {
  north: number; south: number; east: number; west: number;
}

export function maskToPolygons(mask: RasterMask, aoi: Bounds): FeatureCollection<Polygon> {
  // Very lightweight contour approximation: sample grid and trace edges
  // For production, consider robust libraries like potrace, opencv, or @mapbox/martini for iso-lines.
  const features: Feature<Polygon>[] = [];
  const { width, height, data } = mask;

  const toLonLat = (x: number, y: number): [number, number] => {
    const lon = aoi.west + (x / (width - 1)) * (aoi.east - aoi.west);
    const lat = aoi.south + (y / (height - 1)) * (aoi.north - aoi.south);
    return [lon, lat];
  };

  // Simple connected component labeling over a coarse grid to create boxes
  const visited = new Uint8Array(width * height);
  const idx = (x: number, y: number) => y * width + x;

  const inBounds = (x: number, y: number) => x >= 0 && x < width && y >= 0 && y < height;
  const isOn = (x: number, y: number) => {
    const i = idx(x, y);
    const v = data?.[i] ?? 0;
    return v > 0;
  };

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = idx(x, y);
      if (visited[i] || !isOn(x, y)) continue;
      // BFS to find component bounds
      let minX = x, maxX = x, minY = y, maxY = y;
      const q: [number, number][] = [[x, y]];
      visited[i] = 1;
      while (q.length) {
        const [cx, cy] = q.shift()!;
        minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
        const neigh: Array<[number, number]> = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const off of neigh) {
          const nx = cx + off[0]; const ny = cy + off[1];
          if (!inBounds(nx, ny)) continue;
          const ni = idx(nx, ny);
          if (!visited[ni] && isOn(nx, ny)) { visited[ni] = 1; q.push([nx, ny]); }
        }
      }
      // Create a rectangle polygon around the component as a coarse approximation
      const ring = [
        toLonLat(minX, minY),
        toLonLat(maxX, minY),
        toLonLat(maxX, maxY),
        toLonLat(minX, maxY),
        toLonLat(minX, minY),
      ];
      features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} });
    }
  }

  return { type: 'FeatureCollection', features };
}

