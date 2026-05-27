import { Text, View } from "react-native";

import { evaluatePasswordStrength } from "@/schemas/auth";

interface Props {
  password: string;
}

export function PasswordStrengthMeter({ password }: Props) {
  const { score, label, color } = evaluatePasswordStrength(password);
  if (!password) return null;

  return (
    <View className="mt-2" testID="password-strength-meter">
      <View className="flex-row gap-1 mb-1">
        {[0, 1, 2, 3].map((idx) => (
          <View
            key={idx}
            className="flex-1 h-1.5 rounded-full"
            style={{
              backgroundColor: idx < score ? color : "#E5E7EB",
            }}
          />
        ))}
      </View>
      <Text className="text-xs" style={{ color }}>
        Fortaleza: {label}
      </Text>
    </View>
  );
}
