import { View, Text } from "react-native";

export interface AvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap: Record<NonNullable<AvatarProps["size"]>, { box: string; text: string }> = {
  sm: { box: "w-8 h-8", text: "text-xs" },
  md: { box: "w-10 h-10", text: "text-sm" },
  lg: { box: "w-16 h-16", text: "text-xl" },
  xl: { box: "w-24 h-24", text: "text-3xl" },
};

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  username?: string | null,
): string {
  const first = (firstName ?? "").trim();
  const last = (lastName ?? "").trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?";
  }
  const u = (username ?? "").trim();
  if (!u) return "?";
  return u.slice(0, 2).toUpperCase();
}

export function Avatar({ firstName, lastName, username, size = "md", className }: AvatarProps) {
  const initials = getInitials(firstName, lastName, username);
  const sz = sizeMap[size];
  return (
    <View
      className={`${sz.box} rounded-full bg-primary items-center justify-center ${className ?? ""}`}
    >
      <Text className={`${sz.text} font-semibold text-white`}>{initials}</Text>
    </View>
  );
}
