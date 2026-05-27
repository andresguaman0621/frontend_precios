import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ChevronLeft, MapPin, CheckCircle2, AlertTriangle, XCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as sessionsApi from "@/api/sessions";
import { queryKeys } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import * as pricesRepo from "@/db/repos/prices";
import * as sessionsRepo from "@/db/repos/sessions";
import { useGPS } from "@/hooks/useGPS";
import { useNetwork } from "@/hooks/useNetwork";
import { toast } from "@/stores/toast";
import { haptics } from "@/utils/haptics";
import { colors } from "@/theme/colors";

export default function CompleteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = parseInt(sessionIdParam ?? "0", 10);
  const { isOnline } = useNetwork();
  const gps = useGPS();

  const [comentario, setComentario] = useState("");
  const [captured, setCaptured] = useState(0);
  const [total, setTotal] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const [stage, setStage] = useState<"comment" | "gps" | "submit">("comment");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await sessionsRepo.getById(sessionId);
      if (session) setComentario(session.comentarioSesion ?? "");
      const c = await pricesRepo.countBySession(sessionId);
      setCaptured(c);
      const all = await pricesRepo.listBySession(sessionId);
      setTotal(all.length);
      setConflicts(all.filter((p) => p.syncState === "conflict").length);
    })();
  }, [sessionId]);

  const doSubmit = useCallback(async () => {
    setSubmitting(true);
    haptics.lightTap();
    try {
      const session = await sessionsRepo.getById(sessionId);
      if (!session) throw new Error("Sesión local no encontrada");

      const latFin = gps.location?.latitude ?? null;
      const lngFin = gps.location?.longitude ?? null;
      const accFin = gps.location?.accuracy ?? null;

      await sessionsRepo.updateCompletion(sessionId, {
        latFin,
        lngFin,
        accuracyFin: accFin,
        comentarioSesion: comentario,
        fechaFin: new Date().toISOString(),
        syncState: isOnline ? "synced" : "pending_complete",
      });

      if (isOnline) {
        await sessionsApi.complete(sessionId, {
          lat_fin: latFin?.toString() ?? null,
          lng_fin: lngFin?.toString() ?? null,
          accuracy_fin: accFin,
          comentario_sesion: comentario,
        });
        await sessionsRepo.setEstado(sessionId, "COMPLETADA");
        haptics.success();
        toast.success("Toma completada · Reporte generado");
      } else {
        toast.info("Toma marcada para completarse al recuperar conexión.");
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active() });
      router.replace(`/(app)/history/${sessionId}`);
    } catch (e) {
      if (isAxiosError(e)) {
        const detail = (e.response?.data as { detail?: string } | undefined)?.detail;
        toast.error(detail ?? "No se pudo completar la toma.");
      } else {
        toast.error("Error al completar.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, gps.location, comentario, isOnline, queryClient, router]);

  if (captured === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white p-4">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 mb-4">
          <ChevronLeft size={20} color={colors.primary} />
          <Text className="text-primary font-medium">Volver</Text>
        </Pressable>
        <Card tone="danger">
          <Text className="text-base font-semibold text-mmqep-rojo">
            Debes registrar al menos un precio antes de completar.
          </Text>
        </Card>
      </SafeAreaView>
    );
  }

  if (conflicts > 0) {
    return (
      <SafeAreaView className="flex-1 bg-white p-4">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 mb-4">
          <ChevronLeft size={20} color={colors.primary} />
          <Text className="text-primary font-medium">Volver</Text>
        </Pressable>
        <Card tone="warning">
          <Text className="text-base font-semibold text-warning-700">
            Hay {conflicts} conflictos pendientes de resolver.
          </Text>
          <Text className="text-sm text-texto-secundario mt-2">
            Resuelve los conflictos antes de completar.
          </Text>
          <Button
            label="Ir a conflictos"
            variant="primary"
            onPress={() => router.replace("/(app)/sync-status")}
          />
        </Card>
      </SafeAreaView>
    );
  }

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
          <Text className="text-warning-700">
            Ubicación aproximada ({gps.accuracy?.toFixed(0)}m)
          </Text>
        </View>
      );
    }
    return (
      <View className="flex-row items-center gap-2">
        <XCircle size={18} color={colors.danger} />
        <Text className="text-mmqep-rojo">Sin GPS. Puedes continuar sin ubicación.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-3 py-2 border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft size={20} color={colors.primary} />
        </Pressable>
        <Text className="text-base font-semibold text-texto-principal ml-1">Completar toma</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}>
        <Card>
          <Text className="text-sm text-texto-secundario">
            Has registrado {captured} productos ({total} precios).
          </Text>
        </Card>

        {stage === "comment" || stage === "gps" || stage === "submit" ? (
          <Card>
            <Text className="text-sm font-medium text-texto-principal mb-2">
              Comentario general (opcional)
            </Text>
            <Input
              value={comentario}
              onChangeText={(v) => setComentario(v.slice(0, 1000))}
              placeholder="Observaciones de la jornada..."
              textArea
              maxLength={1000}
              helper={`${comentario.length}/1000`}
            />
          </Card>
        ) : null}

        {stage === "gps" || stage === "submit" ? (
          <Card>
            <Text className="text-sm font-medium text-texto-principal mb-3">GPS de finalización</Text>
            {gpsStatusUI()}
          </Card>
        ) : null}
      </ScrollView>

      <View className="px-4 py-4 bg-white border-t border-gray-200">
        {stage === "comment" ? (
          <View className="flex-row gap-2">
            <Button label="Cancelar" variant="outline" onPress={() => router.back()} />
            <Button label="Continuar → GPS" onPress={() => setStage("gps")} />
          </View>
        ) : (
          <Button
            label={isOnline ? "Finalizar toma" : "Guardar y enviar cuando haya red"}
            loading={submitting}
            disabled={submitting || gps.status === "idle" || gps.status === "requesting"}
            onPress={doSubmit}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
