import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  CheckCircle2,
  AlertTriangle,
  Cloud,
  ChevronDown,
  ChevronUp,
  XCircle,
} from "lucide-react-native";

import { Input } from "@/components/ui/Input";
import { PressableScale } from "@/components/ui/PressableScale";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { colors } from "@/theme/colors";
import { average, parseDecimal } from "@/utils/decimal";
import { formatCurrency } from "@/utils/format";
import { haptics } from "@/utils/haptics";
import { evaluateVariation } from "@/utils/variation";

import type { CatalogProduct } from "@/hooks/useCatalog";
import type { LocalPrice } from "@/db/repos/prices";

export interface VariationDetected {
  productoId: number;
  presentacionId: number;
  presentacionNombre: string;
  productoNombre: string;
  precioNuevo: number;
  precioAnterior: number | null;
  variacion: number;
  esAumento: boolean;
  umbralInferior: number;
  umbralSuperior: number;
}

interface Props {
  product: CatalogProduct;
  mode?: "full" | "compact";
  selected?: boolean;
  onSelect?: () => void;
  onSave: (input: SavePriceInput) => Promise<LocalPrice | null>;
  onVariation: (info: VariationDetected) => void;
}

export interface SavePriceInput {
  productoId: number;
  presentacionId: number;
  precio1: number | null;
  precio2: number | null;
  precio3: number | null;
  precio: number;
  observacion: string;
  confirmado: boolean;
  requirioConfirmacionManual: boolean;
}

const DEFAULT_UMBRAL_INF = -32;
const DEFAULT_UMBRAL_SUP = 34;

