import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, TrendingDown, TrendingUp } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as sessionsApi from "@/api/sessions";
import { queryKeys } from "@/api/queries";
import { Card } from "@/components/ui/Card";
import { colors } from "@/theme/colors";
import { formatCurrency, formatDateTime, formatPercent } from "@/utils/format";

import type { CatalogForSession, ProductoCatalogo, PresentacionConPrecio } from "@/schemas/api";

export default function HistoryDetailScreen() {
  const router = useRouter();
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
    const variations: Array<{
      nombre: string;
      presentacion: string;
      variacion: number;
    }> = [];
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

  return (
    <SafeAreaView className="flex-1 bg-gris-fondo">
      <View className="flex-row items-center px-3 py-2 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft size={20} color={colors.primary} />
        </Pressable>
        <Text className="text-base font-semibold text-texto-principal ml-1">Detalle de toma</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !sessionQ.data ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-texto-secundario">No se encontró la sesión.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          <Card>
            <Text className="text-lg font-bold text-texto-principal">
              {sessionQ.data.mercado.nombre}
            </Text>
            <Text className="text-xs text-texto-secundario mt-1">
              {sessionQ.data.descripcion_semana ?? `Semana ${sessionQ.data.numero_semana}`}
            </Text>
            <Text className="text-xs text-texto-secundario">
              {formatDateTime(sessionQ.data.fecha_inicio)} -{" "}
              {formatDateTime(sessionQ.data.fecha_fin)}
            </Text>
            <View className="mt-2 self-start px-2 py-1 rounded-full bg-success-50">
              <Text className="text-xs font-medium text-success-700">
                {sessionQ.data.estado}
              </Text>
            </View>
            {sessionQ.data.comentario_sesion ? (
              <View className="mt-3 p-3 rounded-lg bg-gris-fondo">
                <Text className="text-xs text-texto-secundario">Comentario:</Text>
                <Text className="text-sm text-texto-principal mt-1">
                  {sessionQ.data.comentario_sesion}
                </Text>
              </View>
            ) : null}
          </Card>

          {stats ? (
            <View className="flex-row gap-3">
              <Card>
                <Text className="text-xs text-texto-secundario">Cobertura</Text>
                <Text className="text-2xl font-bold text-texto-principal">
                  {stats.captured}/{stats.totalCatalog}
                </Text>
              </Card>
              <Card>
                <Text className="text-xs text-texto-secundario">Total productos</Text>
                <Text className="text-2xl font-bold text-texto-principal">
                  {sessionQ.data.total_productos}
                </Text>
              </Card>
            </View>
          ) : null}

          {stats && stats.sortedAlza.length > 0 ? (
            <Card>
              <View className="flex-row items-center gap-2 mb-2">
                <TrendingUp size={16} color={colors.rojoAlza} />
                <Text className="text-sm font-semibold text-texto-principal">
                  Top alza
                </Text>
              </View>
              {stats.sortedAlza.map((v, i) => (
                <View key={`${v.nombre}-${i}`} className="flex-row justify-between py-1">
                  <Text className="text-sm text-texto-principal flex-1" numberOfLines={1}>
                    {v.nombre} ({v.presentacion})
                  </Text>
                  <Text className="text-sm font-semibold text-mmqep-rojo">
                    {formatPercent(v.variacion)}
                  </Text>
                </View>
              ))}
            </Card>
          ) : null}

          {stats && stats.sortedBaja.length > 0 && stats.sortedBaja[0]!.variacion < 0 ? (
            <Card>
              <View className="flex-row items-center gap-2 mb-2">
                <TrendingDown size={16} color={colors.verdeBaja} />
                <Text className="text-sm font-semibold text-texto-principal">
                  Top baja
                </Text>
              </View>
              {stats.sortedBaja
                .filter((v) => v.variacion < 0)
                .map((v, i) => (
                  <View key={`${v.nombre}-${i}`} className="flex-row justify-between py-1">
                    <Text className="text-sm text-texto-principal flex-1" numberOfLines={1}>
                      {v.nombre} ({v.presentacion})
                    </Text>
                    <Text className="text-sm font-semibold text-mmqep-verde">
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
                <Text className="text-xs text-texto-secundario mb-2">
                  {p.categoria_nombre ?? "Sin categoría"}
                </Text>
                {p.presentaciones
                  .filter((pr: PresentacionConPrecio) => pr.toma_actual_id != null)
                  .map((pr: PresentacionConPrecio) => (
                    <View key={pr.presentacion_id} className="border-t border-gray-200 py-2">
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
                        {pr.precio_promedio
                          ? formatCurrency(parseFloat(pr.precio_promedio))
                          : "—"}
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
      )}
    </SafeAreaView>
  );
}
