import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { FlashList } from "@shopify/flash-list";
import { Search, CheckCheck, MousePointerClick } from "lucide-react-native";

import { CategoryChips } from "@/components/CategoryChips";
import { PriceCard, type SavePriceInput, type VariationDetected } from "@/components/PriceCard";
import { PressableScale } from "@/components/ui/PressableScale";
import { SyncIndicator } from "@/components/SyncIndicator";
import { VariationAlertModal, type VariationAlertInfo } from "@/components/VariationAlertModal";
import { EmptyState } from "@/components/EmptyState";
import { CaptureSkeleton } from "@/components/skeletons/CaptureSkeleton";
import * as pricesRepo from "@/db/repos/prices";
import * as sessionsRepo from "@/db/repos/sessions";
import { useCatalog } from "@/hooks/useCatalog";
import { useResponsive } from "@/hooks/useResponsive";
import { useCaptureStore } from "@/stores/capture";
import { toast } from "@/stores/toast";
import { SyncManager } from "@/sync/SyncManager";
import { conflictResolver } from "@/sync/conflictResolver";
import { colors } from "@/theme/colors";
import { matches } from "@/utils/normalize";

import type { CatalogProduct } from "@/hooks/useCatalog";
import type { LocalPrice } from "@/db/repos/prices";

