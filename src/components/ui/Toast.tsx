import { Pressable, Text, View } from "react-native";
import { CheckCircle2, AlertCircle, Info, XCircle, X, type LucideIcon } from "lucide-react-native";

import { useToastStore, type ToastTone } from "@/stores/toast";
import { colors } from "@/theme/colors";

const toneMap: Record<ToastTone, { bg: string; border: string; icon: LucideIcon; color: string }> = {
  info: { bg: "bg-white", border: "border-gray-300", icon: Info, color: colors.primary },
  success: { bg: "bg-success-50", border: "border-success-300", icon: CheckCircle2, color: colors.success },
  warning: { bg: "bg-warning-50", border: "border-warning-300", icon: AlertCircle, color: colors.warning },
  error: { bg: "bg-danger-50", border: "border-danger-300", icon: XCircle, color: colors.danger },
};

export function ToastHost() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  if (items.length === 0) return null;

  return (
    <View pointerEvents="box-none" className="absolute bottom-8 left-0 right-0 items-center px-4 gap-2">
      {items.slice(-3).map((item) => {
        const { bg, border, icon: Icon, color } = toneMap[item.tone];
        return (
          <Pressable
            key={item.id}
            onPress={() => dismiss(item.id)}
            className={`flex-row items-center gap-3 px-4 py-3 rounded-xl border ${bg} ${border} w-full max-w-md shadow`}
          >
            <Icon size={20} color={color} />
            <Text className="flex-1 text-sm text-texto-principal">{item.message}</Text>
            <X size={16} color={colors.textoSecundario} />
          </Pressable>
        );
      })}
    </View>
  );
}
