import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { ChevronLeft, ListChecks } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as sessionsApi from "@/api/sessions";
import { queryKeys } from "@/api/queries";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/EmptyState";
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
      return nextPage <= last.pages ? nextPage : undefined;
    },
  });

  useFocusEffect(
    useCallback(() => {
      query.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );

  const renderItem = ({ item }: { item: SesionListItem }) => (
    <Pressable
      onPress={() => router.push(`/(app)/history/${item.id}`)}
      className="mx-3 my-1.5"
    >
      <Card>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-texto-principal" numberOfLines={1}>
              {item.mercado_nombre}
            </Text>
            <Text className="text-xs text-texto-secundario">
              Semana {item.numero_semana} · {formatDateTime(item.fecha_inicio)}
            </Text>
            <Text className="text-xs text-texto-secundario mt-1">
              {item.total_productos} productos
            </Text>
          </View>
          <View
            className={`px-2 py-1 rounded-full ${
              item.estado === "COMPLETADA"
                ? "bg-success-50"
                : "bg-warning-50"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                item.estado === "COMPLETADA"
                  ? "text-success-700"
                  : "text-warning-700"
              }`}
            >
              {item.estado}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-gris-fondo">
      <View className="flex-row items-center px-3 py-2 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft size={20} color={colors.primary} />
        </Pressable>
        <Text className="text-base font-semibold text-texto-principal ml-1">Historial</Text>
      </View>

      <View className="flex-row gap-2 px-3 py-2 bg-white border-b border-gray-200">
        {(["INICIADA", "COMPLETADA"] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => setEstado((cur) => (cur === value ? null : value))}
            className={`px-3 py-1.5 rounded-full border ${
              estado === value ? "bg-primary border-primary" : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                estado === value ? "text-white" : "text-texto-principal"
              }`}
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </View>

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin sesiones"
          description="Tus tomas aparecerán aquí."
          icon={<ListChecks size={32} color={colors.textoSecundario} />}
        />
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.id}`}
          estimatedItemSize={100}
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
    </SafeAreaView>
  );
}
