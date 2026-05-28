import { Text, View } from "react-native";

import { PressableScale } from "./PressableScale";

export type TileTone = "default" | "success" | "warning" | "danger" | "primary";

export interface TileProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: TileTone;
  onPress?: () => void;
  /** w-full por default. Permite "w-[48%]" o "w-1/3" custom */
  widthClassName?: string;
}

const toneClasses: Record<TileTone, { value: string; chip: string }> = {
  default: { value: "text-texto-principal", chip: "bg-gray-50" },
  primary: { value: "text-primary", chip: "bg-primary-50" },
  success: { value: "text-success-700", chip: "bg-success-50" },
  warning: { value: "text-warning-700", chip: "bg-warning-50" },
  danger: { value: "text-danger-700", chip: "bg-danger-50" },
};

export function Tile({
  label,
  value,
  hint,
  icon,
  tone = "default",
  onPress,
  widthClassName = "flex-1",
}: TileProps) {
  const t = toneClasses[tone];

  const content = (
    <View
      className={`${widthClassName} bg-white border border-gray-200 rounded-2xl p-4 min-h-[96px]`}
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-xs text-texto-secundario font-medium uppercase tracking-wide">
          {label}
        </Text>
        {icon ? (
          <View className={`w-7 h-7 rounded-lg items-center justify-center ${t.chip}`}>{icon}</View>
        ) : null}
      </View>
      <Text className={`text-2xl font-semibold ${t.value}`}>{value}</Text>
      {hint ? <Text className="text-xs text-texto-secundario mt-1">{hint}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} className={widthClassName}>
        {content}
      </PressableScale>
    );
  }
  return content;
}
