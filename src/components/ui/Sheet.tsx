import { useEffect } from "react";
import { Modal, Pressable, View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useResponsive } from "@/hooks/useResponsive";

const SPRING = { damping: 22, stiffness: 220, mass: 0.7 };
const TIMING = { duration: 220, easing: Easing.out(Easing.cubic) };

export interface SheetProps extends ViewProps {
  open: boolean;
  onClose: () => void;
  /** Ancho del drawer en tablet. Default 400 */
  tabletWidth?: number;
}

export function Sheet({ open, onClose, children, tabletWidth = 400, ...rest }: SheetProps) {
  const { isTabletLandscape, height } = useResponsive();
  const isDrawer = isTabletLandscape;

  const progress = useSharedValue(0);

  useEffect(() => {
    if (open) {
      progress.value = withSpring(1, SPRING);
    } else {
      progress.value = withTiming(0, TIMING);
    }
  }, [open, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.5,
  }));

  const panelStyle = useAnimatedStyle(() => {
    if (isDrawer) {
      return {
        transform: [{ translateX: (1 - progress.value) * tabletWidth }],
      };
    }
    return {
      transform: [{ translateY: (1 - progress.value) * height }],
    };
  });

  const handleBackdropPress = () => {
    progress.value = withTiming(0, TIMING, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1">
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#000",
            },
            backdropStyle,
          ]}
        >
          <Pressable className="flex-1" onPress={handleBackdropPress} />
        </Animated.View>

        <Animated.View
          style={[
            isDrawer
              ? {
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: tabletWidth,
                }
              : {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  maxHeight: "85%",
                },
            panelStyle,
          ]}
          className={`bg-white ${isDrawer ? "" : "rounded-t-2xl"} border border-gray-200`}
          {...rest}
        >
          <SafeAreaView edges={isDrawer ? ["top", "bottom"] : ["bottom"]} className="flex-1">
            {!isDrawer ? (
              <View className="items-center pt-2 pb-1">
                <View className="w-10 h-1 rounded-full bg-gray-300" />
              </View>
            ) : null}
            {children}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
