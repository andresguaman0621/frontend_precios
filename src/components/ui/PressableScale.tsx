import { forwardRef } from "react";
import { Pressable, type PressableProps, type View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { haptics } from "@/utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 18, stiffness: 240, mass: 0.7 };

export interface PressableScaleProps extends PressableProps {
  /** Escala al presionar. Default 0.96 */
  scaleTo?: number;
  /** Opacidad al presionar. Default 0.85 */
  opacityTo?: number;
  /** Disparar háptica al presionar. Default true */
  haptic?: boolean;
  className?: string;
}

export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  {
    scaleTo = 0.96,
    opacityTo = 0.85,
    haptic = true,
    onPressIn,
    onPressOut,
    style,
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      ref={ref as never}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) {
          scale.value = withSpring(scaleTo, SPRING_CONFIG);
          opacity.value = withSpring(opacityTo, SPRING_CONFIG);
          if (haptic) haptics.lightTap();
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING_CONFIG);
        opacity.value = withSpring(1, SPRING_CONFIG);
        onPressOut?.(e);
      }}
      style={[animatedStyle, style as never]}
      {...rest}
    >
      {children as never}
    </AnimatedPressable>
  );
});
