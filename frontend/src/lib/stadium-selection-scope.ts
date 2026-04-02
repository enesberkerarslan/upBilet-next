import {
  listingStockModeEnabled,
  normalizeStadiumBlockKey,
  stadiumBlockHasStock,
  type StadiumListingAvailability,
  type StadiumZoneShape,
} from "@/lib/stadium-listing-availability";
import { normalizeStadiumZoneKey } from "@/lib/stadium-themes";

/** Haritada seçilen tribün / blok (SVG `id` + `zone:`) */
export type StadiumMapSelection = { blockId: string; zone: string };

export function selectionHasDirectBlockStock(av: StadiumListingAvailability | undefined, blockId: string): boolean {
  if (!av?.byBlock) return false;
  return av.byBlock[normalizeStadiumBlockKey(blockId)] === true;
}

/** Seçilen tribünde bu SVG parçası için global ilan var mı (blok veya bloksuz kategori) */
export function zoneShapeHasInboundStock(
  z: StadiumZoneShape,
  av: StadiumListingAvailability | undefined
): boolean {
  if (!av) return false;
  const zoneKey = normalizeStadiumZoneKey(z.zone);
  const id = normalizeStadiumBlockKey(z.blockId);
  const sub = normalizeStadiumBlockKey(z.subzone);
  if (av.byCategory[zoneKey]) return true;
  if (av.byBlock?.[id] || av.byBlock?.[sub]) return true;
  return false;
}

/**
 * Harita stok rengi / tıklanabilirlik:
 * - Doğrudan blok seçimi (o blokta ilan varken): renkler global kalır; sadece `shapeIsSelectionHighlight` seçili bloku koyulaştırır.
 * - Tribün fallback: seçili zone’da tribün stoku; diğer tribünlerde global renk.
 */
export function blockHasStockWithSelection(
  z: StadiumZoneShape,
  av: StadiumListingAvailability | undefined,
  selection: StadiumMapSelection | null
): boolean {
  if (!selection || !listingStockModeEnabled(av)) {
    return stadiumBlockHasStock(z, av);
  }

  const selZoneKey = normalizeStadiumZoneKey(selection.zone);
  const direct = selectionHasDirectBlockStock(av, selection.blockId);

  if (direct) {
    return stadiumBlockHasStock(z, av);
  }

  const zZoneKey = normalizeStadiumZoneKey(z.zone);
  if (zZoneKey !== selZoneKey) {
    return stadiumBlockHasStock(z, av);
  }
  return zoneShapeHasInboundStock(z, av);
}

export type ListingRowForScope = {
  block?: string | null;
  category?: string | null;
  quantity?: number | null;
};

export function filterListingsByStadiumSelection(
  listings: ListingRowForScope[],
  selection: StadiumMapSelection | null,
  av: StadiumListingAvailability | undefined
): ListingRowForScope[] {
  if (!selection || !listingStockModeEnabled(av)) return listings;

  const selBlock = normalizeStadiumBlockKey(selection.blockId);
  const selZoneKey = normalizeStadiumZoneKey(selection.zone);
  const direct = selectionHasDirectBlockStock(av, selection.blockId);

  return listings.filter((l) => {
    const q = l.quantity ?? 0;
    if (q < 1) return false;
    if (direct) {
      const blockMatch = normalizeStadiumBlockKey(l.block ?? "") === selBlock;
      const cat = normalizeStadiumZoneKey((l.category ?? "").trim());
      return blockMatch || cat === selZoneKey;
    }
    const cat = normalizeStadiumZoneKey((l.category ?? "").trim());
    return cat === selZoneKey;
  });
}

export function filterTicketsByStadiumSelection<T extends { block?: string; category: string; quantity: number }>(
  tickets: T[],
  selection: StadiumMapSelection | null,
  av: StadiumListingAvailability | undefined
): T[] {
  if (!selection || !listingStockModeEnabled(av)) return tickets;

  const selBlock = normalizeStadiumBlockKey(selection.blockId);
  const selZoneKey = normalizeStadiumZoneKey(selection.zone);
  const direct = selectionHasDirectBlockStock(av, selection.blockId);

  return tickets.filter((t) => {
    if (t.quantity < 1) return false;
    if (direct) {
      const blockMatch = normalizeStadiumBlockKey(t.block ?? "") === selBlock;
      return blockMatch || normalizeStadiumZoneKey(t.category) === selZoneKey;
    }
    return normalizeStadiumZoneKey(t.category) === selZoneKey;
  });
}
