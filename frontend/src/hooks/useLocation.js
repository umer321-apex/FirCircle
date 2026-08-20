import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [coords, setCoords] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setPermissionDenied(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setPermissionDenied(true);
        setIsLoading(false);
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const result = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setCoords(result);
      return result;
    } catch (err) {
      console.error(`[useLocation.getCurrentLocation] Error: ${err.message}`);
      setError('Could not get your location. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { coords, permissionDenied, isLoading, error, getCurrentLocation };
};