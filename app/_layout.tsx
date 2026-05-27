import "@/../global.css";

import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import { ToastHost } from "@/components/ui/Toast";
import { ensureDatabase } from "@/db/client";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkWatcher } from "@/hooks/useNetwork";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { SyncManager } from "@/sync/SyncManager";
import { startSyncTriggers } from "@/sync/triggers";
import { colors } from "@/theme/colors";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppShell() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hydrate } = useAuth();
  useNetworkWatcher(() => {
    void SyncManager.maybeFlush();
  });
  usePushNotifications();

  useEffect(() => {
    const stop = startSyncTriggers();
    return () => stop();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await ensureDatabase();
        await hydrate();
        setReady(true);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, [hydrate]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.danger }}>
        <Text className="text-white text-lg font-bold mb-2">Error de inicialización</Text>
        <Text className="text-white text-sm text-center">{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.primary }}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <ToastHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
