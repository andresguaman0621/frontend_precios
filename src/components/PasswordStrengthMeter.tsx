import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { evaluatePasswordStrength } from "@/schemas/auth";

interface Props {
  password: string;
}

function Bar({ filled, color }: { filled: boolean; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, { duration: 220 });
  }, [filled, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value > 0 ? color : "#E5E7EB",
    opacity: 0.4 + progress.value * 0.6,
  }));

  return <Animated.View style={animatedStyle} className="flex-1 h-1.5 rounded-full" />;
}

export function PasswordStrengthMeter({ password }: Props) {
  const { score, label, color } = evaluatePasswordStrength(password);
  if (!password) return null;

  return (
    <View className="mt-2" testID="password-strength-meter">
      <View className="flex-row gap-1.5 mb-1.5">
        {[0, 1, 2, 3].map((idx) => (
          <Bar key={idx} filled={idx < score} color={color} />
        ))}
      </View>
      <Text className="text-xs font-medium" style={{ color }}>
        Fortaleza: {label}
      </Text>
    </View>
  );
}
