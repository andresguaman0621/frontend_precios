/**
 * Backward-compat: `KpiTile` ahora delega en `Tile` (bento, con PressableScale).
 * El prop `subValue` se mapea a `hint`.
 */
import { Tile, type TileTone } from "./ui/Tile";

interface Props {
  label: string;
  value: string | number;
  subValue?: string;
  tone?: "default" | "warning" | "success" | "danger" | "primary";
  onPress?: () => void;
}

export function KpiTile({ label, value, subValue, tone = "default", onPress }: Props) {
  return (
    <Tile label={label} value={value} hint={subValue} tone={tone as TileTone} onPress={onPress} />
  );
}
