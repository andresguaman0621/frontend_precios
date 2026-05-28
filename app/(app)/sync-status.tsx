import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Cloud } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PressableScale } from "@/components/ui/PressableScale";
import { EmptyState } from "@/components/EmptyState";
import * as pricesRepo from "@/db/repos/prices";
import * as syncLogRepo from "@/db/repos/syncLog";
import { useNetwork } from "@/hooks/useNetwork";
import { toast } from "@/stores/toast";
import { SyncManager } from "@/sync/SyncManager";
import { colors } from "@/theme/colors";
import { formatCurrency, formatRelative } from "@/utils/format";

import type { LocalPrice } from "@/db/repos/prices";
import type { SyncLogEntry } from "@/db/repos/syncLog";

type Tab = "pending" | "errors" | "conflicts" | "history";

export default function SyncStatusScreen() {
  const { isOnline } = useNetwork();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<LocalPrice[]>([]);
  const [errors, setErrors] = useState<LocalPrice[]>([]);
  const [conflicts, setConflicts] = useState<LocalPrice[]>([]);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [flushing, setFlushing] = useState(false);

  const reload = useCallback(async () => {
    const [p, e, c, l] = await Promise.all([
      pricesRepo.listBySyncState("pending"),
      pricesRepo.listBySyncState("error"),
      pricesRepo.listBySyncState("conflict"),
      syncLogRepo.recent(20),
    ]);
    setPending(p);
    setErrors(e);
    setConflicts(c);
    setLogs(l);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  useEffect(() => {
    return SyncManager.subscribe(() => {
      reload();
    });
  }, [reload]);

  const handleFlush = async () => {
    if (!isOnline) {
      toast.warning("Sin conexión. La sincronización ocurrirá al recuperar la red.");
      return;
    }
    setFlushing(true);
    try {
      await SyncManager.flush(true);
      toast.success("Sincronización ejecutada.");
      await reload();
    } catch {
      toast.error("Falló la sincronización.");
    } finally {
      setFlushing(false);
    }
  };

  const handleRetry = async (uuid: string) => {
    await pricesRepo.setSyncState([uuid], "pending");
    SyncManager.enqueue();
    await reload();
  };

  const items =
    tab === "pending" ? pending : tab === "errors" ? errors : tab === "conflicts" ? conflicts : [];

  const tabsConfig = [
    { id: "pending" as Tab, label: "Pendientes", count: pending.length },
    { id: "errors" as Tab, label: "Errores", count: errors.length },
    { id: "conflicts" as Tab, label: "Conflictos", count: conflicts.length },
    { id: "history" as Tab, label: "Historial", count: logs.length },
  ];

  const totalPending = pending.length + errors.length + conflicts.length;

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center gap-2 mb-3">
          <View
            className={`w-9 h-9 rounded-xl items-center justify-center ${
              isOnline ? "bg-success-50" : "bg-danger-50"
            }`}
          >
            <Cloud size={18} color={isOnline ? colors.success : colors.danger} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-texto-principal">
              {isOnline ? "En línea" : "Sin conexión"}
            </Text>
            <Text className="text-xs text-texto-secundario">
              {totalPending} pendiente{totalPending === 1 ? "" : "s"} de sincronizar
            </Text>
          </View>
        </View>
        <Button
          label={flushing ? "Sincronizando…" : "Forzar sincronización"}
          variant={isOnline ? "primary" : "secondary"}
          loading={flushing}
          disabled={flushing || !isOnline}
          leftIcon={<RefreshCw size={16} color={isOnline ? "#fff" : colors.textoPrincipal} />}
          onPress={handleFlush}
        />
      </View>

      <View className="flex-row gap-1.5 px-3 py-2.5 bg-white border-b border-gray-200">
        {tabsConfig.map((t) => {
          const active = tab === t.id;
          return (
            <PressableScale
              key={t.id}
              onPress={() => setTab(t.id)}
              scaleTo={0.94}
              className={`flex-1 items-center py-2 rounded-lg ${active ? "bg-gray-100" : ""}`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-texto-principal" : "text-texto-secundario"
                }`}
              >
                {t.label}
              </Text>
              <Text
                className={`text-xs mt-0.5 ${
                  active ? "text-texto-principal" : "text-texto-secundario"
                }`}
              >
                {t.count}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
        {tab !== "history" && items.length === 0 ? (
          <EmptyState
            title={
              tab === "pending"
                ? "Sin pendientes"
                : tab === "errors"
                  ? "Sin errores"
                  : "Sin conflictos"
            }
            description="Todo está sincronizado."
            icon={<CheckCircle2 size={24} color={colors.success} />}
          />
        ) : null}

        {tab !== "history" &&
          items.map((p) => (
            <Card
              key={p.clientUuid}
              tone={tab === "errors" ? "danger" : tab === "conflicts" ? "warning" : "default"}
            >
              <View className="flex-row items-start gap-3">
                <View className="w-9 h-9 rounded-xl bg-white border border-gray-200 items-center justify-center">
                  {tab === "errors" ? (
                    <XCircle size={16} color={colors.danger} />
                  ) : tab === "conflicts" ? (
                    <AlertTriangle size={16} color={colors.warning} />
                  ) : (
                    <RefreshCw size={16} color={colors.warning} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-texto-principal">
                    Producto #{p.productoId} · Pres. #{p.presentacionId}
                  </Text>
                  <Text className="text-xs text-texto-secundario mt-0.5">
                    {formatCurrency(p.precio)} · {formatRelative(p.clientTimestamp)}
                  </Text>
                  {p.lastError ? (
                    <Text className="text-xs text-danger-700 mt-1" numberOfLines={2}>
                      {p.lastError}
                    </Text>
                  ) : null}
                  {tab === "errors" ? (
                    <View className="mt-2.5 self-start">
                      <Button
                        label="Reintentar"
                        variant="secondary"
                        size="sm"
                        fullWidth={false}
                        onPress={() => handleRetry(p.clientUuid)}
                      />
                    </View>
                  ) : null}
                </View>
              </View>
            </Card>
          ))}

        {tab === "history" &&
          (logs.length === 0 ? (
            <EmptyState
              title="Sin actividad"
              description="Aún no hay registros de sincronización."
            />
          ) : (
            logs.map((l) => (
              <Card key={l.id}>
                <View className="flex-row items-center gap-2">
                  {l.status === "success" ? (
                    <CheckCircle2 size={14} color={colors.success} />
                  ) : (
                    <XCircle size={14} color={colors.danger} />
                  )}
                  <Text className="text-sm font-medium text-texto-principal flex-1">
                    {l.action}
                  </Text>
                  <Text className="text-xs text-texto-secundario">
                    {formatRelative(l.timestamp)}
                  </Text>
                </View>
                {l.details ? (
                  <Text className="text-xs text-texto-secundario mt-1.5" numberOfLines={2}>
                    {JSON.stringify(l.details)}
                  </Text>
                ) : null}
              </Card>
            ))
          ))}
      </ScrollView>
    </View>
  );
}
