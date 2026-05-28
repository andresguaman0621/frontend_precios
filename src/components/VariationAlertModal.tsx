import { ScrollView, Text, View } from "react-native";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
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
  if (!info) {
    return <Sheet open={false} onClose={onCorregir} />;
  }
  const TrendIcon = info.esAumento ? TrendingUp : TrendingDown;
  const trendColor = info.esAumento ? colors.danger : colors.warning;

  return (
    <Sheet open={visible} onClose={onCorregir}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }}>
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-10 h-10 rounded-xl bg-warning-50 border border-warning-300 items-center justify-center">
            <AlertTriangle size={20} color={colors.warning} />
          </View>
          <Text className="text-lg font-semibold text-texto-principal">Variación atípica</Text>
        </View>

        <Text className="text-base font-semibold text-texto-principal">{info.productoNombre}</Text>
        <Text className="text-sm text-texto-secundario mb-4">{info.presentacionNombre}</Text>

        <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 gap-2 mb-4">
          <View className="flex-row justify-between">
            <Text className="text-sm text-texto-secundario">Precio nuevo</Text>
            <Text className="text-sm font-semibold text-texto-principal">
              {formatCurrency(info.precioNuevo)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-texto-secundario">Precio anterior</Text>
            <Text className="text-sm font-semibold text-texto-principal">
              {formatCurrency(info.precioAnterior)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-texto-secundario">Variación</Text>
            <View className="flex-row items-center gap-1">
              <TrendIcon size={16} color={trendColor} />
              <Text className="text-sm font-semibold" style={{ color: trendColor }}>
                {formatPercent(info.variacion)} {info.esAumento ? "alza" : "baja"}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-xs text-texto-secundario mb-5 text-center">
          Umbral aceptado: {info.umbralInferior.toFixed(0)}% a +{info.umbralSuperior.toFixed(0)}%
        </Text>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button label="Corregir" variant="secondary" onPress={onCorregir} />
          </View>
          <View className="flex-1">
            <Button label="Confirmar" variant="primary" onPress={onConfirmar} />
          </View>
        </View>
      </ScrollView>
    </Sheet>
  );
}
