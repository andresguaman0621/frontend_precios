import { useQuery } from "@tanstack/react-query";

import * as sessionsApi from "@/api/sessions";
import { queryKeys } from "@/api/queries";
import * as sessionsRepo from "@/db/repos/sessions";
import { useNetworkStore } from "@/stores/network";

import type { LocalSession } from "@/db/repos/sessions";

export function useActiveSession() {
  const isOnline = useNetworkStore((s) => s.isConnected && s.isReachable);

  return useQuery<LocalSession | null>({
    queryKey: queryKeys.sessions.active(),
    queryFn: async () => {
      if (isOnline) {
        const remote = await sessionsApi.active();
        if (!remote) {
          // Si servidor dice no hay, sincronizar local: borrar INICIADAS huérfanas
          const local = await sessionsRepo.getActive();
          if (local && local.syncState === "synced") {
            await sessionsRepo.remove(local.id);
          }
          return null;
        }
        // Hidrata local con datos del servidor
        const { sesion } = remote;
        await sessionsRepo.upsert({
          id: sesion.id,
          clientUuid: `server-${sesion.id}`,
          mercadoId: sesion.mercado_id,
          mercadoNombre: sesion.mercado.nombre,
          numeroSemana: sesion.numero_semana,
          anio: sesion.anio,
          fechaInicio: sesion.fecha_inicio,
          fechaFin: sesion.fecha_fin,
          latInicio: sesion.lat_inicio ? parseFloat(sesion.lat_inicio) : null,
          lngInicio: sesion.lng_inicio ? parseFloat(sesion.lng_inicio) : null,
          accuracyInicio: sesion.accuracy_inicio,
          latFin: sesion.lat_fin ? parseFloat(sesion.lat_fin) : null,
          lngFin: sesion.lng_fin ? parseFloat(sesion.lng_fin) : null,
          accuracyFin: sesion.accuracy_fin,
          estado: sesion.estado,
          totalProductos: sesion.total_productos,
          comentarioSesion: sesion.comentario_sesion,
          syncState: "synced",
        });
        return sessionsRepo.getById(sesion.id);
      }
      // Offline: fallback a SQLite local
      return sessionsRepo.getActive();
    },
    staleTime: 60_000,
    retry: 0,
  });
}
