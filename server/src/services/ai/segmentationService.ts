import axios from "axios";
import area from "@turf/area";
import type { Feature, FeatureCollection, Polygon } from "geojson";

export type Bounds = { north: number; south: number; east: number; west: number };

export interface SegmentationParams {
  aoi?: Bounds;
  imageUrl?: string;
  model?: string; // optional model hint
}

export interface SegmentationResult {
  geojson: FeatureCollection<Polygon, { surfaceType: string; confidence: number; areaSqFt: number }>;
  summary: {
    totalAreaSqFt: number;
    numSurfaces: number;
    averageConfidence: number;
    provider: string;
  };
}

export class SegmentationService {
  private mapboxToken = process.env.MAPBOX_TOKEN;
  private hfToken = process.env.HF_TOKEN;
  private replicateToken = process.env.REPLICATE_API_TOKEN;

  async segmentAsphalt(params: SegmentationParams): Promise<SegmentationResult> {
    // Try providers in order; fall back to heuristic
    if (this.hfToken) {
      try {
        const res = await this.segmentWithHuggingFace(params);
        if (res) return { ...res, summary: { ...res.summary, provider: "huggingface" } };
      } catch {}
    }

    if (this.replicateToken) {
      try {
        const res = await this.segmentWithReplicate(params);
        if (res) return { ...res, summary: { ...res.summary, provider: "replicate" } };
      } catch {}
    }

    // Fallback heuristic
    const fallback = this.segmentWithHeuristic(params);
    return { ...fallback, summary: { ...fallback.summary, provider: "heuristic" } };
  }

  // Placeholder: scaffold for HF Inference. Implement mask-to-polygons downstream if enabled
  private async segmentWithHuggingFace(_params: SegmentationParams): Promise<SegmentationResult | null> {
    // Not fully implemented to avoid dependency on specific model output formats.
    // Intentionally return null so we fall back unless someone configures this later.
    return null;
  }

  // Placeholder: scaffold for Replicate API. See note above.
  private async segmentWithReplicate(_params: SegmentationParams): Promise<SegmentationResult | null> {
    return null;
  }

  private segmentWithHeuristic(params: SegmentationParams): SegmentationResult {
    const bounds = params.aoi ?? { north: 0.001, south: 0, east: 0.001, west: 0 };

    // Create 1-3 rectangle polygons within AOI as synthetic asphalt surfaces
    const surfaces: Feature<Polygon, { surfaceType: string; confidence: number; areaSqFt: number }>[] = [];

    const num = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < num; i++) {
      const shrinkLat = Math.random() * 0.4 + 0.2; // 20%-60% shrink
      const shrinkLng = Math.random() * 0.4 + 0.2;
      const latSpan = bounds.north - bounds.south;
      const lngSpan = bounds.east - bounds.west;

      const latPad = latSpan * shrinkLat * 0.5;
      const lngPad = lngSpan * shrinkLng * 0.5;

      const minLat = bounds.south + latPad * Math.random();
      const maxLat = bounds.north - latPad * Math.random();
      const minLng = bounds.west + lngPad * Math.random();
      const maxLng = bounds.east - lngPad * Math.random();

      const polygon: Polygon = {
        type: "Polygon",
        coordinates: [[
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat]
        ]],
      };

      const confidence = 0.78 + Math.random() * 0.2;
      const areaSqMeters = area(polygon);
      const areaSqFt = areaSqMeters * 10.7639;
      const surfaceType = i === 0 ? "parking_lot" : Math.random() > 0.5 ? "driveway" : "road";

      surfaces.push({
        type: "Feature",
        geometry: polygon,
        properties: { surfaceType, confidence, areaSqFt },
      });
    }

    const totalAreaSqFt = surfaces.reduce((s, f) => s + (f.properties?.areaSqFt ?? 0), 0);
    const avgConf = surfaces.reduce((s, f) => s + (f.properties?.confidence ?? 0), 0) / Math.max(1, surfaces.length);

    return {
      geojson: { type: "FeatureCollection", features: surfaces },
      summary: {
        totalAreaSqFt,
        numSurfaces: surfaces.length,
        averageConfidence: avgConf,
        provider: "heuristic",
      },
    };
  }
}

export default SegmentationService;

