import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  tone?: "default" | "success" | "warning" | "danger";
  padded?: boolean;
}

const toneClasses: Record<Required<CardProps>["tone"], string> = {
  default: "bg-white border-gray-200",
  success: "bg-success-50 border-success-300",
  warning: "bg-warning-50 border-warning-300",
  danger: "bg-danger-50 border-danger-300",
};

export function Card({
  tone = "default",
  padded = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      className={`rounded-2xl border ${toneClasses[tone]} ${padded ? "p-4" : ""} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </View>
  );
}
