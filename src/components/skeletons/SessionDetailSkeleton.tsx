import { View } from "react-native";

import { Skeleton } from "@/components/ui/Skeleton";

export function SessionDetailSkeleton() {
  return (
    <View className="flex-1 bg-white p-4 gap-3">
      <View className="gap-2">
        <Skeleton width="60%" height={20} rounded="md" />
        <Skeleton width="40%" height={12} rounded="md" />
        <Skeleton width="50%" height={12} rounded="md" />
        <Skeleton width={80} height={22} rounded="full" />
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1 border border-gray-200 rounded-2xl p-4 gap-2 min-h-[96px]">
          <Skeleton width={80} height={10} rounded="sm" />
          <Skeleton width={64} height={24} rounded="md" />
        </View>
        <View className="flex-1 border border-gray-200 rounded-2xl p-4 gap-2 min-h-[96px]">
          <Skeleton width={80} height={10} rounded="sm" />
          <Skeleton width={64} height={24} rounded="md" />
        </View>
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} className="border border-gray-200 rounded-2xl p-4 gap-2">
          <Skeleton width="70%" height={14} rounded="md" />
          <Skeleton width="40%" height={11} rounded="md" />
          <Skeleton width="80%" height={11} rounded="md" />
        </View>
      ))}
    </View>
  );
}