function PriceCardImpl({
  product,
  mode = "full",
  selected = false,
  onSelect,
  onSave,
  onVariation,
}: Props) {
  const presentaciones = product.presentaciones;
  const [selectedPresId, setSelectedPresId] = useState(presentaciones[0]?.presentacionId ?? 0);
  const [showObservation, setShowObservation] = useState(false);

  const selectedPres = useMemo(
    () => presentaciones.find((p) => p.presentacionId === selectedPresId) ?? presentaciones[0]!,
    [presentaciones, selectedPresId],
  );

  const existing = selectedPres.currentPrice;

  const [p1, setP1] = useState<string>(existing?.precio1?.toString() ?? "");
  const [p2, setP2] = useState<string>(existing?.precio2?.toString() ?? "");
  const [p3, setP3] = useState<string>(existing?.precio3?.toString() ?? "");
  const [observacion, setObservacion] = useState<string>(existing?.observacion ?? "");

  const refP1 = useRef<TextInput>(null);
  const refP2 = useRef<TextInput>(null);
  const refP3 = useRef<TextInput>(null);

  useEffect(() => {
    setP1(existing?.precio1?.toString() ?? "");
    setP2(existing?.precio2?.toString() ?? "");
    setP3(existing?.precio3?.toString() ?? "");
    setObservacion(existing?.observacion ?? "");
    setShowObservation(Boolean(existing?.observacion));
  }, [selectedPresId, existing]);

  const v1 = parseDecimal(p1);
  const v2 = parseDecimal(p2);
  const v3 = parseDecimal(p3);
  const avg = average([v1, v2, v3]);

  const runSave = async (confirmado = true) => {
    if (avg == null) return;
    const umbralInf = selectedPres.umbralInferior ?? DEFAULT_UMBRAL_INF;
    const umbralSup = selectedPres.umbralSuperior ?? DEFAULT_UMBRAL_SUP;
    const variation = evaluateVariation(avg, selectedPres.lastPrice, umbralInf, umbralSup);

    if (
      !confirmado &&
      variation.hayAlerta &&
      variation.variacion != null &&
      variation.esAumento != null
    ) {
      haptics.warning();
      onVariation({
        productoId: product.productoId,
        presentacionId: selectedPres.presentacionId,
        presentacionNombre: selectedPres.presentacionNombre,
        productoNombre: product.productoNombre,
        precioNuevo: avg,
        precioAnterior: selectedPres.lastPrice,
        variacion: variation.variacion,
        esAumento: variation.esAumento,
        umbralInferior: umbralInf,
        umbralSuperior: umbralSup,
      });
      return;
    }

    const saved = await onSave({
      productoId: product.productoId,
      presentacionId: selectedPres.presentacionId,
      precio1: v1,
      precio2: v2,
      precio3: v3,
      precio: avg,
      observacion,
      confirmado: true,
      requirioConfirmacionManual: variation.hayAlerta,
    });
    if (saved) haptics.success();
  };

  const debouncedSave = useDebouncedCallback(() => {
    void runSave(false);
  }, 500);

  const debouncedSaveObservation = useDebouncedCallback(() => {
    if (avg != null) {
      void runSave(true);
    }
  }, 600);

  const handleChangeP = (setter: (v: string) => void, value: string) => {
    setter(value);
    debouncedSave.call();
  };

  const handleObservation = (value: string) => {
    setObservacion(value.slice(0, 250));
    debouncedSaveObservation.call();
  };

  const syncState = existing?.syncState ?? null;
  const stateChip = (() => {
    if (!syncState) return null;
    if (syncState === "synced") {
      return (
        <View className="flex-row items-center gap-1">
          <Cloud size={12} color={colors.textoSecundario} />
          <Text className="text-xs text-texto-secundario">Sincronizado</Text>
        </View>
      );
    }
    if (syncState === "pending" || syncState === "syncing") {
      return (
        <View className="flex-row items-center gap-1">
          <CheckCircle2 size={12} color={colors.success} />
          <Text className="text-xs text-success-700">Guardado</Text>
        </View>
      );
    }
    if (syncState === "conflict") {
      return (
        <View className="flex-row items-center gap-1">
          <AlertTriangle size={12} color={colors.warning} />
          <Text className="text-xs text-warning-700">Conflicto</Text>
        </View>
      );
    }
    return (
      <View className="flex-row items-center gap-1">
        <XCircle size={12} color={colors.danger} />
        <Text className="text-xs text-danger-700">Error</Text>
      </View>
    );
  })();

  // ============ COMPACT MODE ============
  if (mode === "compact") {
    const compactBg =
      syncState === "conflict"
        ? "bg-warning-50 border-warning-300"
        : syncState === "error"
          ? "bg-danger-50 border-danger-300"
          : "bg-white border-gray-200";

    return (
      <PressableScale
        onPress={onSelect}
        className={`flex-row items-center gap-3 px-3 py-2.5 mx-2 my-1 rounded-xl border min-h-[56px] ${compactBg} ${
          selected ? "border-primary" : ""
        }`}
      >
        <View className="flex-1">
          <Text className="text-sm font-medium text-texto-principal" numberOfLines={1}>
            {product.productoNombre}
          </Text>
          <Text className="text-xs text-texto-secundario" numberOfLines={1}>
            {selectedPres.presentacionNombre}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-semibold text-texto-principal">
            {existing?.precio != null ? formatCurrency(existing.precio) : "—"}
          </Text>
          {stateChip ? <View className="mt-0.5">{stateChip}</View> : null}
        </View>
      </PressableScale>
    );
  }

  // ============ FULL MODE ============
  const cardTone =
    syncState === "conflict"
      ? "bg-warning-50 border-warning-300"
      : syncState === "error"
        ? "bg-danger-50 border-danger-300"
        : "bg-white border-gray-200";

  return (
    <View className={`rounded-2xl border p-4 mx-3 my-1.5 ${cardTone}`}>
      <Text className="text-base font-semibold text-texto-principal">{product.productoNombre}</Text>
      <Text className="text-xs text-texto-secundario mt-0.5">{product.productoCategoria}</Text>

      {presentaciones.length > 1 ? (
        <View className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
          <Picker
            selectedValue={selectedPresId}
            onValueChange={(v) => setSelectedPresId(Number(v))}
            style={{ height: 50 }}
          >
            {presentaciones.map((p) => (
              <Picker.Item
                key={p.presentacionId}
                label={p.presentacionNombre}
                value={p.presentacionId}
              />
            ))}
          </Picker>
        </View>
      ) : (
        <Text className="text-xs text-texto-secundario mt-1">
          {selectedPres.presentacionNombre}
        </Text>
      )}

      <View className="flex-row gap-2 mt-4 items-end">
        <View className="flex-1">
          <Text className="text-xs text-texto-secundario mb-1.5 font-medium">P1</Text>
          <TextInput
            ref={refP1}
            value={p1}
            onChangeText={(v) => handleChangeP(setP1, v)}
            keyboardType="decimal-pad"
            returnKeyType="next"
            placeholder="0.00"
            placeholderTextColor={colors.textoSecundario}
            className="bg-white rounded-xl border border-gray-200 px-2 py-2 text-xl text-center font-medium"
            style={{ minHeight: 48 }}
            onSubmitEditing={() => refP2.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-texto-secundario mb-1.5 font-medium">P2</Text>
          <TextInput
            ref={refP2}
            value={p2}
            onChangeText={(v) => handleChangeP(setP2, v)}
            keyboardType="decimal-pad"
            returnKeyType="next"
            placeholder="0.00"
            placeholderTextColor={colors.textoSecundario}
            className="bg-white rounded-xl border border-gray-200 px-2 py-2 text-xl text-center font-medium"
            style={{ minHeight: 48 }}
            onSubmitEditing={() => refP3.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-texto-secundario mb-1.5 font-medium">P3</Text>
          <TextInput
            ref={refP3}
            value={p3}
            onChangeText={(v) => handleChangeP(setP3, v)}
            keyboardType="decimal-pad"
            returnKeyType="done"
            placeholder="0.00"
            placeholderTextColor={colors.textoSecundario}
            className="bg-white rounded-xl border border-gray-200 px-2 py-2 text-xl text-center font-medium"
            style={{ minHeight: 48 }}
          />
        </View>
        <View className="items-center min-w-[80px]">
          <Text className="text-xs text-texto-secundario mb-1.5 font-medium">Promedio</Text>
          <View className="bg-primary rounded-xl px-2 py-2 min-h-[48px] justify-center min-w-[80px]">
            <Text className="text-white font-semibold text-base text-center" numberOfLines={1}>
              {avg != null ? formatCurrency(avg) : "—"}
            </Text>
          </View>
        </View>
      </View>

      {selectedPres.lastPrice != null ? (
        <Text className="text-xs text-texto-secundario mt-3">
          Precio anterior: {formatCurrency(selectedPres.lastPrice)}
        </Text>
      ) : null}

      <PressableScale
        onPress={() => setShowObservation((v) => !v)}
        className="flex-row items-center gap-1 mt-3 py-1"
        haptic={false}
      >
        {showObservation ? (
          <ChevronUp size={14} color={colors.primary} />
        ) : (
          <ChevronDown size={14} color={colors.primary} />
        )}
        <Text className="text-xs text-primary font-medium">
          {showObservation ? "Ocultar observación" : "Agregar observación"}
        </Text>
        {observacion ? (
          <Text className="text-xs text-texto-secundario ml-1">({observacion.length}/250)</Text>
        ) : null}
      </PressableScale>

      {showObservation ? (
        <View className="mt-2">
          <Input
            value={observacion}
            onChangeText={handleObservation}
            placeholder="Observación (máx 250)"
            textArea
            maxLength={250}
            helper={`${observacion.length}/250`}
          />
        </View>
      ) : null}

      <View className="flex-row items-center justify-between mt-3">
        {stateChip ?? <View />}
        {existing?.requirioConfirmacionManual ? (
          <Text className="text-xs text-warning-700 font-medium">⚠ Variación confirmada</Text>
        ) : null}
      </View>
    </View>
  );
}

export const PriceCard = memo(PriceCardImpl, (prev, next) => {
  if (prev.product.productoId !== next.product.productoId) return false;
  if (prev.mode !== next.mode) return false;
  if (prev.selected !== next.selected) return false;
  const prevPresent = prev.product.presentaciones[0]?.currentPrice;
  const nextPresent = next.product.presentaciones[0]?.currentPrice;
  if (prevPresent?.clientUuid !== nextPresent?.clientUuid) return false;
  if (prevPresent?.syncState !== nextPresent?.syncState) return false;
  if (prevPresent?.precio !== nextPresent?.precio) return false;
  return true;
});
