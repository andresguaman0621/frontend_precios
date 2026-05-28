import { Text, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { ChevronLeft, WifiOff } from "lucide-react-native";

import { Avatar } from "@/components/ui/Avatar";
import { PressableScale } from "@/components/ui/PressableScale";
import { useAuthStore } from "@/stores/auth";
import { useUiSheets } from "@/stores/uiSheets";
import { colors } from "@/theme/colors";

interface Props {
  /** Si se provee, se ignora la lógica de auto-back y se usa este título */
  title?: string;
  /** Si true muestra back button izquierda y oculta título (back from stack) */
  showBack?: boolean;
}

const TITLE_BY_SEGMENT: Record<string, string> = {
  index: "Inicio",
  "history/index": "Historial",
  "sync-status": "Sincronización",
  "start-session": "Iniciar toma",
  "capture/[sessionId]": "Captura",
  "complete/[sessionId]": "Completar toma",
  "history/[sessionId]": "Detalle de sesión",
};

function pickTitle(segments: string[]): string {
  // segments will include "(app)" + rest
  const path = segments.slice(1).join("/");
  return TITLE_BY_SEGMENT[path] ?? "Toma de precios";
}

export function AppHeader({ title, showBack = false }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const softLocked = useAuthStore((s) => s.softLocked);
  const openProfile = useUiSheets((s) => s.openProfile);

  const computedTitle = title ?? pickTitle(segments as unknown as string[]);

  return (
    <View className="bg-white border-b border-gray-200">
      <View className="flex-row items-center justify-between px-4 py-3 min-h-[56px]">
        <View className="flex-row items-center gap-2 flex-1">
          {showBack ? (
            <PressableScale onPress={() => router.back()} className="p-1.5 -ml-1.5">
              <ChevronLeft size={22} color={colors.primary} />
            </PressableScale>
          ) : null}
          <Text className="text-lg font-semibold text-texto-principal" numberOfLines={1}>
            {computedTitle}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {softLocked ? (
            <View className="flex-row items-center gap-1 px-2 py-1 bg-warning-50 border border-warning-300 rounded-full">
              <WifiOff size={12} color={colors.warning} />
              <Text className="text-xs font-medium text-warning-700">Offline</Text>
            </View>
          ) : null}

          <PressableScale onPress={openProfile} className="ml-1">
            <Avatar
              firstName={user?.firstName}
              lastName={user?.lastName}
              username={user?.username}
              size="md"
            />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}
