import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Lock, LogOut } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import * as pricesRepo from "@/db/repos/prices";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth";
import { colors } from "@/theme/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const initials =
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") || user?.username?.[0] || "?";

  const handleLogout = async () => {
    const pending = await pricesRepo.countPendingTotal();
    if (pending > 0) {
      Alert.alert(
        "Precios sin sincronizar",
        `Hay ${pending} precios sin sincronizar. ¿Quieres cerrar sesión igual? Esos precios se perderán.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cerrar sesión",
            style: "destructive",
            onPress: async () => {
              setSigningOut(true);
              await pricesRepo.clear();
              await signOut();
            },
          },
        ],
      );
      return;
    }
    setSigningOut(true);
    await signOut();
  };

  const supervisorMarkets =
    user?.asignaciones.filter((a) => a.rol_codigo === "SUPERVISOR") ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gris-fondo">
      <View className="flex-row items-center px-3 py-2 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft size={20} color={colors.primary} />
        </Pressable>
        <Text className="text-base font-semibold text-texto-principal ml-1">Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <View className="items-center mb-2">
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
              <Text className="text-2xl font-bold text-white">
                {initials.toUpperCase()}
              </Text>
            </View>
            <Text className="text-lg font-bold text-texto-principal">
              {user?.firstName} {user?.lastName}
            </Text>
            <Text className="text-sm text-texto-secundario">@{user?.username}</Text>
            <View className="mt-2 px-3 py-1 rounded-full bg-primary-50">
              <Text className="text-xs font-medium text-primary">Supervisor</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text className="text-sm font-medium text-texto-principal mb-2">
            Mercados asignados
          </Text>
          {supervisorMarkets.length === 0 ? (
            <Text className="text-sm text-texto-secundario">Ningún mercado asignado.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {supervisorMarkets.map((m) => (
                <View
                  key={m.mercado_id}
                  className="px-3 py-1.5 rounded-full bg-gris-fondo border border-gray-200"
                >
                  <Text className="text-xs text-texto-principal">{m.mercado_nombre}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card>
          <Text className="text-sm font-medium text-texto-principal mb-1">Email</Text>
          <Text className="text-sm text-texto-secundario">{user?.email || "—"}</Text>
        </Card>

        <Button
          label="Cambiar contraseña"
          variant="outline"
          leftIcon={<Lock size={18} color={colors.primary} />}
          onPress={() => router.push("/(auth)/change-password")}
        />

        <Button
          label="Cerrar sesión"
          variant="danger"
          loading={signingOut}
          leftIcon={<LogOut size={18} color="#fff" />}
          onPress={handleLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
