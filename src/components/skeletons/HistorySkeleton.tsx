import { View } from "react-native";

import { Skeleton } from "@/components/ui/Skeleton";

export function HistorySkeleton() {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-row gap-2 px-3 py-3 border-b border-gray-200">
        <Skeleton width={68} height={28} rounded="full" />
        <Skeleton width={90} height={28} rounded="full" />
        <Skeleton width={110} height={28} rounded="full" />
      </View>
      <View className="px-3 py-2 gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} className="border border-gray-200 rounded-2xl p-4 bg-white gap-2">
            <View className="flex-row justify-between">
              <Skeleton width="60%" height={16} rounded="md" />
              <Skeleton width={72} height={20} rounded="full" />
            </View>
            <Skeleton width="40%" height={12} rounded="md" />
            <Skeleton width="30%" height={12} rounded="md" />
          </View>
        ))}
      </View>
    </View>
  );
}
