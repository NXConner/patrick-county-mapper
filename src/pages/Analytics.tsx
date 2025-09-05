import React, { useEffect, useMemo, useState } from 'react';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import { supabase } from '@/integrations/supabase/client';
import WorkspaceService from '@/services/WorkspaceService';
import type { PropertyInfo } from '@/hooks/usePropertyData';
import type { MeasurementData } from '@/hooks/useExportMeasurements';

const toWebMercator = (lat: number, lng: number) => {
  const x = (lng * 20037508.34) / 180;
  const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  return { x, y: (y * 20037508.34) / 180 };
};

const haversineMeters = (a: [number, number], b: [number, number]) => {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng));
  return R * c;
};

const polygonAreaSqMeters = (coords: [number, number][]) => {
  if (coords.length < 3) return 0;
  const proj = coords.map(([lat, lng]) => toWebMercator(lat, lng));
  let sum = 0;
  for (let i = 0; i < proj.length; i++) {
    const j = (i + 1) % proj.length;
    sum += proj[i].x * proj[j].y - proj[j].x * proj[i].y;
  }
  return Math.abs(sum / 2);
};

const AnalyticsPage: React.FC = () => {
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Load a slice of properties from Supabase
      const { data } = await supabase
        .from('properties')
        .select('parcel_id, owner_name, property_address, acreage, tax_value, zoning, latitude, longitude')
        .limit(250);
      const props: PropertyInfo[] = (data || []).map((p: any) => ({
        parcelId: p.parcel_id,
        owner: p.owner_name || undefined,
        address: p.property_address || undefined,
        acreage: p.acreage || 0,
        taxValue: p.tax_value || 0,
        zoning: p.zoning || 'Unknown',
        coordinates: (p.latitude && p.longitude) ? [p.latitude, p.longitude] : undefined,
      }));
      if (mounted) setProperties(props);

      // Load latest workspace to derive measurements from drawings
      const ws = await WorkspaceService.load('default');
      const feats: GeoJSON.Feature[] = (ws?.drawings?.features as any) || [];
      const ms: MeasurementData[] = [];
      feats.forEach((f, idx) => {
        if (!f.geometry) return;
        if (f.geometry.type === 'LineString') {
          const coords = (f.geometry.coordinates as number[][]).map(([lng, lat]) => [lat, lng] as [number, number]);
          let meters = 0;
          for (let i = 1; i < coords.length; i++) meters += haversineMeters(coords[i - 1], coords[i]);
          ms.push({ id: `m-${idx}`, type: 'distance', value: meters * 3.28084, unit: 'ft', coordinates: coords, timestamp: new Date(ws?.createdAt || Date.now()) });
        } else if (f.geometry.type === 'Polygon') {
          const ring = (f.geometry.coordinates[0] as number[][]).map(([lng, lat]) => [lat, lng] as [number, number]);
          const areaSqFt = polygonAreaSqMeters(ring) * 10.7639;
          ms.push({ id: `m-${idx}`, type: 'area', value: areaSqFt, unit: 'sqft', coordinates: ring, timestamp: new Date(ws?.createdAt || Date.now()) });
        } else if (f.geometry.type === 'Point') {
          const [lng, lat] = f.geometry.coordinates as number[];
          const coord = [lat, lng] as [number, number];
          ms.push({ id: `m-${idx}`, type: 'point', value: 0, unit: 'n/a', coordinates: [coord], timestamp: new Date(ws?.createdAt || Date.now()) });
        }
      });
      if (mounted) setMeasurements(ms);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const memoProps = useMemo(() => properties, [properties]);
  const memoMeasurements = useMemo(() => measurements, [measurements]);

  return (
    <div className="p-4 md:p-6">
      <AnalyticsDashboard properties={memoProps} measurements={memoMeasurements} />
    </div>
  );
};

export default AnalyticsPage;

