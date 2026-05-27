import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { Cloud, CloudOff, RefreshCw } from "lucide-react-native";

import { useNetwork } from "@/hooks/useNetwork";
import { colors } from "@/theme/colors";

interface Props {
  pending: number;
  compact?: boolean;
}

export function SyncIndicator({ pending, compact = false }: Props) {
  const { isOnline } = useNetwork();
  const router = useRouter();

  if (isOnline && pending === 0) return null;

  let bg: string = "bg-warning-50 border-warning-300";
  let label: string = `${pending} sincronizando...`;
  let Icon: typeof RefreshCw = RefreshCw;
  let color: string = colors.warning;

  if (!isOnline) {
    bg = "bg-danger-50 border-danger-300";
    label = `Modo offline · ${pending} pendientes`;
    Icon = CloudOff;
    color = colors.danger;
  } else if (pending === 0) {
    bg = "bg-success-50 border-success-300";
    label = "Sincronizado";
    Icon = Cloud;
    color = colors.success;
  }

  return (
    <Pressable
      onPress={() => router.push("/(app)/sync-status")}
      className={`flex-row items-center gap-2 px-3 py-2 border rounded-lg ${bg} ${
        compact ? "" : "mx-3 my-2"
      }`}
    >
      <Icon size={16} color={color} />
      <Text className="text-xs font-medium text-texto-principal flex-1">{label}</Text>
      <Text className="text-xs text-texto-secundario">Ver detalle</Text>
    </Pressable>
  );
}

