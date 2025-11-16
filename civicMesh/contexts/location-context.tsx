import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';

type LocationContextType = {
  userLocation: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const refreshLocation = async () => {
    await fetchLocation();
  };

  return (
    <LocationContext.Provider value={{ userLocation, isLoading, error, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
