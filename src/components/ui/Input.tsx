import { forwardRef, useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

import { colors } from "@/theme/colors";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  helper?: string;
  rightIcon?: React.ReactNode;
  secure?: boolean;
  textArea?: boolean;
  variant?: "default" | "numeric";
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helper,
    rightIcon,
    secure = false,
    textArea = false,
    variant = "default",
    value,
    onChangeText,
    ...rest
  },
  ref,
) {
  const [show, setShow] = useState(false);
  const isSecure = secure && !show;
  const numericSize = variant === "numeric";
  const lines = textArea ? 4 : 1;

  return (
    <View className="w-full">
      {label ? (
        <Text className="text-sm font-medium text-texto-principal mb-1">{label}</Text>
      ) : null}
      <View
        className={`flex-row items-center bg-white rounded-lg border ${
          error ? "border-mmqep-rojo" : "border-gray-300"
        } ${textArea ? "min-h-[100px] items-start py-2" : "min-h-[48px]"}`}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          multiline={textArea}
          numberOfLines={lines}
          placeholderTextColor={colors.textoSecundario}
          className={`flex-1 px-3 text-texto-principal ${
            numericSize ? "text-2xl" : "text-base"
          } ${textArea ? "py-2 text-base" : ""}`}
          style={{
            textAlignVertical: textArea ? "top" : "center",
          }}
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setShow((s) => !s)} className="px-3 py-2">
            {show ? (
              <EyeOff size={20} color={colors.textoSecundario} />
            ) : (
              <Eye size={20} color={colors.textoSecundario} />
            )}
          </Pressable>
        ) : (
          rightIcon ? <View className="px-3">{rightIcon}</View> : null
        )}
      </View>
      {error ? (
        <Text className="text-xs text-mmqep-rojo mt-1">{error}</Text>
      ) : helper ? (
        <Text className="text-xs text-texto-secundario mt-1">{helper}</Text>
      ) : null}
    </View>
  );
});
