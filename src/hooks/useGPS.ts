import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

export type GpsStatus =
  | "idle"
  | "requesting"
  | "ok"
  | "low_accuracy"
  | "denied"
  | "error";

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface UseGpsResult {
  status: GpsStatus;
  location: GpsLocation | null;
  accuracy: number | null;
  error: string | null;
  request: () => Promise<void>;
  reset: () => void;
}

const GOOD_ACCURACY_M = 50;
const LOW_ACCURACY_LIMIT_M = 200;
const TIMEOUT_MS = 30_000;

export function useGPS(): UseGpsResult {
  const [status, setStatus] = useState<GpsStatus>("idle");
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const cancelledRef = useRef(false);

  const stopWatching = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    cancelledRef.current = true;
    stopWatching();
  }, [stopWatching]);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    stopWatching();
    setStatus("idle");
    setLocation(null);
    setError(null);
  }, [stopWatching]);

  const request = useCallback(async () => {
    cancelledRef.current = false;
    setError(null);
    setStatus("requesting");

    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setStatus("denied");
        setError("permission_denied");
        return;
      }

      // Lectura inicial
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (cancelledRef.current) return;
      setLocation({
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
        accuracy: initial.coords.accuracy ?? null,
      });
      if ((initial.coords.accuracy ?? Number.MAX_VALUE) <= GOOD_ACCURACY_M) {
        setStatus("ok");
        return;
      }

      // Watch hasta lograr accuracy ≤ 50m o agotar 30s
      const startTs = Date.now();
      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (pos) => {
          if (cancelledRef.current) return;
          const acc = pos.coords.accuracy ?? Number.MAX_VALUE;
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
          });
          if (acc <= GOOD_ACCURACY_M) {
            setStatus("ok");
            stopWatching();
          } else if (Date.now() - startTs >= TIMEOUT_MS) {
            setStatus(acc <= LOW_ACCURACY_LIMIT_M ? "low_accuracy" : "error");
            stopWatching();
          }
        },
      );

      // Timeout máximo
      setTimeout(() => {
        if (cancelledRef.current) return;
        if (status !== "ok") {
          const acc = location?.accuracy ?? Number.MAX_VALUE;
          setStatus(acc <= LOW_ACCURACY_LIMIT_M ? "low_accuracy" : "error");
          stopWatching();
        }
      }, TIMEOUT_MS);
    } catch (e) {
      if (cancelledRef.current) return;
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopWatching]);

  return {
    status,
    location,
    accuracy: location?.accuracy ?? null,
    error,
    request,
    reset,
  };
}
