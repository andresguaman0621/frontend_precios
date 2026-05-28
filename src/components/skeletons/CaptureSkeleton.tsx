import { View } from "react-native";

import { Skeleton } from "@/components/ui/Skeleton";
import { useResponsive } from "@/hooks/useResponsive";

function PriceCardSkeleton() {
  return (
    <View className="rounded-2xl border border-gray-200 p-4 mx-3 my-1.5 bg-white gap-3">
      <Skeleton width="60%" height={16} rounded="md" />
      <Skeleton width="40%" height={12} rounded="md" />
      <View className="flex-row gap-2 mt-1">
        <View className="flex-1 gap-1.5">
          <Skeleton width={24} height={10} rounded="sm" />
          <Skeleton width="100%" height={48} rounded="xl" />
        </View>
        <View className="flex-1 gap-1.5">
          <Skeleton width={24} height={10} rounded="sm" />
          <Skeleton width="100%" height={48} rounded="xl" />
        </View>
        <View className="flex-1 gap-1.5">
          <Skeleton width={24} height={10} rounded="sm" />
          <Skeleton width="100%" height={48} rounded="xl" />
        </View>
        <View style={{ minWidth: 80 }} className="gap-1.5">
          <Skeleton width={64} height={10} rounded="sm" />
          <Skeleton width={80} height={48} rounded="xl" />
        </View>
      </View>
    </View>
  );
}

function CompactRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 px-3 py-2.5 mx-2 my-1 rounded-xl border border-gray-200 bg-white min-h-[56px]">
      <View className="flex-1 gap-1.5">
        <Skeleton width="80%" height={14} rounded="md" />
        <Skeleton width="50%" height={11} rounded="sm" />
      </View>
      <Skeleton width={56} height={14} rounded="md" />
    </View>
  );
}

export function CaptureSkeleton() {
  const { isTabletLandscape } = useResponsive();

  if (isTabletLandscape) {
    return (
      <View className="flex-1 bg-white">
        <View className="px-4 py-2.5 border-b border-gray-200">
          <Skeleton width="50%" height={14} rounded="md" />
        </View>
        <View className="flex-1 flex-row">
          <View className="w-[36%] border-r border-gray-200 py-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <CompactRowSkeleton key={i} />
            ))}
          </View>
          <View className="flex-1 py-2">
            <PriceCardSkeleton />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-2.5 border-b border-gray-200">
        <Skeleton width="50%" height={14} rounded="md" />
      </View>
      <View className="flex-1 py-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <PriceCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}
