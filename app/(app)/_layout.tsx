import { Redirect, Stack } from "expo-router";
import { Text, View } from "react-native";

import { useAuthStore } from "@/stores/auth";
import { colors } from "@/theme/colors";

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);
  const softLocked = useAuthStore((s) => s.softLocked);

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View className="flex-1">
      {softLocked ? (
        <View
          className="px-4 py-2 items-center"
          style={{ backgroundColor: colors.warning, paddingTop: 36 }}
        >
          <Text className="text-white text-xs font-medium">
            Modo offline — algunas funciones limitadas
          </Text>
        </View>
      ) : null}
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="start-session" />
        <Stack.Screen name="capture/[sessionId]" />
        <Stack.Screen name="complete/[sessionId]" options={{ presentation: "modal" }} />
        <Stack.Screen name="history/index" />
        <Stack.Screen name="history/[sessionId]" />
        <Stack.Screen name="sync-status" />
      </Stack>
    </View>
  );
}
