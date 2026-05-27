import { Pressable, Text, View } from "react-native";

import { colors } from "@/theme/colors";

interface Props {
  label: string;
  value: string | number;
  subValue?: string;
  tone?: "default" | "warning" | "success" | "danger";
  onPress?: () => void;
}

const toneMap = {
  default: { bg: "bg-white", color: colors.textoPrincipal },
  warning: { bg: "bg-warning-50", color: colors.warning },
  success: { bg: "bg-success-50", color: colors.success },
  danger: { bg: "bg-danger-50", color: colors.danger },
};

export function KpiTile({ label, value, subValue, tone = "default", onPress }: Props) {
  const t = toneMap[tone];
  const containerClass = `flex-1 ${t.bg} rounded-2xl p-4 border border-gray-200`;
  const inner = (
    <>
      <Text className="text-xs text-texto-secundario">{label}</Text>
      <Text className="text-2xl font-bold mt-1" style={{ color: t.color }}>
        {value}
      </Text>
      {subValue ? (
        <Text className="text-xs text-texto-secundario mt-1">{subValue}</Text>
      ) : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} className={containerClass}>
        {inner}
      </Pressable>
    );
  }
  return <View className={containerClass}>{inner}</View>;
}
