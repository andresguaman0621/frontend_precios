import { Text } from "react-native";
import { useRouter } from "expo-router";
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from "lucide-react-native";

import { useNetwork } from "@/hooks/useNetwork";
import { colors } from "@/theme/colors";

import { PressableScale } from "./ui/PressableScale";

interface Props {
  pending: number;
  compact?: boolean;
}

export function SyncIndicator({ pending, compact = false }: Props) {
  const { isOnline } = useNetwork();
  const router = useRouter();

  let containerCls = "bg-white border-gray-200";
  let label: string;
  let Icon: typeof RefreshCw;
  let iconColor: string;

  if (!isOnline) {
    containerCls = "bg-danger-50 border-danger-300";
    label = `Offline · ${pending} pendientes`;
    Icon = CloudOff;
    iconColor = colors.danger;
  } else if (pending > 0) {
    containerCls = "bg-warning-50 border-warning-300";
    label = `${pending} sincronizando…`;
    Icon = RefreshCw;
    iconColor = colors.warning;
  } else if (compact) {
    // En modo compacto + online + 0 pending: chip silencioso con check
    label = "Sincronizado";
    Icon = CheckCircle2;
    iconColor = colors.success;
  } else {
    return null; // Sin nada que reportar fuera del compact mode
  }

  return (
    <PressableScale
      onPress={() => router.push("/(app)/sync-status")}
      className={`flex-row items-center gap-2 px-3 py-2 border rounded-xl ${containerCls}`}
    >
      <Icon size={14} color={iconColor} />
      <Text className="text-xs font-medium text-texto-principal flex-1" numberOfLines={1}>
        {label}
      </Text>
      {!compact ? (
        <Text className="text-xs text-texto-secundario">Detalle</Text>
      ) : (
        <Cloud size={12} color={colors.textoSecundario} />
      )}
    </PressableScale>
  );
}
