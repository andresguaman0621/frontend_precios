import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, Trash2, Clock } from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { colors } from "@/theme/colors";

import type { LocalSession } from "@/db/repos/sessions";

interface Props {
  session: LocalSession;
  onCancel: () => void;
}

export function SessionStatusBanner({ session, onCancel }: Props) {
  const router = useRouter();
  return (
    <Card tone="warning">
      <View className="flex-row items-center gap-2 mb-2">
        <Clock size={18} color={colors.warning} />
        <Text className="text-sm font-semibold text-warning-700">Sesión en progreso</Text>
      </View>
      <Text className="text-base font-semibold text-texto-principal" numberOfLines={1}>
        {session.mercadoNombre}
      </Text>
      <Text className="text-xs text-texto-secundario mb-3">
        Semana {session.numeroSemana} · {session.totalProductos} productos
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => router.push(`/(app)/capture/${session.id}`)}
          className="flex-1 flex-row items-center justify-center gap-2 bg-primary rounded-lg py-3"
        >
          <Text className="text-white font-semibold">Continuar</Text>
          <ArrowRight size={16} color="#fff" />
        </Pressable>
        <Pressable
          onPress={onCancel}
          className="flex-row items-center justify-center gap-2 bg-white border border-mmqep-rojo rounded-lg py-3 px-4"
        >
          <Trash2 size={16} color={colors.rojoAlza} />
          <Text className="text-mmqep-rojo font-semibold">Eliminar</Text>
        </Pressable>
      </View>
    </Card>
  );
}
