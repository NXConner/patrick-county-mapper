import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Leaflet
vi.mock('leaflet', () => ({
  map: vi.fn(),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn(),
    bindPopup: vi.fn(),
  })),
  divIcon: vi.fn(),
  Marker: {
    prototype: {
      options: {},
    },
  },
  geoJSON: vi.fn(() => ({
    addTo: vi.fn(),
    removeFrom: vi.fn(),
  })),
  polygon: vi.fn(() => ({
    addTo: vi.fn(),
    getArea: vi.fn(() => 1000),
    getBounds: vi.fn(),
  })),
  polyline: vi.fn(() => ({
    addTo: vi.fn(),
    getDistance: vi.fn(() => 100),
  })),
  control: {
    scale: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    layers: vi.fn(() => ({
      addTo: vi.fn(),
    })),
  },
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn((success) => {
    success({
      coords: {
        latitude: 36.6885,
        longitude: -80.2735,
        accuracy: 10,
      },
    });
  }),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage with in-memory implementation
const createLocalStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  } as unknown as Storage;
};

Object.defineProperty(window, 'localStorage', {
  value: createLocalStorageMock(),
  configurable: true,
});

// Mock crypto.randomUUID
Object.defineProperty(global.crypto, 'randomUUID', {
  value: vi.fn(() => 'mock-uuid-123'),
});

// Mock URL.createObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
  value: vi.fn(() => 'mock-url'),
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  value: vi.fn(),
});

// Mock service worker
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: vi.fn(() => Promise.resolve({})),
    ready: Promise.resolve({}),
  },
});

// Suppress console errors in tests unless debugging
beforeAll(() => {
  if (!process.env.DEBUG_TESTS) {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  }
});