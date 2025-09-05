import { Loader } from '@googlemaps/js-api-loader';

export type LatLng = { lat: number; lng: number };

let mapsLoader: Loader | null = null;
let mapsPromise: Promise<typeof google> | null = null;

export function initGoogleMapsLoader(apiKey: string) {
  if (!mapsLoader) {
    mapsLoader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'routes'],
    });
  }
}

export async function loadGoogle(): Promise<typeof google> {
  if (!mapsLoader) {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!key) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY');
    initGoogleMapsLoader(key);
  }
  if (!mapsPromise) {
    mapsPromise = mapsLoader!.load();
  }
  return mapsPromise;
}

export type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

export interface DirectionsLegSummary {
  polyline: string; // encoded polyline
  distanceText?: string;
  durationText?: string;
}

export async function computeDirections(
  origin: LatLng,
  destination: LatLng,
  mode: TravelMode = 'DRIVING'
): Promise<DirectionsLegSummary | null> {
  const g = await loadGoogle();

  const ds = new g.maps.DirectionsService();
  const result = await ds.route({
    origin,
    destination,
    travelMode: g.maps.TravelMode[mode],
    provideRouteAlternatives: false,
  });

  const route = result.routes?.[0];
  const leg = route?.legs?.[0];
  if (!route || !leg) return null;

  // Prefer overview polyline for simplicity
  const polyline = (route.overview_polyline as any)?.getEncodedPath?.() || (route.overview_polyline as any)?.toString?.() || '';

  return {
    polyline,
    distanceText: leg.distance?.text,
    durationText: leg.duration?.text,
  };
}

// Utility to decode encoded polylines to Leaflet latlngs
export function decodePolyline(encoded: string): LatLng[] {
  // Adapted lightweight decoder
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return coordinates;
}

