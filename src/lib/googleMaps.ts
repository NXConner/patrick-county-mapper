export type LatLng = { lat: number; lng: number };

let mapsApiKey: string | null = null;
let mapsPromise: Promise<any> | null = null;
let scriptInjected = false;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  interface Window {
    google?: any;
    __googleMapsReady__?: () => void;
  }
}

export function initGoogleMapsLoader(apiKey: string) {
  mapsApiKey = apiKey;
}

function injectGoogleScript(key: string): Promise<any> {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google);
  }
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Google Maps can only be loaded in a browser environment'));
      return;
    }

    const existing = document.querySelector('script[data-google-maps-sdk]') as HTMLScriptElement | null;
    if (existing && window.google?.maps) {
      resolve(window.google);
      return;
    }

    const script = existing || document.createElement('script');
    const libs = 'places,routes';
    const url = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=${libs}&callback=__googleMapsReady__`;
    script.src = url;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps-sdk', '1');

    window.__googleMapsReady__ = () => {
      resolve(window.google);
      try { delete window.__googleMapsReady__; } catch {}
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps JavaScript API'));
    };

    if (!scriptInjected) {
      document.head.appendChild(script);
      scriptInjected = true;
    }
  });

  return mapsPromise;
}

export async function loadGoogle(): Promise<any> {
  const key =
    mapsApiKey ||
    ((import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
    ((globalThis as any)?.process?.env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined);
  if (!key) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY');
  return injectGoogleScript(key);
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
  let result: any;
  try {
    result = await ds.route({
      origin,
      destination,
      travelMode: g.maps.TravelMode[mode],
      provideRouteAlternatives: false,
    });
  } catch {
    // Fallback to callback API if Promise API is unavailable
    result = await new Promise((resolve, reject) => {
      ds.route(
        {
          origin,
          destination,
          travelMode: g.maps.TravelMode[mode],
          provideRouteAlternatives: false,
        },
        (res: any, status: any) => {
          if ((status === 'OK' || status === g.maps.DirectionsStatus?.OK) && res) resolve(res);
          else reject(new Error(typeof status === 'string' ? status : 'Directions failed'));
        }
      );
    });
  }

  const route = result.routes?.[0];
  const leg = route?.legs?.[0];
  if (!route || !leg) return null;

  // Prefer overview polyline; otherwise compute from overview path
  let polyline: string =
    (route.overview_polyline as any)?.getEncodedPath?.() ||
    (route.overview_polyline as any)?.toString?.() ||
    '';

  if (!polyline) {
    const pathCandidates: any[] = Array.isArray(route.overview_path)
      ? route.overview_path
      : Array.isArray(leg?.steps)
        ? leg.steps.flatMap((s: any) => (Array.isArray(s.path) ? s.path : []))
        : [];
    if (pathCandidates.length > 0) {
      const points: LatLng[] = pathCandidates.map((p: any) => ({
        lat: typeof p.lat === 'function' ? p.lat() : p.lat,
        lng: typeof p.lng === 'function' ? p.lng() : p.lng,
      }));
      polyline = encodePolyline(points);
    }
  }

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

function encodePolyline(points: LatLng[]): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = '';

  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);

    result += encodeSignedNumber(lat - lastLat);
    result += encodeSignedNumber(lng - lastLng);

    lastLat = lat;
    lastLng = lng;
  }

  return result;
}

function encodeSignedNumber(num: number): string {
  let sgnNum = num << 1;
  if (num < 0) {
    sgnNum = ~sgnNum;
  }
  return encodeNumber(sgnNum);
}

function encodeNumber(num: number): string {
  let encoded = '';
  while (num >= 0x20) {
    const nextValue = (0x20 | (num & 0x1f)) + 63;
    encoded += String.fromCharCode(nextValue);
    num >>= 5;
  }
  num += 63;
  encoded += String.fromCharCode(num);
  return encoded;
}

