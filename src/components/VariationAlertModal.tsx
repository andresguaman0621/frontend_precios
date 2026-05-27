import { Modal, Text, View } from "react-native";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";
import { formatCurrency, formatPercent } from "@/utils/format";

export interface VariationAlertInfo {
  productoNombre: string;
  presentacionNombre: string;
  precioNuevo: number;
  precioAnterior: number | null;
  variacion: number | null;
  esAumento: boolean | null;
  umbralInferior: number;
  umbralSuperior: number;
}

interface Props {
  visible: boolean;
  info: VariationAlertInfo | null;
  onCorregir: () => void;
  onConfirmar: () => void;
}

export function VariationAlertModal({ visible, info, onCorregir, onConfirmar }: Props) {
  if (!info) return null;
  const TrendIcon = info.esAumento ? TrendingUp : TrendingDown;
  const trendColor = info.esAumento ? colors.rojoAlza : colors.warning;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60 px-4">
        <View className="w-full max-w-md bg-white rounded-2xl p-6">
          <View className="flex-row items-center gap-2 mb-3">
            <AlertTriangle size={24} color={colors.warning} />
            <Text className="text-lg font-bold text-texto-principal">Variación atípica</Text>
          </View>

          <Text className="text-base font-semibold text-texto-principal">
            {info.productoNombre}
          </Text>
          <Text className="text-sm text-texto-secundario mb-3">
            {info.presentacionNombre}
          </Text>

          <View className="bg-gris-fondo rounded-xl p-3 gap-1 mb-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-texto-secundario">Precio nuevo:</Text>
              <Text className="text-sm font-semibold text-texto-principal">
                {formatCurrency(info.precioNuevo)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-texto-secundario">Precio anterior:</Text>
              <Text className="text-sm font-semibold text-texto-principal">
                {formatCurrency(info.precioAnterior)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-texto-secundario">Variación:</Text>
              <View className="flex-row items-center gap-1">
                <TrendIcon size={16} color={trendColor} />
                <Text className="text-sm font-bold" style={{ color: trendColor }}>
                  {formatPercent(info.variacion)} {info.esAumento ? "(alza)" : "(baja)"}
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-xs text-texto-secundario mb-4 text-center">
            Umbral aceptado: {info.umbralInferior.toFixed(0)}% a +{info.umbralSuperior.toFixed(0)}%
          </Text>

          <View className="flex-row gap-2">
            <Button label="Corregir" variant="outline" onPress={onCorregir} />
            <Button label="Confirmar precio" variant="primary" onPress={onConfirmar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
