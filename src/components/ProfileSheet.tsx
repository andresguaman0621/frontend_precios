import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Lock, LogOut, X } from "lucide-react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PressableScale } from "@/components/ui/PressableScale";
import { Sheet } from "@/components/ui/Sheet";
import * as pricesRepo from "@/db/repos/prices";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth";
import { useUiSheets } from "@/stores/uiSheets";
import { colors } from "@/theme/colors";

export function ProfileSheet() {
  const router = useRouter();
  const open = useUiSheets((s) => s.profileOpen);
  const close = useUiSheets((s) => s.closeProfile);
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const supervisorMarkets = user?.asignaciones.filter((a) => a.rol_codigo === "SUPERVISOR") ?? [];

  const fullName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.username || "Usuario";

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
              close();
              await signOut();
            },
          },
        ],
      );
      return;
    }
    setSigningOut(true);
    close();
    await signOut();
  };

  const handleChangePassword = () => {
    close();
    router.push("/(auth)/change-password");
  };

  return (
    <Sheet open={open} onClose={close}>
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-gray-100">
        <Text className="text-base font-semibold text-texto-principal">Cuenta</Text>
        <PressableScale onPress={close} className="p-1.5">
          <X size={20} color={colors.textoSecundario} />
        </PressableScale>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <View className="items-center py-2">
          <Avatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            username={user?.username}
            size="xl"
          />
          <Text className="text-lg font-semibold text-texto-principal mt-3">{fullName}</Text>
          <Text className="text-sm text-texto-secundario">@{user?.username}</Text>
          <View className="mt-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100">
            <Text className="text-xs font-medium text-primary">Supervisor</Text>
          </View>
        </View>

        <Card>
          <Text className="text-xs text-texto-secundario font-medium uppercase tracking-wide mb-2">
            Mercados asignados
          </Text>
          {supervisorMarkets.length === 0 ? (
            <Text className="text-sm text-texto-secundario">Ningún mercado asignado.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {supervisorMarkets.map((m) => (
                <View
                  key={m.mercado_id}
                  className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200"
                >
                  <Text className="text-xs text-texto-principal">{m.mercado_nombre}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card>
          <Text className="text-xs text-texto-secundario font-medium uppercase tracking-wide mb-1.5">
            Email
          </Text>
          <Text className="text-sm text-texto-principal">{user?.email || "—"}</Text>
        </Card>

        <Button
          label="Cambiar contraseña"
          variant="secondary"
          leftIcon={<Lock size={16} color={colors.textoPrincipal} />}
          onPress={handleChangePassword}
        />

        <Button
          label="Cerrar sesión"
          variant="danger"
          loading={signingOut}
          leftIcon={<LogOut size={16} color="#fff" />}
          onPress={handleLogout}
        />
      </ScrollView>
    </Sheet>
  );
}
