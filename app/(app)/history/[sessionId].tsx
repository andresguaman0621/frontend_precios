import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react-native";

import * as sessionsApi from "@/api/sessions";
import { queryKeys } from "@/api/queries";
import { Card } from "@/components/ui/Card";
import { Tile } from "@/components/ui/Tile";
import { SessionDetailSkeleton } from "@/components/skeletons/SessionDetailSkeleton";
import { colors } from "@/theme/colors";
import { formatCurrency, formatDateTime, formatPercent } from "@/utils/format";

import type { CatalogForSession, ProductoCatalogo, PresentacionConPrecio } from "@/schemas/api";

export default function HistoryDetailScreen() {
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = parseInt(sessionIdParam ?? "0", 10);

  const sessionQ = useQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => sessionsApi.getById(sessionId),
  });

  const catalogQ = useQuery<CatalogForSession>({
    queryKey: queryKeys.sessions.catalog(sessionId),
    queryFn: () => sessionsApi.catalog(sessionId),
    enabled: sessionQ.isSuccess,
  });

  const stats = useMemo(() => {
    if (!catalogQ.data) return null;
    const productos = catalogQ.data.productos;
    const totalCatalog = productos.length;
    const captured = productos.filter((p: ProductoCatalogo) =>
      p.presentaciones.some((pr: PresentacionConPrecio) => pr.toma_actual_id != null),
    ).length;
    const variations: {
      nombre: string;
      presentacion: string;
      variacion: number;
    }[] = [];
    for (const p of productos) {
      for (const pr of p.presentaciones) {
        if (pr.toma_actual_id == null) continue;
        const nuevo = pr.precio_promedio ? parseFloat(pr.precio_promedio) : null;
        const anterior = pr.last_price ? parseFloat(pr.last_price) : null;
        if (nuevo != null && anterior != null && anterior > 0) {
          const v = ((nuevo - anterior) / anterior) * 100;
          variations.push({
            nombre: p.producto_nombre,
            presentacion: pr.presentacion_nombre,
            variacion: v,
          });
        }
      }
    }
    const sortedAlza = [...variations].sort((a, b) => b.variacion - a.variacion).slice(0, 3);
    const sortedBaja = [...variations].sort((a, b) => a.variacion - b.variacion).slice(0, 3);
    return { totalCatalog, captured, sortedAlza, sortedBaja };
  }, [catalogQ.data]);

  const loading = sessionQ.isLoading || catalogQ.isLoading;

  if (loading) {
    return <SessionDetailSkeleton />;
  }

  if (!sessionQ.data) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-white">
        <Text className="text-base text-texto-secundario">No se encontró la sesión.</Text>
      </View>
    );
  }

  const session = sessionQ.data;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
    >
      <View>
        <Text className="text-xl font-semibold text-texto-principal">{session.mercado.nombre}</Text>
        <Text className="text-xs text-texto-secundario mt-0.5">
          {session.descripcion_semana ?? `Semana ${session.numero_semana}`}
        </Text>
        <Text className="text-xs text-texto-secundario mt-0.5">
          {formatDateTime(session.fecha_inicio)} ·{" "}
          {session.fecha_fin ? formatDateTime(session.fecha_fin) : "—"}
        </Text>
        <View className="mt-2 self-start px-2.5 py-1 rounded-full bg-success-50 border border-success-300">
          <Text className="text-xs font-medium text-success-700">{session.estado}</Text>
        </View>
      </View>

      {stats ? (
        <View className="flex-row gap-2">
          <Tile label="Cobertura" value={`${stats.captured}/${stats.totalCatalog}`} />
          <Tile label="Productos" value={session.total_productos} />
        </View>
      ) : null}

      {session.comentario_sesion ? (
        <Card>
          <Text className="text-xs text-texto-secundario font-medium uppercase tracking-wide mb-1.5">
            Comentario
          </Text>
          <Text className="text-sm text-texto-principal">{session.comentario_sesion}</Text>
        </Card>
      ) : null}

      {stats && stats.sortedAlza.length > 0 ? (
        <Card>
          <View className="flex-row items-center gap-2 mb-2">
            <TrendingUp size={16} color={colors.danger} />
            <Text className="text-sm font-semibold text-texto-principal">Top alza</Text>
          </View>
          {stats.sortedAlza.map((v, i) => (
            <View key={`${v.nombre}-${i}`} className="flex-row justify-between py-1.5">
              <Text className="text-sm text-texto-principal flex-1 mr-2" numberOfLines={1}>
                {v.nombre} · {v.presentacion}
              </Text>
              <Text className="text-sm font-semibold text-danger-700">
                {formatPercent(v.variacion)}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {stats && stats.sortedBaja.length > 0 && stats.sortedBaja[0]!.variacion < 0 ? (
        <Card>
          <View className="flex-row items-center gap-2 mb-2">
            <TrendingDown size={16} color={colors.success} />
            <Text className="text-sm font-semibold text-texto-principal">Top baja</Text>
          </View>
          {stats.sortedBaja
            .filter((v) => v.variacion < 0)
            .map((v, i) => (
              <View key={`${v.nombre}-${i}`} className="flex-row justify-between py-1.5">
                <Text className="text-sm text-texto-principal flex-1 mr-2" numberOfLines={1}>
                  {v.nombre} · {v.presentacion}
                </Text>
                <Text className="text-sm font-semibold text-success-700">
                  {formatPercent(v.variacion)}
                </Text>
              </View>
            ))}
        </Card>
      ) : null}

      {catalogQ.data?.productos
        .filter((p: ProductoCatalogo) =>
          p.presentaciones.some((pr: PresentacionConPrecio) => pr.toma_actual_id != null),
        )
        .map((p: ProductoCatalogo) => (
          <Card key={p.producto_id}>
            <Text className="text-base font-semibold text-texto-principal">
              {p.producto_nombre}
            </Text>
            <Text className="text-xs text-texto-secundario mt-0.5 mb-2">
              {p.categoria_nombre ?? "Sin categoría"}
            </Text>
            {p.presentaciones
              .filter((pr: PresentacionConPrecio) => pr.toma_actual_id != null)
              .map((pr: PresentacionConPrecio) => (
                <View key={pr.presentacion_id} className="border-t border-gray-100 py-2.5">
                  <Text className="text-sm font-medium text-texto-principal">
                    {pr.presentacion_nombre}
                  </Text>
                  <View className="flex-row gap-3 mt-1">
                    <Text className="text-xs text-texto-secundario">
                      P1: {pr.precio_1 ? formatCurrency(parseFloat(pr.precio_1)) : "—"}
                    </Text>
                    <Text className="text-xs text-texto-secundario">
                      P2: {pr.precio_2 ? formatCurrency(parseFloat(pr.precio_2)) : "—"}
                    </Text>
                    <Text className="text-xs text-texto-secundario">
                      P3: {pr.precio_3 ? formatCurrency(parseFloat(pr.precio_3)) : "—"}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-primary mt-1">
                    Promedio:{" "}
                    {pr.precio_promedio ? formatCurrency(parseFloat(pr.precio_promedio)) : "—"}
                  </Text>
                  {pr.observacion ? (
                    <Text className="text-xs text-texto-secundario mt-1">
                      Obs: {pr.observacion}
                    </Text>
                  ) : null}
                </View>
              ))}
          </Card>
        ))}
    </ScrollView>
  );
}
