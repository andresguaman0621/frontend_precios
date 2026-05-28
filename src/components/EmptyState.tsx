import { Text, View } from "react-native";

interface Props {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <View className="items-center justify-center px-6 py-12">
      {icon ? (
        <View className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 items-center justify-center mb-4">
          {icon}
        </View>
      ) : null}
      <Text className="text-base font-semibold text-texto-principal text-center">{title}</Text>
      {description ? (
        <Text className="text-sm text-texto-secundario text-center mt-1.5 max-w-xs">
          {description}
        </Text>
      ) : null}
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}
