import { useEffect, useState } from "react";

import * as pricesRepo from "@/db/repos/prices";

export function usePendingCount(refreshKey?: unknown): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await pricesRepo.countPendingTotal();
        if (!cancelled) setCount(c);
      } catch {
        // BD aún no inicializada, ignorar
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return count;
}
