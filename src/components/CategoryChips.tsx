import { Pressable, ScrollView, Text } from "react-native";

interface Props {
  categories: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function CategoryChips({ categories, selected, onSelect }: Props) {
  const items: Array<{ key: string; label: string; value: string | null }> = [
    { key: "__all", label: "Todos", value: null },
    ...categories.map((c) => ({ key: c, label: c, value: c })),
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
      className="py-2 max-h-[44px]"
    >
      {items.map((c) => {
        const active = c.value === selected;
        return (
          <Pressable
            key={c.key}
            onPress={() => onSelect(c.value)}
            className={`px-3 py-1.5 rounded-full border ${
              active
                ? "bg-primary border-primary"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                active ? "text-white" : "text-texto-principal"
              }`}
            >
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
