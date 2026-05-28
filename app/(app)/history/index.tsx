import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { ListChecks } from "lucide-react-native";

import * as sessionsApi from "@/api/sessions";
import { queryKeys } from "@/api/queries";
import { Card } from "@/components/ui/Card";
import { PressableScale } from "@/components/ui/PressableScale";
import { EmptyState } from "@/components/EmptyState";
import { HistorySkeleton } from "@/components/skeletons/HistorySkeleton";
import { colors } from "@/theme/colors";
import { formatDateTime } from "@/utils/format";

import type { SesionListItem } from "@/schemas/api";

const PAGE_SIZE = 20;

export default function HistoryListScreen() {
  const router = useRouter();
  const [estado, setEstado] = useState<"INICIADA" | "COMPLETADA" | null>(null);

  const query = useInfiniteQuery({
    queryKey: queryKeys.sessions.list({ estado }),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return sessionsApi.list({
        page: pageParam as number,
        page_size: PAGE_SIZE,
        ...(estado ? { estado } : {}),
      });
    },
    getNextPageParam: (last) => {
      if (!last) return undefined;
      const nextPage = last.page + 1;
      return nextPage <= last.total_pages ? nextPage : undefined;
    },
  });

  useFocusEffect(
    useCallback(() => {
      query.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  const renderItem = ({ item }: { item: SesionListItem }) => (
    <View className="mx-3 my-1.5">
      <PressableScale onPress={() => router.push(`/(app)/history/${item.id}`)}>
        <Card>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-semibold text-texto-principal" numberOfLines={1}>
                {item.mercado_nombre}
              </Text>
              <Text className="text-xs text-texto-secundario mt-0.5">
                Semana {item.numero_semana} · {formatDateTime(item.fecha_inicio)}
              </Text>
              <Text className="text-xs text-texto-secundario mt-0.5">
                {item.total_productos} producto{item.total_productos === 1 ? "" : "s"}
              </Text>
            </View>
            <View
              className={`px-2.5 py-1 rounded-full border ${
                item.estado === "COMPLETADA"
                  ? "bg-success-50 border-success-300"
                  : "bg-warning-50 border-warning-300"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  item.estado === "COMPLETADA" ? "text-success-700" : "text-warning-700"
                }`}
              >
                {item.estado}
              </Text>
            </View>
          </View>
        </Card>
      </PressableScale>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row gap-2 px-3 py-3 bg-white border-b border-gray-200">
        <FilterChip label="Todas" active={estado === null} onPress={() => setEstado(null)} />
        <FilterChip
          label="Iniciadas"
          active={estado === "INICIADA"}
          onPress={() => setEstado(estado === "INICIADA" ? null : "INICIADA")}
        />
        <FilterChip
          label="Completadas"
          active={estado === "COMPLETADA"}
          onPress={() => setEstado(estado === "COMPLETADA" ? null : "COMPLETADA")}
        />
      </View>

      {query.isLoading ? (
        <HistorySkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin sesiones"
          description="Tus tomas aparecerán aquí."
          icon={<ListChecks size={24} color={colors.textoSecundario} />}
        />
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.id}`}
          contentContainerStyle={{ paddingVertical: 4 }}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} className="my-4" />
            ) : null
          }
        />
      )}
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      className={`px-3.5 py-1.5 rounded-full border ${
        active ? "bg-primary border-primary" : "bg-white border-gray-200"
      }`}
    >
      <Text className={`text-xs font-medium ${active ? "text-white" : "text-texto-principal"}`}>
        {label}
      </Text>
    </PressableScale>
  );
}
