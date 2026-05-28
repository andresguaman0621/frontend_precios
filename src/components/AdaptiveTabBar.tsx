import { Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { Home, History, Cloud, type LucideIcon } from "lucide-react-native";

import { PressableScale } from "@/components/ui/PressableScale";
import { useResponsive } from "@/hooks/useResponsive";
import { colors } from "@/theme/colors";

const TAB_META: Record<string, { label: string; Icon: LucideIcon }> = {
  index: { label: "Inicio", Icon: Home },
  "history/index": { label: "Historial", Icon: History },
  "sync-status": { label: "Sync", Icon: Cloud },
};

function isMainTab(name: string): boolean {
  return name in TAB_META;
}

export function AdaptiveTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { isTabletLandscape } = useResponsive();

  // Filtramos rutas no-tab (las que tienen href: null para start-session, capture, etc.)
  const visibleRoutes = state.routes.filter((r) => isMainTab(r.name));

  if (isTabletLandscape) {
    return (
      <SideRail
        state={state}
        descriptors={descriptors}
        navigation={navigation}
        routes={visibleRoutes}
      />
    );
  }
  return (
    <BottomBar
      state={state}
      descriptors={descriptors}
      navigation={navigation}
      routes={visibleRoutes}
    />
  );
}

interface RailProps {
  state: BottomTabBarProps["state"];
  descriptors: BottomTabBarProps["descriptors"];
  navigation: BottomTabBarProps["navigation"];
  routes: BottomTabBarProps["state"]["routes"];
}

function BottomBar({ state, navigation, routes }: RailProps) {
  return (
    <SafeAreaView edges={["bottom"]} className="bg-white border-t border-gray-200">
      <View className="flex-row items-stretch">
        {routes.map((route) => {
          const meta = TAB_META[route.name]!;
          const isFocused = state.routes[state.index]?.key === route.key;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          const color = isFocused ? colors.primary : colors.textoSecundario;
          return (
            <PressableScale
              key={route.key}
              onPress={onPress}
              scaleTo={0.94}
              className="flex-1 items-center justify-center py-2 min-h-[56px]"
            >
              <meta.Icon size={22} color={color} strokeWidth={isFocused ? 2.4 : 1.8} />
              <Text
                className={`text-xs mt-1 ${
                  isFocused ? "text-primary font-semibold" : "text-texto-secundario font-medium"
                }`}
              >
                {meta.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function SideRail({ state, navigation, routes }: RailProps) {
  return (
    <SafeAreaView
      edges={["left", "top", "bottom"]}
      className="bg-white border-r border-gray-200"
      style={{ width: 88 }}
    >
      <View className="flex-1 py-4 gap-2 items-center">
        {routes.map((route) => {
          const meta = TAB_META[route.name]!;
          const isFocused = state.routes[state.index]?.key === route.key;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          const color = isFocused ? colors.primary : colors.textoSecundario;
          return (
            <PressableScale
              key={route.key}
              onPress={onPress}
              scaleTo={0.94}
              className={`w-16 items-center justify-center py-3 rounded-xl ${
                isFocused ? "bg-primary-50 border border-primary-100" : ""
              }`}
            >
              <meta.Icon size={24} color={color} strokeWidth={isFocused ? 2.4 : 1.8} />
              <Text
                className={`text-xs mt-1.5 ${
                  isFocused ? "text-primary font-semibold" : "text-texto-secundario font-medium"
                }`}
              >
                {meta.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
