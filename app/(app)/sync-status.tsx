import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ChevronLeft, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  const router = useRouter();
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

  return (
    <SafeAreaView className="flex-1 bg-gris-fondo">
      <View className="flex-row items-center px-3 py-2 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft size={20} color={colors.primary} />
        </Pressable>
        <Text className="text-base font-semibold text-texto-principal ml-1">
          Estado de sincronización
        </Text>
      </View>

      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-sm font-medium text-texto-principal">
          {isOnline ? "En línea" : "Sin conexión"} · {pending.length + errors.length + conflicts.length} pendientes
        </Text>
        <Button
          label={flushing ? "Sincronizando..." : "Forzar sincronización"}
          loading={flushing}
          disabled={flushing || !isOnline}
          leftIcon={<RefreshCw size={16} color="#fff" />}
          onPress={handleFlush}
        />
      </View>

      <View className="flex-row bg-white border-b border-gray-200">
        {(
          [
            { id: "pending" as Tab, label: "Pendientes", count: pending.length },
            { id: "errors" as Tab, label: "Errores", count: errors.length },
            { id: "conflicts" as Tab, label: "Conflictos", count: conflicts.length },
            { id: "history" as Tab, label: "Historial", count: logs.length },
          ] as const
        ).map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            className={`flex-1 items-center py-3 ${
              tab === t.id ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                tab === t.id ? "text-primary" : "text-texto-secundario"
              }`}
            >
              {t.label} ({t.count})
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
        {tab !== "history" && items.length === 0 ? (
          <EmptyState
            title={tab === "pending" ? "Sin pendientes" : tab === "errors" ? "Sin errores" : "Sin conflictos"}
            description="Todo está sincronizado."
            icon={<CheckCircle2 size={32} color={colors.success} />}
          />
        ) : null}

        {tab !== "history" &&
          items.map((p) => (
            <Card
              key={p.clientUuid}
              tone={tab === "errors" ? "danger" : tab === "conflicts" ? "warning" : "default"}
            >
              <View className="flex-row items-start gap-2">
                {tab === "errors" ? (
                  <XCircle size={16} color={colors.danger} />
                ) : tab === "conflicts" ? (
                  <AlertTriangle size={16} color={colors.warning} />
                ) : (
                  <RefreshCw size={16} color={colors.warning} />
                )}
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-texto-principal">
                    Producto #{p.productoId} — Presentación #{p.presentacionId}
                  </Text>
                  <Text className="text-xs text-texto-secundario">
                    Precio: {formatCurrency(p.precio)} · {formatRelative(p.clientTimestamp)}
                  </Text>
                  {p.lastError ? (
                    <Text className="text-xs text-mmqep-rojo mt-1" numberOfLines={2}>
                      {p.lastError}
                    </Text>
                  ) : null}
                  {tab === "errors" ? (
                    <View className="mt-2">
                      <Button
                        label="Reintentar"
                        variant="outline"
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
            <EmptyState title="Sin actividad" description="Aún no hay registros de sincronización." />
          ) : (
            logs.map((l) => (
              <Card key={l.id}>
                <View className="flex-row items-center gap-2">
                  {l.status === "success" ? (
                    <CheckCircle2 size={14} color={colors.success} />
                  ) : (
                    <XCircle size={14} color={colors.danger} />
                  )}
                  <Text className="text-sm font-medium text-texto-principal">{l.action}</Text>
                  <Text className="text-xs text-texto-secundario ml-auto">
                    {formatRelative(l.timestamp)}
                  </Text>
                </View>
                {l.details ? (
                  <Text className="text-xs text-texto-secundario mt-1" numberOfLines={2}>
                    {JSON.stringify(l.details)}
                  </Text>
                ) : null}
              </Card>
            ))
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
