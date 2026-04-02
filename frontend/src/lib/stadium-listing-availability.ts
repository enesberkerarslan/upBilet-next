import { normalizeStadiumZoneKey } from "@/lib/stadium-themes";

/** SVG `g id` / `subzone` ile ilan `block` alanını eşlemek için */
export function normalizeStadiumBlockKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

export type StadiumListingAvailability = {
  /** En az bir ilanda blok doluysa tanımlı; yoksa yalnızca kategori bazlı stok */
  byBlock: Record<string, boolean> | undefined;
  /** Blok boş, kategori dolu ilanlar — anahtar = `normalizeStadiumZoneKey(category)`; SVG `zone:` ile eşleşir */
  byCategory: Record<string, boolean>;
};

/**
 * İlan dizisi bilinçli olarak boş: stok modu açılır, hiçbir blok “satışta” boyanmaz.
 * `undefined` ise stok verisi yok kabul edilir ve harita tüm tribünleri stoklu gösterir.
 */
export const STADIUM_NO_LISTINGS_AVAILABILITY: StadiumListingAvailability = {
  byBlock: {},
  byCategory: {},
};

/**
 * Blok ve/veya kategori (bloksuz) ilanlardan harita stok bilgisi.
 */
export function stadiumListingAvailabilityFromListings(
  listings: { block?: string | null; category?: string | null; quantity?: number | null }[]
): StadiumListingAvailability {
  /** Hiç ilan yokken stok modu açılsın; aksi halde harita hep “stok var” renkleriyle boyanıyordu. */
  if (listings.length === 0) {
    return { byBlock: {}, byCategory: {} };
  }

  const stock: Record<string, boolean> = {};
  let sawBlock = false;
  const catStock: Record<string, boolean> = {};

  for (const l of listings) {
    const b = (l.block ?? "").trim();
    const cat = (l.category ?? "").trim();
    const q = l.quantity ?? 0;

    if (b) {
      sawBlock = true;
      const k = normalizeStadiumBlockKey(b);
      if (q > 0) stock[k] = true;
      else if (!(k in stock)) stock[k] = false;
    } else if (cat) {
      const ck = normalizeStadiumZoneKey(cat);
      if (q > 0) catStock[ck] = true;
    }
  }

  return {
    byBlock: sawBlock ? stock : undefined,
    byCategory: catStock,
  };
}

export function listingStockModeEnabled(av: StadiumListingAvailability | undefined): boolean {
  if (!av) return false;
  return av.byBlock !== undefined || Object.keys(av.byCategory).length > 0;
}

/** SVG `g` şekli — harita stoku (seçim yokken) */
export type StadiumZoneShape = { zone: string; blockId: string; subzone: string };

export function stadiumBlockHasStock(z: StadiumZoneShape, av: StadiumListingAvailability | undefined): boolean {
  if (!listingStockModeEnabled(av)) return true;
  const zoneKey = normalizeStadiumZoneKey(z.zone);
  const fromCategory = av!.byCategory[zoneKey] === true;

  if (av!.byBlock === undefined) return fromCategory;

  const id = normalizeStadiumBlockKey(z.blockId);
  const sub = normalizeStadiumBlockKey(z.subzone);
  const fromBlock = av!.byBlock[id] === true || av!.byBlock[sub] === true;
  return fromBlock || fromCategory;
}

export type BlockListingSummary = {
  totalQty: number;
  minPrice: number;
};

export type StadiumListingSummaries = {
  byBlock: Record<string, BlockListingSummary>;
  byCategory: Record<string, BlockListingSummary>;
};

function mergeListingSummary(
  map: Record<string, BlockListingSummary>,
  key: string,
  q: number,
  p: number
) {
  const cur = map[key];
  if (!cur) {
    map[key] = { totalQty: q, minPrice: p };
  } else {
    map[key] = {
      totalQty: cur.totalQty + q,
      minPrice: Math.min(cur.minPrice, p),
    };
  }
}

/** Bloklu ve bloksuz (kategori) ilanları ayrı haritalarda toplar */
export function stadiumListingSummariesFromListings(
  listings: {
    block?: string | null;
    category?: string | null;
    quantity?: number | null;
    price?: number | null;
  }[]
): StadiumListingSummaries {
  const byBlock: Record<string, BlockListingSummary> = {};
  const byCategory: Record<string, BlockListingSummary> = {};

  for (const l of listings) {
    const b = (l.block ?? "").trim();
    const cat = (l.category ?? "").trim();
    const q = Math.max(0, Math.floor(Number(l.quantity ?? 0)));
    const p = l.price;
    if (q < 1 || p == null || typeof p !== "number" || !Number.isFinite(p) || p < 0) continue;

    if (b) {
      mergeListingSummary(byBlock, normalizeStadiumBlockKey(b), q, p);
    } else if (cat) {
      mergeListingSummary(byCategory, normalizeStadiumZoneKey(cat), q, p);
    }
  }

  return { byBlock, byCategory };
}