export default function CaptureScreen() {
  useKeepAwake();
  const router = useRouter();
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = parseInt(sessionIdParam ?? "0", 10);
  const search = useCaptureStore((s) => s.search);
  const setSearch = useCaptureStore((s) => s.setSearch);
  const category = useCaptureStore((s) => s.category);
  const setCategory = useCaptureStore((s) => s.setCategory);
  const reset = useCaptureStore((s) => s.reset);

  const { isTabletLandscape } = useResponsive();

  const [refreshKey, setRefreshKey] = useState(0);
  const [variation, setVariation] = useState<VariationAlertInfo | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    productoId: number;
    presentacionId: number;
    save: () => Promise<void>;
  } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    mercadoNombre: string;
    numeroSemana: number;
  } | null>(null);

  const { products, capturedCount, totalCount, loading } = useCatalog(sessionId, refreshKey);

  useEffect(() => {
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionsRepo.getById(sessionId).then((s) => {
      if (s) {
        setSessionInfo({
          mercadoNombre: s.mercadoNombre,
          numeroSemana: s.numeroSemana,
        });
      }
    });
  }, [sessionId]);

  useEffect(() => {
    pricesRepo.countPendingTotal().then(setPendingCount);
  }, [refreshKey]);

  useEffect(() => {
    return conflictResolver.subscribe((payload) => {
      const v = payload.variacion;
      setVariation({
        productoNombre: payload.productoNombre,
        presentacionNombre: payload.presentacionNombre,
        precioNuevo: parseFloat(v.precio_nuevo),
        precioAnterior: v.precio_anterior ? parseFloat(v.precio_anterior) : null,
        variacion: v.variacion_porcentaje,
        esAumento: v.es_aumento,
        umbralInferior: v.umbral_inferior,
        umbralSuperior: v.umbral_superior,
      });
      setPendingConfirm({
        productoId: payload.productoId,
        presentacionId: payload.presentacionId,
        save: async () => {
          const existing = await pricesRepo.getByClientUuid(payload.clientUuid);
          if (!existing) return;
          await pricesRepo.upsert({
            sessionId: existing.sessionId,
            productoId: existing.productoId,
            presentacionId: existing.presentacionId,
            precio1: existing.precio1,
            precio2: existing.precio2,
            precio3: existing.precio3,
            precio: existing.precio,
            observacion: existing.observacion,
            confirmado: true,
            requirioConfirmacionManual: true,
            variacionPorcentaje: existing.variacionPorcentaje,
          });
          SyncManager.enqueue();
        },
      });
    });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) set.add(p.productoCategoria);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category && p.productoCategoria !== category) return false;
      if (search) {
        return (
          matches(p.productoNombre, search) ||
          p.presentaciones.some((pr) => matches(pr.presentacionNombre, search))
        );
      }
      return true;
    });
  }, [products, search, category]);

  // Auto-seleccionar el primer producto cuando entras en master-detail
  useEffect(() => {
    if (isTabletLandscape && filtered.length > 0 && selectedProductoId == null) {
      setSelectedProductoId(filtered[0]!.productoId);
    }
  }, [isTabletLandscape, filtered, selectedProductoId]);

  const handleSave = useCallback(
    async (input: SavePriceInput): Promise<LocalPrice | null> => {
      try {
        const saved = await pricesRepo.upsert({
          sessionId,
          ...input,
        });
        await sessionsRepo.setTotalProductos(sessionId, await pricesRepo.countBySession(sessionId));
        SyncManager.enqueue();
        setRefreshKey((k) => k + 1);
        return saved;
      } catch (e) {
        toast.error("No se pudo guardar el precio.");
        throw e;
      }
    },
    [sessionId],
  );

  const handleVariation = useCallback(
    (info: VariationDetected) => {
      setVariation({
        productoNombre: info.productoNombre,
        presentacionNombre: info.presentacionNombre,
        precioNuevo: info.precioNuevo,
        precioAnterior: info.precioAnterior,
        variacion: info.variacion,
        esAumento: info.esAumento,
        umbralInferior: info.umbralInferior,
        umbralSuperior: info.umbralSuperior,
      });
      setPendingConfirm({
        productoId: info.productoId,
        presentacionId: info.presentacionId,
        save: async () => {
          const product = products.find((p) => p.productoId === info.productoId);
          const presentacion = product?.presentaciones.find(
            (pr) => pr.presentacionId === info.presentacionId,
          );
          if (!presentacion) return;
          const v1 = presentacion.currentPrice?.precio1 ?? null;
          await handleSave({
            productoId: info.productoId,
            presentacionId: info.presentacionId,
            precio1: v1,
            precio2: presentacion.currentPrice?.precio2 ?? null,
            precio3: presentacion.currentPrice?.precio3 ?? null,
            precio: info.precioNuevo,
            observacion: presentacion.currentPrice?.observacion ?? "",
            confirmado: true,
            requirioConfirmacionManual: true,
          });
        },
      });
    },
    [products, handleSave],
  );

  const closeModal = () => {
    setVariation(null);
    setPendingConfirm(null);
  };

  const selectedProduct = useMemo(
    () => filtered.find((p) => p.productoId === selectedProductoId) ?? null,
    [filtered, selectedProductoId],
  );

  // ============ COMPONENTS ============

  const HeaderBar = (
    <View className="px-4 py-2.5 bg-white border-b border-gray-200">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-sm font-semibold text-texto-principal" numberOfLines={1}>
            {sessionInfo?.mercadoNombre ?? "Captura"}
          </Text>
          <Text className="text-xs text-texto-secundario">
            Semana {sessionInfo?.numeroSemana ?? "—"} · {capturedCount}/{totalCount}
          </Text>
        </View>
        <View>
          <SyncIndicator pending={pendingCount} compact />
        </View>
      </View>
    </View>
  );

  const SearchBar = (
    <View className="flex-row items-center bg-white border-b border-gray-200 px-3 py-2 gap-2">
      <Search size={16} color={colors.textoSecundario} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar producto…"
        placeholderTextColor={colors.textoSecundario}
        className="flex-1 text-sm text-texto-principal min-h-[36px]"
      />
    </View>
  );

  const Filters = (
    <CategoryChips categories={categories} selected={category} onSelect={setCategory} />
  );

  const Footer = (
    <View className="px-3 py-3 bg-white border-t border-gray-200">
      <PressableScale
        onPress={() => router.push(`/(app)/complete/${sessionId}`)}
        disabled={capturedCount === 0}
        className={`bg-primary rounded-xl py-3.5 flex-row items-center justify-center gap-2 min-h-[48px] ${
          capturedCount === 0 ? "opacity-50" : ""
        }`}
      >
        <CheckCheck size={20} color="#fff" />
        <Text className="text-white font-semibold text-base">
          Completar Toma · {capturedCount}/{totalCount}
        </Text>
      </PressableScale>
    </View>
  );

  // ============ TABLET LANDSCAPE: MASTER-DETAIL ============
  if (isTabletLandscape) {
    return (
      <View className="flex-1 bg-white">
        {HeaderBar}
        <View className="flex-1 flex-row">
          <View className="w-[36%] border-r border-gray-200">
            {SearchBar}
            {Filters}
            {loading ? (
              <CaptureSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="Sin productos"
                description={
                  search || category
                    ? "No hay resultados para tu filtro."
                    : "Esta sesión no tiene catálogo cargado."
                }
              />
            ) : (
              <FlashList
                data={filtered}
                renderItem={({ item }) => (
                  <PriceCard
                    product={item}
                    mode="compact"
                    selected={item.productoId === selectedProductoId}
                    onSelect={() => setSelectedProductoId(item.productoId)}
                    onSave={handleSave}
                    onVariation={handleVariation}
                  />
                )}
                keyExtractor={(item) => `${item.productoId}`}
              />
            )}
          </View>
          <View className="flex-1">
            {selectedProduct ? (
              <View className="flex-1">
                <PriceCard
                  key={`detail-${selectedProduct.productoId}`}
                  product={selectedProduct}
                  mode="full"
                  onSave={handleSave}
                  onVariation={handleVariation}
                />
              </View>
            ) : (
              <EmptyState
                title="Selecciona un producto"
                description="Toca un producto en la lista para capturar sus precios."
                icon={<MousePointerClick size={24} color={colors.textoSecundario} />}
              />
            )}
          </View>
        </View>
        {Footer}
        <VariationAlertModal
          visible={variation != null}
          info={variation}
          onCorregir={closeModal}
          onConfirmar={async () => {
            if (pendingConfirm) {
              await pendingConfirm.save();
              toast.success("Precio confirmado y encolado para sincronización.");
            }
            closeModal();
          }}
        />
      </View>
    );
  }

  // ============ PHONE / TABLET PORTRAIT ============
  return (
    <View className="flex-1 bg-white">
      {HeaderBar}
      {SearchBar}
      {Filters}

      {loading ? (
        <CaptureSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description={
            search || category
              ? "No hay resultados para tu filtro."
              : "Esta sesión no tiene catálogo cargado."
          }
        />
      ) : (
        <FlashList
          data={filtered}
          renderItem={({ item }) => (
            <PriceCard
              product={item}
              mode="full"
              onSave={handleSave}
              onVariation={handleVariation}
            />
          )}
          keyExtractor={(item) => `${item.productoId}`}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 120 }}
        />
      )}

      {Footer}

      <VariationAlertModal
        visible={variation != null}
        info={variation}
        onCorregir={closeModal}
        onConfirmar={async () => {
          if (pendingConfirm) {
            await pendingConfirm.save();
            toast.success("Precio confirmado y encolado para sincronización.");
          }
          closeModal();
        }}
      />
    </View>
  );
}
