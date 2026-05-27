import { useCallback, useEffect, useMemo, useState } from "react";

import * as catalogRepo from "@/db/repos/catalog";
import * as pricesRepo from "@/db/repos/prices";

import type { CatalogEntry } from "@/db/repos/catalog";
import type { LocalPrice } from "@/db/repos/prices";

export interface CatalogProduct {
  productoId: number;
  productoNombre: string;
  productoCategoria: string;
  productoOrden: number;
  presentaciones: Array<CatalogEntry & { currentPrice: LocalPrice | null }>;
}

interface UseCatalogResult {
  loading: boolean;
  products: CatalogProduct[];
  capturedCount: number;
  totalCount: number;
  reload: () => Promise<void>;
}

function groupProducts(
  entries: CatalogEntry[],
  prices: LocalPrice[],
): CatalogProduct[] {
  const priceByKey = new Map<string, LocalPrice>();
  for (const p of prices) {
    priceByKey.set(`${p.productoId}-${p.presentacionId}`, p);
  }
  const byProduct = new Map<number, CatalogProduct>();
  for (const e of entries) {
    if (!byProduct.has(e.productoId)) {
      byProduct.set(e.productoId, {
        productoId: e.productoId,
        productoNombre: e.productoNombre,
        productoCategoria: e.productoCategoria,
        productoOrden: e.productoOrden,
        presentaciones: [],
      });
    }
    byProduct.get(e.productoId)!.presentaciones.push({
      ...e,
      currentPrice: priceByKey.get(`${e.productoId}-${e.presentacionId}`) ?? null,
    });
  }
  // Sort dentro de cada producto
  for (const p of byProduct.values()) {
    p.presentaciones.sort((a, b) => a.presentacionOrden - b.presentacionOrden);
  }
  return Array.from(byProduct.values()).sort((a, b) => {
    if (a.productoCategoria !== b.productoCategoria) {
      return a.productoCategoria.localeCompare(b.productoCategoria);
    }
    if (a.productoOrden !== b.productoOrden) return a.productoOrden - b.productoOrden;
    return a.productoNombre.localeCompare(b.productoNombre);
  });
}

export function useCatalog(sessionId: number, refreshKey: unknown = 0): UseCatalogResult {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [prices, setPrices] = useState<LocalPrice[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([
        catalogRepo.getBySession(sessionId),
        pricesRepo.listBySession(sessionId),
      ]);
      setEntries(e);
      setPrices(p);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const products = useMemo(() => groupProducts(entries, prices), [entries, prices]);
  const totalCount = useMemo(
    () => new Set(entries.map((e) => e.productoId)).size,
    [entries],
  );
  const capturedCount = useMemo(
    () => new Set(prices.map((p) => p.productoId)).size,
    [prices],
  );

  return { loading, products, capturedCount, totalCount, reload: load };
}
