import { useEffect } from "react";

import { useResponsive } from "./useResponsive";

/**
 * Bloquea la orientación a portrait en teléfonos y la libera en tablets.
 *
 * `expo-screen-orientation` se importa dinámicamente: si no está instalado
 * (Expo Go) o falla la carga, el hook es no-op silencioso. Eso permite que
 * el bundle siga compilando aún antes de `expo install expo-screen-orientation`.
 */
export function useDeviceOrientationLock(): void {
  const { isTablet } = useResponsive();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const ScreenOrientation = require("expo-screen-orientation");
        if (cancelled) return;
        if (isTablet) {
          await ScreenOrientation.unlockAsync();
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch {
        // expo-screen-orientation no disponible (Expo Go o paquete no instalado).
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isTablet]);
}
