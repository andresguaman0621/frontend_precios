import { forwardRef } from "react";
import { ActivityIndicator, Text, View, type PressableProps } from "react-native";

import { PressableScale } from "./PressableScale";

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

const variantClasses: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: "bg-primary", text: "text-white" },
  secondary: { bg: "bg-white border border-gray-200", text: "text-texto-principal" },
  outline: { bg: "bg-white border border-primary", text: "text-primary" },
  danger: { bg: "bg-danger-500", text: "text-white" },
  ghost: { bg: "bg-transparent", text: "text-primary" },
};

const sizeClasses: Record<Size, string> = {
  sm: "py-2 px-3 min-h-[36px]",
  md: "py-2.5 px-4 min-h-[44px]",
  lg: "py-3 px-5 min-h-[48px]",
};

const sizeText: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-base",
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

  const spinnerColor = variant === "primary" || variant === "danger" ? "#fff" : "#27357d";

  return (
    <PressableScale
      ref={ref}
      disabled={isDisabled}
      onPress={onPress}
      className={`rounded-xl items-center justify-center flex-row gap-2 ${v.bg} ${
        sizeClasses[size]
      } ${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-50" : ""}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {leftIcon}
          <Text className={`${v.text} ${sizeText[size]} font-semibold`}>{label}</Text>
          {rightIcon}
        </>
      )}
    </PressableScale>
  );
});
