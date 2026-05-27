import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ChevronLeft, MapPin, CheckCircle2, AlertTriangle, XCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as sessionsApi from "@/api/sessions";
import { queryKeys } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import * as catalogRepo from "@/db/repos/catalog";
import * as marketsRepo from "@/db/repos/markets";
import * as sessionsRepo from "@/db/repos/sessions";
import { useGPS } from "@/hooks/useGPS";
import { useNetwork } from "@/hooks/useNetwork";
import { useAuthStore } from "@/stores/auth";
import { toast } from "@/stores/toast";
import { colors } from "@/theme/colors";
import { calcularNumeroSemanaAnio } from "@/utils/week";

import type { Market } from "@/db/repos/markets";

export default function StartSessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { isOnline } = useNetwork();

  const supervisorMarketIds = useMemo(
    () =>
      user?.asignaciones
        .filter((a) => a.rol_codigo === "SUPERVISOR")
        .map((a) => a.mercado_id) ?? [],
    [user],
  );

  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
  const [preflight, setPreflight] = useState<{
    puede: boolean;
    mensaje: string;
    tomasEnSemana: number;
    maxTomas: number;
  } | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const gps = useGPS();

  useEffect(() => {
    (async () => {
      const all = await marketsRepo.list();
      const filtered = all.filter((m) => supervisorMarketIds.includes(m.id));
      setMarkets(filtered);
      if (filtered.length === 1) {
        setSelectedMarketId(filtered[0]!.id);
      }
    })();
  }, [supervisorMarketIds]);

  const runPreflight = useCallback(
    async (marketId: number) => {
      setPreflightLoading(true);
      try {
        if (isOnline) {
          const cs = await sessionsApi.canStart(marketId);
          setPreflight({
            puede: cs.puede,
            mensaje: cs.mensaje,
            tomasEnSemana: cs.tomas_en_semana,
            maxTomas: cs.max_tomas,
          });
        } else {
          const [semana, anio] = calcularNumeroSemanaAnio(new Date());
          const local = await sessionsRepo.listByMarketInWeek(marketId, semana, anio);
          const completed = local.filter((s) => s.estado === "COMPLETADA").length;
          const hasActive = await sessionsRepo.getActive();
          setPreflight({
            puede: !hasActive && completed < 2,
            mensaje: hasActive
              ? "Ya tienes una toma iniciada."
              : completed >= 2
                ? "Has alcanzado el límite de tomas en este mercado esta semana."
                : "Modo offline — se sincronizará al volver la red.",
            tomasEnSemana: local.length,
            maxTomas: 2,
          });
        }
      } catch (e) {
        if (isAxiosError(e)) {
          toast.error(
            (e.response?.data as { detail?: string } | undefined)?.detail ??
              "No se pudo validar el inicio.",
          );
        }
        setPreflight(null);
      } finally {
        setPreflightLoading(false);
      }
    },
    [isOnline],
  );

  useEffect(() => {
    if (selectedMarketId) runPreflight(selectedMarketId);
  }, [selectedMarketId, runPreflight]);

  const startSession = useCallback(async () => {
    if (!selectedMarketId) return;
    if (!isOnline) {
      toast.error("Necesitas conexión la primera vez para descargar el catálogo del mercado.");
      return;
    }
    setSubmitting(true);
    try {
      const session = await sessionsApi.create({
        mercado_id: selectedMarketId,
        lat_inicio: gps.location ? gps.location.latitude.toString() : null,
        lng_inicio: gps.location ? gps.location.longitude.toString() : null,
        accuracy_inicio: gps.location?.accuracy ?? null,
      });

      const catalog = await sessionsApi.catalog(session.id);
      const entries = catalog.productos.flatMap((p) =>
        p.presentaciones.map((pr) => ({
          sessionId: session.id,
          productoId: p.producto_id,
          productoNombre: p.producto_nombre,
          productoCategoria: p.categoria_nombre ?? "Sin categoría",
          productoOrden: p.producto_orden,
          presentacionId: pr.presentacion_id,
          presentacionNombre: pr.presentacion_nombre,
          presentacionOrden: pr.presentacion_orden,
          lastPrice: pr.last_price ? parseFloat(pr.last_price) : null,
          umbralInferior: p.umbral_variacion_inferior
            ? parseFloat(p.umbral_variacion_inferior)
            : null,
          umbralSuperior: p.umbral_variacion_superior
            ? parseFloat(p.umbral_variacion_superior)
            : null,
        })),
      );

      await catalogRepo.bulkInsert(session.id, entries);
      await sessionsRepo.upsert({
        id: session.id,
        clientUuid: `server-${session.id}`,
        mercadoId: session.mercado_id,
        mercadoNombre: session.mercado.nombre,
        numeroSemana: session.numero_semana,
        anio: session.anio,
        fechaInicio: session.fecha_inicio,
        fechaFin: session.fecha_fin,
        latInicio: session.lat_inicio ? parseFloat(session.lat_inicio) : null,
        lngInicio: session.lng_inicio ? parseFloat(session.lng_inicio) : null,
        accuracyInicio: session.accuracy_inicio,
        latFin: null,
        lngFin: null,
        accuracyFin: null,
        estado: "INICIADA",
        totalProductos: 0,
        comentarioSesion: "",
        syncState: "synced",
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active() });
      toast.success("Toma iniciada");
      router.replace(`/(app)/capture/${session.id}`);
    } catch (e) {
      if (isAxiosError(e)) {
        const detail = (e.response?.data as { detail?: string } | undefined)?.detail;
        if (e.response?.status === 409) {
          toast.error(detail ?? "Ya existe una sesión activa.");
        } else {
          toast.error(detail ?? "No se pudo iniciar la toma.");
        }
      } else {
        toast.error("Error inesperado. Intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedMarketId, isOnline, gps.location, queryClient, router]);

  const selectedMarket = markets.find((m) => m.id === selectedMarketId);

  const gpsStatusUI = () => {
    if (gps.status === "idle") {
      return (
        <Pressable
          onPress={gps.request}
          className="flex-row items-center gap-2 bg-primary rounded-lg px-4 py-3"
        >
          <MapPin size={18} color="#fff" />
          <Text className="text-white font-semibold">Permitir ubicación</Text>
        </Pressable>
      );
    }
    if (gps.status === "requesting") {
      return (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator color={colors.primary} />
          <Text className="text-texto-secundario">
            Obteniendo GPS... {gps.accuracy ? `(${gps.accuracy.toFixed(0)}m)` : ""}
          </Text>
        </View>
      );
    }
    if (gps.status === "ok") {
      return (
        <View className="flex-row items-center gap-2">
          <CheckCircle2 size={18} color={colors.success} />
          <Text className="text-success-700 font-medium">
            Ubicación capturada ({gps.accuracy?.toFixed(0)}m)
          </Text>
        </View>
      );
    }
    if (gps.status === "low_accuracy") {
      return (
        <View className="flex-row items-center gap-2">
          <AlertTriangle size={18} color={colors.warning} />
          <Text className="text-warning-700 font-medium">
            Ubicación aproximada ({gps.accuracy?.toFixed(0)}m)
          </Text>
        </View>
      );
    }
    return (
      <View className="flex-row items-center gap-2">
        <XCircle size={18} color={colors.danger} />
        <Text className="text-mmqep-rojo font-medium">No se pudo obtener ubicación</Text>
      </View>
    );
  };

  const canStart =
    !!selectedMarketId &&
    preflight?.puede !== false &&
    (gps.status === "ok" ||
      gps.status === "low_accuracy" ||
      gps.status === "error" ||
      gps.status === "denied");

  return (
    <SafeAreaView className="flex-1 bg-gris-fondo">
      <View className="flex-row items-center px-4 py-2 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 py-2 pr-3"
        >
          <ChevronLeft size={20} color={colors.primary} />
          <Text className="text-primary font-medium">Atrás</Text>
        </Pressable>
        <Text className="text-base font-semibold text-texto-principal ml-2">
          Iniciar nueva toma
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>
        {markets.length === 0 ? (
          <Card>
            <Text className="text-base font-semibold text-texto-principal">
              Sin mercados asignados
            </Text>
            <Text className="text-sm text-texto-secundario mt-1">
              Solicita a un administrador que te asigne al menos un mercado como supervisor.
            </Text>
          </Card>
        ) : null}

        {markets.length > 1 ? (
          <View className="gap-2">
            <Text className="text-sm font-medium text-texto-principal">Selecciona mercado</Text>
            {markets.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setSelectedMarketId(m.id)}
                className={`p-4 bg-white rounded-xl border ${
                  selectedMarketId === m.id ? "border-primary" : "border-gray-200"
                }`}
              >
                <Text className="text-base font-semibold text-texto-principal">{m.nombre}</Text>
                <Text className="text-xs text-texto-secundario">{m.direccion}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {selectedMarket ? (
          <Card>
            <Text className="text-base font-semibold text-texto-principal">
              {selectedMarket.nombre}
            </Text>
            <Text className="text-xs text-texto-secundario">{selectedMarket.direccion}</Text>
            <Text className="text-xs text-texto-secundario mt-1">
              Clasificación: {selectedMarket.clasificacion}
            </Text>
            {preflightLoading ? (
              <ActivityIndicator color={colors.primary} className="mt-3" />
            ) : preflight ? (
              <Text
                className={`text-sm mt-3 ${preflight.puede ? "text-texto-principal" : "text-mmqep-rojo"}`}
              >
                {preflight.mensaje} ({preflight.tomasEnSemana}/{preflight.maxTomas} esta semana)
              </Text>
            ) : null}
          </Card>
        ) : null}

        {selectedMarket ? (
          <Card>
            <Text className="text-sm font-medium text-texto-principal mb-3">Ubicación GPS</Text>
            {gpsStatusUI()}
          </Card>
        ) : null}
      </ScrollView>

      {selectedMarket ? (
        <View className="px-4 py-4 bg-white border-t border-gray-200">
          <Button
            label="Iniciar toma"
            loading={submitting}
            disabled={!canStart || submitting}
            onPress={() => {
              if (gps.status === "denied" || gps.status === "error") {
                Alert.alert(
                  "Sin GPS",
                  "No se pudo obtener ubicación. ¿Continuar sin GPS?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Continuar", onPress: startSession },
                  ],
                );
                return;
              }
              if (gps.status === "low_accuracy") {
                Alert.alert(
                  "Ubicación aproximada",
                  `Accuracy: ${gps.accuracy?.toFixed(0)}m. ¿Continuar?`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Continuar", onPress: startSession },
                  ],
                );
                return;
              }
              startSession();
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
