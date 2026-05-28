import { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  CalendarDays,
  CloudOff,
  CloudCheck,
  TrendingUp,
  ShoppingBasket,
} from "lucide-react-native";

import * as sessionsApi from "@/api/sessions";
import { queryKeys } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Tile } from "@/components/ui/Tile";
import { EmptyState } from "@/components/EmptyState";
import { SessionStatusBanner } from "@/components/SessionStatusBanner";
import * as catalogRepo from "@/db/repos/catalog";
import * as pricesRepo from "@/db/repos/prices";
import * as sessionsRepo from "@/db/repos/sessions";
import { useActiveSession } from "@/hooks/useActiveSession";
import { useNetwork } from "@/hooks/useNetwork";
import { useResponsive } from "@/hooks/useResponsive";
import { usePendingCount } from "@/hooks/useSyncStatus";
import { useAuthStore } from "@/stores/auth";
import { toast } from "@/stores/toast";
import { colors } from "@/theme/colors";
import { calcularNumeroSemanaAnio } from "@/utils/week";

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { isOnline } = useNetwork();
  const { isTablet } = useResponsive();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: activeSession, refetch } = useActiveSession();
  const pending = usePendingCount(refreshKey);

  useFocusEffect(
    useCallback(() => {
      refetch();
      setRefreshKey((k) => k + 1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const [tomasSemana, setTomasSemana] = useState<number>(0);
  const [maxTomas, setMaxTomas] = useState<number>(2);

  useEffect(() => {
    (async () => {
      const [semana, anio] = calcularNumeroSemanaAnio(new Date());
      const supervisorMarkets =
        user?.asignaciones.filter((a) => a.rol_codigo === "SUPERVISOR").map((a) => a.mercado_id) ??
        [];
      if (supervisorMarkets.length > 0 && isOnline) {
        try {
          const cs = await sessionsApi.canStart(supervisorMarkets[0]!);
          setTomasSemana(cs.tomas_en_semana);
          setMaxTomas(cs.max_tomas);
        } catch {
          // ignore
        }
      } else if (supervisorMarkets.length > 0) {
        const local = await sessionsRepo.listByMarketInWeek(supervisorMarkets[0]!, semana, anio);
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
    Alert.alert("Cancelar toma", "¿Cancelar la toma actual? Se perderán los precios capturados.", [
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
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.sessions.active(),
                    });
                    setRefreshKey((k) => k + 1);
                  } catch {
                    toast.error("No se pudo cancelar. Intenta de nuevo.");
                  }
                },
              },
            ],
          );
        },
      },
    ]);
  }, [activeSession, isOnline, queryClient]);

  const greetingName = user?.firstName || user?.username || "Supervisor";
  const [semana] = calcularNumeroSemanaAnio(new Date());

  const supervisorCount =
    user?.asignaciones.filter((a) => a.rol_codigo === "SUPERVISOR").length ?? 0;

  // Bento: 2 cols phone, 3 cols tablet
  const tileWidth = isTablet ? "w-[31.5%]" : "w-[48.5%]";

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View>
        <Text className="text-2xl font-semibold text-texto-principal">Hola, {greetingName}</Text>
        <Text className="text-sm text-texto-secundario mt-0.5">
          {supervisorCount > 0
            ? `Supervisor · ${supervisorCount} mercado${supervisorCount === 1 ? "" : "s"}`
            : "Supervisor"}
        </Text>
      </View>

      {activeSession ? (
        <SessionStatusBanner session={activeSession} onCancel={handleCancelActive} />
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        <Tile
          label="Tomas semana"
          value={`${tomasSemana}/${maxTomas}`}
          tone={tomasSemana >= maxTomas ? "danger" : "default"}
          icon={
            <ShoppingBasket
              size={14}
              color={tomasSemana >= maxTomas ? colors.danger : colors.primary}
            />
          }
          widthClassName={tileWidth}
        />
        <Tile
          label="Semana"
          value={semana}
          icon={<CalendarDays size={14} color={colors.primary} />}
          widthClassName={tileWidth}
        />
        <Tile
          label="Conexión"
          value={isOnline ? "Online" : "Offline"}
          tone={isOnline ? "success" : "danger"}
          icon={
            isOnline ? (
              <CloudCheck size={14} color={colors.success} />
            ) : (
              <CloudOff size={14} color={colors.danger} />
            )
          }
          widthClassName={tileWidth}
        />
        <Tile
          label="Sincronización"
          value={pending === 0 ? "OK" : pending}
          tone={pending > 0 ? "warning" : "success"}
          hint={pending > 0 ? "Ver detalle" : undefined}
          icon={<CloudCheck size={14} color={pending > 0 ? colors.warning : colors.success} />}
          onPress={() => router.push("/(app)/sync-status")}
          widthClassName={tileWidth}
        />
        {isTablet ? (
          <Tile
            label="Productos"
            value={activeSession?.totalProductos ?? 0}
            hint={activeSession ? "en toma actual" : "sin sesión activa"}
            icon={<TrendingUp size={14} color={colors.primary} />}
            widthClassName={tileWidth}
          />
        ) : null}
      </View>

      <Button
        label="Iniciar nueva toma"
        leftIcon={<Plus size={18} color="#fff" />}
        onPress={() => router.push("/(app)/start-session")}
        disabled={!!activeSession || tomasSemana >= maxTomas}
      />

      {!activeSession && tomasSemana >= maxTomas ? (
        <EmptyState
          title="Límite alcanzado"
          description={`Has realizado ${maxTomas} tomas esta semana en el mercado asignado.`}
        />
      ) : null}
    </ScrollView>
  );
}
