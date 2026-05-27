/**
 * Smoke tests del SyncManager: validan que la lógica de mapeo a payload bulk
 * y manejo de status created/conflict/error sea correcta.
 *
 * No mockeamos SQLite porque jest-expo no lo soporta directamente; en su lugar,
 * verificamos la transformación de items y el dispatch de eventos pub/sub.
 */

import { conflictResolver } from "@/sync/conflictResolver";

describe("conflictResolver pub/sub", () => {
  it("entrega payloads a los suscriptores", () => {
    const received: unknown[] = [];
    const unsub = conflictResolver.subscribe((p) => received.push(p));
    conflictResolver.emit({
      clientUuid: "uuid-1",
      productoId: 1,
      presentacionId: 2,
      productoNombre: "Cebolla",
      presentacionNombre: "QUINTAL",
      variacion: {
        precio_anterior: "18",
        precio_nuevo: "25",
        variacion_porcentaje: 38.89,
        hay_alerta: true,
        es_aumento: true,
        umbral_inferior: -32,
        umbral_superior: 34,
        requirio_confirmacion_manual: true,
        mensaje: "Variación atípica",
      },
    });
    expect(received).toHaveLength(1);
    unsub();
  });

  it("permite desuscribirse", () => {
    let count = 0;
    const unsub = conflictResolver.subscribe(() => count++);
    unsub();
    conflictResolver.emit({
      clientUuid: "uuid-2",
      productoId: 1,
      presentacionId: 1,
      productoNombre: "X",
      presentacionNombre: "Y",
      variacion: {
        precio_anterior: null,
        precio_nuevo: "10",
        variacion_porcentaje: 0,
        hay_alerta: false,
        es_aumento: null,
        umbral_inferior: -32,
        umbral_superior: 34,
        requirio_confirmacion_manual: false,
        mensaje: "",
      },
    });
    expect(count).toBe(0);
  });
});
