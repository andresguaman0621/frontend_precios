import { forwardRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  Text,
  View,
} from "react-native";

import { haptics } from "@/utils/haptics";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: "bg-primary active:bg-primary-dark", text: "text-white" },
  secondary: { bg: "bg-mmqep-azul active:bg-primary-dark", text: "text-white" },
  outline: { bg: "bg-white border border-primary", text: "text-primary", border: "border" },
  danger: { bg: "bg-mmqep-rojo active:opacity-90", text: "text-white" },
  ghost: { bg: "bg-transparent active:bg-gris-fondo", text: "text-primary" },
};

const sizeClasses: Record<Size, string> = {
  sm: "py-2 px-3",
  md: "py-3 px-5",
  lg: "py-4 px-6",
};

const sizeText: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-base font-semibold",
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    label,
    variant = "primary",
    size = "lg",
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    fullWidth = true,
    onPress,
    ...rest
  },
  ref,
) {
  const v = variantClasses[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      onPress={(e) => {
        haptics.lightTap();
        onPress?.(e);
      }}
      className={`rounded-xl items-center justify-center flex-row gap-2 min-h-[48px] ${v.bg} ${
        sizeClasses[size]
      } ${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-60" : ""}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" || variant === "ghost" ? "#27357d" : "#fff"} />
      ) : (
        <>
          {leftIcon}
          <Text className={`${v.text} ${sizeText[size]} font-semibold`}>{label}</Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
});
