import { useEffect } from "react";
import { View, type ViewStyle, type DimensionValue } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}

const radiusMap: Record<NonNullable<SkeletonProps["rounded"]>, number> = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  full: 9999,
};

export function Skeleton({
  width = "100%",
  height = 16,
  rounded = "md",
  className,
}: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.5, 1, 0.5]),
  }));

  const baseStyle: ViewStyle = {
    width,
    height,
    borderRadius: radiusMap[rounded],
    backgroundColor: "#E5E7EB", // gray-200
    overflow: "hidden",
  };

  return (
    <View style={baseStyle} className={className}>
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: "#F3F4F6", // gray-100
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
