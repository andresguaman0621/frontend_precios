import { Redirect, Tabs } from "expo-router";
import { View } from "react-native";

import { AdaptiveTabBar } from "@/components/AdaptiveTabBar";
import { AppHeader } from "@/components/AppHeader";
import { ProfileSheet } from "@/components/ProfileSheet";
import { useResponsive } from "@/hooks/useResponsive";
import { useAuthStore } from "@/stores/auth";

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);
  const { isTabletLandscape } = useResponsive();

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View className="flex-1 bg-white">
      <Tabs
        tabBar={(props) => <AdaptiveTabBar {...props} />}
        screenOptions={{
          header: () => <AppHeader />,
          tabBarPosition: isTabletLandscape ? "left" : "bottom",
          animation: "fade",
        }}
        initialRouteName="index"
      >
        <Tabs.Screen name="index" options={{ title: "Inicio" }} />
        <Tabs.Screen name="history/index" options={{ title: "Historial" }} />
        <Tabs.Screen name="sync-status" options={{ title: "Sync" }} />

        {/* Rutas navegables pero NO en tab bar */}
        <Tabs.Screen
          name="start-session"
          options={{
            href: null,
            header: () => <AppHeader showBack title="Iniciar toma" />,
          }}
        />
        <Tabs.Screen
          name="capture/[sessionId]"
          options={{
            href: null,
            header: () => <AppHeader showBack title="Captura" />,
          }}
        />
        <Tabs.Screen
          name="complete/[sessionId]"
          options={{
            href: null,
            header: () => <AppHeader showBack title="Completar toma" />,
          }}
        />
        <Tabs.Screen
          name="history/[sessionId]"
          options={{
            href: null,
            header: () => <AppHeader showBack title="Detalle de sesión" />,
          }}
        />
      </Tabs>
      <ProfileSheet />
    </View>
  );
}
