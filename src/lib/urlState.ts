export type MapUrlState = {
  lat: number;
  lng: number;
  z: number;
  svc?: string;
  layers?: Record<string, boolean>;
};

const PARAM = 's';

export function encodeState(state: MapUrlState): string {
  const payload = JSON.stringify(state);
  return btoa(unescape(encodeURIComponent(payload)));
}

export function decodeState(param: string | null): MapUrlState | null {
  if (!param) return null;
  try {
    const json = decodeURIComponent(escape(atob(param)));
    const parsed = JSON.parse(json);
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && typeof parsed.z === 'number') {
      return parsed as MapUrlState;
    }
  } catch {}
  return null;
}

export function getStateFromUrl(): MapUrlState | null {
  const url = new URL(window.location.href);
  return decodeState(url.searchParams.get(PARAM));
}

export function setStateInUrl(state: MapUrlState, replace = true): void {
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, encodeState(state));
  if (replace) {
    window.history.replaceState({}, '', url.toString());
  } else {
    window.history.pushState({}, '', url.toString());
  }
}

