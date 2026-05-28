import { View } from "react-native";

import { Skeleton } from "@/components/ui/Skeleton";

export function SyncStatusSkeleton() {
  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200 gap-3">
        <View className="flex-row items-center gap-2">
          <Skeleton width={36} height={36} rounded="xl" />
          <View className="flex-1 gap-1.5">
            <Skeleton width="40%" height={14} rounded="md" />
            <Skeleton width="60%" height={11} rounded="md" />
          </View>
        </View>
        <Skeleton width="100%" height={48} rounded="xl" />
      </View>
      <View className="flex-row gap-1.5 px-3 py-2.5 border-b border-gray-200">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} width="24%" height={44} rounded="lg" />
        ))}
      </View>
      <View className="px-3 py-3 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} className="border border-gray-200 rounded-2xl p-4 flex-row gap-3 bg-white">
            <Skeleton width={36} height={36} rounded="xl" />
            <View className="flex-1 gap-1.5">
              <Skeleton width="70%" height={14} rounded="md" />
              <Skeleton width="50%" height={11} rounded="md" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
