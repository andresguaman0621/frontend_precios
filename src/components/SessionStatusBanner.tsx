import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, Trash2, Activity } from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { PressableScale } from "@/components/ui/PressableScale";
import { colors } from "@/theme/colors";

import type { LocalSession } from "@/db/repos/sessions";

interface Props {
  session: LocalSession;
  onCancel: () => void;
}

export function SessionStatusBanner({ session, onCancel }: Props) {
  const router = useRouter();
  return (
    <Card>
      <View className="flex-row items-start gap-3 mb-4">
        <View className="w-10 h-10 rounded-xl bg-primary-50 items-center justify-center">
          <Activity size={18} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-texto-secundario font-medium uppercase tracking-wide mb-0.5">
            Toma en progreso
          </Text>
          <Text className="text-base font-semibold text-texto-principal" numberOfLines={1}>
            {session.mercadoNombre}
          </Text>
          <Text className="text-xs text-texto-secundario mt-0.5">
            Semana {session.numeroSemana} · {session.totalProductos} productos
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <PressableScale
          onPress={() => router.push(`/(app)/capture/${session.id}`)}
          className="flex-1 flex-row items-center justify-center gap-2 bg-primary rounded-xl py-3 min-h-[44px]"
        >
          <Text className="text-white font-semibold text-sm">Continuar</Text>
          <ArrowRight size={16} color="#fff" />
        </PressableScale>
        <PressableScale
          onPress={onCancel}
          className="flex-row items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-3 px-4 min-h-[44px]"
        >
          <Trash2 size={16} color={colors.danger} />
        </PressableScale>
      </View>
    </Card>
  );
}
