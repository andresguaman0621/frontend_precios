import { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ListChecks, User } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as sessionsApi from "@/api/sessions";
import { queryKeys } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { KpiTile } from "@/components/KpiTile";
import { SessionStatusBanner } from "@/components/SessionStatusBanner";
import { SyncIndicator } from "@/components/SyncIndicator";
import * as catalogRepo from "@/db/repos/catalog";
import * as pricesRepo from "@/db/repos/prices";
import * as sessionsRepo from "@/db/repos/sessions";
import { useActiveSession } from "@/hooks/useActiveSession";
import { useNetwork } from "@/hooks/useNetwork";
import { usePendingCount } from "@/hooks/useSyncStatus";
import { useAuthStore } from "@/stores/auth";
import { toast } from "@/stores/toast";
import { calcularNumeroSemanaAnio } from "@/utils/week";

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { isOnline } = useNetwork();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: activeSession, refetch } = useActiveSession();
  const pending = usePendingCount(refreshKey);

  useFocusEffect(
    useCallback(() => {
      refetch();
      setRefreshKey((k) => k + 1);
    }, [refetch]),
  );

  const [tomasSemana, setTomasSemana] = useState<number>(0);
  const [maxTomas, setMaxTomas] = useState<number>(2);

  useEffect(() => {
    (async () => {
      const [semana, anio] = calcularNumeroSemanaAnio(new Date());
      // Si hay mercados asignados al supervisor, calcular tomas de la semana
      const supervisorMarkets =
        user?.asignaciones.filter((a) => a.rol_codigo === "SUPERVISOR").map((a) => a.mercado_id) ?? [];
      if (supervisorMarkets.length > 0 && isOnline) {
        try {
          const cs = await sessionsApi.canStart(supervisorMarkets[0]!);
          setTomasSemana(cs.tomas_en_semana);
          setMaxTomas(cs.max_tomas);
        } catch {
          // ignore
        }
      } else if (supervisorMarkets.length > 0) {
        // fallback local
        const local = await sessionsRepo.listByMarketInWeek(
          supervisorMarkets[0]!,
          semana,
          anio,
        );
        setTomasSemana(local.length);
      }
    })();
  }, [user, isOnline, refreshKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshKey((k) => k + 1);
    setRefreshing(false);
  }, [refetch]);

  const handleCancelActive = useCallback(() => {
    if (!activeSession) return;
    Alert.alert(
      "Cancelar toma",
      "¿Cancelar la toma actual? Se perderán los precios capturados.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmar eliminación",
              `Esta acción es irreversible. ${activeSession.totalProductos} productos serán eliminados.`,
              [
                { text: "Atrás", style: "cancel" },
                {
                  text: "Confirmar",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      if (isOnline && activeSession.syncState !== "pending_create") {
                        await sessionsApi.cancel(activeSession.id);
                      }
                      await catalogRepo.deleteBySession(activeSession.id);
                      await pricesRepo.deleteBySession(activeSession.id);
                      await sessionsRepo.remove(activeSession.id);
                      toast.success("Toma cancelada.");
                      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active() });
                      setRefreshKey((k) => k + 1);
                    } catch (e) {
                      toast.error("No se pudo cancelar. Intenta de nuevo.");
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [activeSession, isOnline, queryClient]);

  const greetingName = user?.firstName || user?.username || "Supervisor";
  const [semana] = calcularNumeroSemanaAnio(new Date());

  return (
    <SafeAreaView className="flex-1 bg-gris-fondo">
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View>
          <Text className="text-2xl font-bold text-texto-principal">Hola, {greetingName}</Text>
          <Text className="text-sm text-texto-secundario">Supervisor</Text>
        </View>

        <SyncIndicator pending={pending} compact />

        {activeSession ? (
          <SessionStatusBanner session={activeSession} onCancel={handleCancelActive} />
        ) : null}

        <View className="flex-row gap-3">
          <KpiTile
            label="Tomas esta semana"
            value={`${tomasSemana}/${maxTomas}`}
            tone={tomasSemana >= maxTomas ? "danger" : "default"}
          />
          <KpiTile label="Semana actual" value={semana} />
        </View>

        <View className="flex-row gap-3">
          <KpiTile
            label="Sync"
            value={pending === 0 ? "✓ OK" : pending}
            tone={pending > 0 ? "warning" : "success"}
            onPress={() => router.push("/(app)/sync-status")}
          />
          <KpiTile
            label="Conexión"
            value={isOnline ? "Online" : "Offline"}
            tone={isOnline ? "success" : "danger"}
          />
        </View>

        <Button
          label="Iniciar nueva toma"
          leftIcon={<Plus size={18} color="#fff" />}
          onPress={() => router.push("/(app)/start-session")}
          disabled={!!activeSession || tomasSemana >= maxTomas}
        />

        <View className="flex-row gap-3 mt-2">
          <Button
            label="Historial"
            variant="outline"
            leftIcon={<ListChecks size={18} color="#27357d" />}
            onPress={() => router.push("/(app)/history")}
          />
          <Button
            label="Perfil"
            variant="outline"
            leftIcon={<User size={18} color="#27357d" />}
            onPress={() => router.push("/(app)/profile")}
          />
        </View>

        {!activeSession && tomasSemana >= maxTomas ? (
          <EmptyState
            title="Límite alcanzado"
            description={`Has realizado ${maxTomas} tomas esta semana en el mercado asignado.`}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
