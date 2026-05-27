import { Text, View } from "react-native";

import { colors } from "@/theme/colors";

interface Props {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: Props) {
  return (
    <View className="items-center justify-center px-6 py-12">
      {icon ? <View className="mb-4 opacity-60">{icon}</View> : null}
      <Text className="text-base font-semibold text-texto-principal text-center">{title}</Text>
      {description ? (
        <Text className="text-sm text-texto-secundario text-center mt-2" style={{ color: colors.textoSecundario }}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}
