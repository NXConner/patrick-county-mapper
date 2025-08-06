import { useState, useCallback } from 'react';

export interface LocationCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface GeolocationState {
  coords: LocationCoords | null;
  loading: boolean;
  error: string | null;
  supported: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: false,
    error: null,
    supported: 'geolocation' in navigator
  });

  const getCurrentLocation = useCallback(async (): Promise<LocationCoords | null> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by this browser' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          setState(prev => ({ 
            ...prev, 
            coords, 
            loading: false, 
            error: null 
          }));
          
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: errorMessage 
          }));
          
          resolve(null);
        },
        options
      );
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      coords: null,
      loading: false,
      error: null,
      supported: 'geolocation' in navigator
    });
  }, []);

  return {
    ...state,
    getCurrentLocation,
    clearError,
    reset
  };
}

export default useGeolocation;