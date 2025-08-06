import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface UseGpsLocationReturn {
  location: GpsLocation | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
  isSupported: boolean;
}

export const useGpsLocation = (autoRequest: boolean = false): UseGpsLocationReturn => {
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = 'geolocation' in navigator;

  const requestLocation = useCallback(() => {
    if (!isSupported) {
      const errorMsg = 'Geolocation is not supported by this browser';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: GpsLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        setLocation(newLocation);
        setIsLoading(false);
        toast.success('Current location found');
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        toast.error(errorMessage);
      },
      options
    );
  }, [isSupported]);

  useEffect(() => {
    if (autoRequest && isSupported) {
      requestLocation();
    }
  }, [autoRequest, isSupported, requestLocation]);

  return {
    location,
    isLoading,
    error,
    requestLocation,
    isSupported
  };
};