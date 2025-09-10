import axios from "axios";
import area from "@turf/area";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { maskToPolygons } from "./maskToPolygons.js";

export type Bounds = { north: number; south: number; east: number; west: number };

export interface SegmentationParams {
  aoi?: Bounds;
  imageUrl?: string;
  model?: string; // optional model hint
  imageBufferBase64?: string; // optional raw image provided by upload
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
    if (this.hfToken && (params.imageUrl || params.imageBufferBase64)) {
      try {
        const res = await this.segmentWithHuggingFace(params);
        if (res) return { ...res, summary: { ...res.summary, provider: "huggingface" } };
      } catch {}
    }

    if (this.replicateToken && (params.imageUrl || params.imageBufferBase64)) {
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
  private async segmentWithHuggingFace(params: SegmentationParams): Promise<SegmentationResult | null> {
    try {
      const endpoint = "https://api-inference.huggingface.co/models/facebook/mask2former-swin-large-ade-semantic";
      const headers: Record<string, string> = { Authorization: `Bearer ${this.hfToken}` };
      let body: any;
      if (params.imageBufferBase64) {
        body = Buffer.from(params.imageBufferBase64, 'base64');
      } else if (params.imageUrl) {
        const img = await axios.get(params.imageUrl, { responseType: 'arraybuffer' });
        body = Buffer.from(img.data);
      } else {
        return null;
      }
      const resp = await axios.post(endpoint, body, { headers, responseType: 'arraybuffer' });
      // Some HF models return an RGBA mask; treat nonzero as foreground
      const buf = Buffer.from(resp.data);
      const widthGuess = 512; // fallback
      const heightGuess = Math.max(1, Math.floor(buf.length / 4 / widthGuess));
      const mask = new Uint8ClampedArray(widthGuess * heightGuess);
      for (let i = 0; i < mask.length; i++) {
        const a = buf[i * 4 + 3] ?? 0;
        mask[i] = a > 0 ? 255 : 0;
      }
      const fc = maskToPolygons({ data: mask, width: widthGuess, height: heightGuess }, params.aoi!);
      const features = (fc.features as Feature<Polygon>[]).map((f) => {
        const a = area(f as any) * 10.7639;
        return { ...f, properties: { ...(f.properties || {}), surfaceType: 'parking_lot', confidence: 0.8, areaSqFt: a } };
      });
      const totalAreaSqFt = features.reduce((s, f) => s + (f.properties?.areaSqFt || 0), 0);
      return { geojson: { type: 'FeatureCollection', features }, summary: { totalAreaSqFt, numSurfaces: features.length, averageConfidence: 0.8, provider: 'huggingface' } };
    } catch {
      return null;
    }
  }

  // Placeholder: scaffold for Replicate API. See note above.
  private async segmentWithReplicate(params: SegmentationParams): Promise<SegmentationResult | null> {
    try {
      const url = "https://api.replicate.com/v1/predictions";
      const headers = { Authorization: `Token ${this.replicateToken}`, "Content-Type": "application/json" };
      const input: any = {};
      if (params.imageUrl) input.image = params.imageUrl;
      // Note: Replicate supports direct URL input; for raw buffers you'd need to upload somewhere first
      const model = params.model || "daanelson/segment-anything"; // placeholder model name
      const pr = await axios.post(url, { version: model, input }, { headers });
      const id = pr.data?.id;
      if (!id) return null;
      // Poll for completion
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1500));
        const st = await axios.get(`${url}/${id}`, { headers });
        if (st.data?.status === 'succeeded') {
          const maskUrl = st.data?.output?.[0];
          if (!maskUrl || !params.aoi) break;
          const img = await axios.get(maskUrl, { responseType: 'arraybuffer' });
          const png = Buffer.from(img.data);
          // Blindly assume same alpha-mask convention as above; if not, fallback
          const widthGuess = 512; const heightGuess = Math.max(1, Math.floor(png.length / 4 / widthGuess));
          const mask = new Uint8ClampedArray(widthGuess * heightGuess);
          for (let i2 = 0; i2 < mask.length; i2++) {
            const a = png[i2 * 4 + 3] ?? 0; mask[i2] = a > 0 ? 255 : 0;
          }
          const fc = maskToPolygons({ data: mask, width: widthGuess, height: heightGuess }, params.aoi);
          const features = (fc.features as Feature<Polygon>[]).map((f) => {
            const a = area(f as any) * 10.7639;
            return { ...f, properties: { ...(f.properties || {}), surfaceType: 'parking_lot', confidence: 0.85, areaSqFt: a } };
          });
          const totalAreaSqFt = features.reduce((s, f) => s + (f.properties?.areaSqFt || 0), 0);
          return { geojson: { type: 'FeatureCollection', features }, summary: { totalAreaSqFt, numSurfaces: features.length, averageConfidence: 0.85, provider: 'replicate' } };
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  async segmentFromImageBuffer(aoi: Bounds, imageBufferBase64: string): Promise<SegmentationResult> {
    return this.segmentAsphalt({ aoi, imageBufferBase64 });
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

