/**
 * Stadyum SVG `data-select` içindeki `zone:` metni ile eşleşen kategori renkleri.
 * Dosya slug’ı (`ali-samiyen` vb.) + `normalizeStadiumZoneKey(zone)` anahtarı kullanılır.
 */

export type StadiumCategoryPalette = {
  /** Bu kategoride ilan varken (daha koyu) */
  inStock: string;
  /** İlan yok — tükenmiş; hover’da “Tükenmiştir” */
  soldOut: string;
  /** Seçili blok */
  selected: string;
};

export function normalizeStadiumZoneKey(zone: string): string {
  return zone.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveStadiumCategoryPalette(
  stadiumSlug: string | null,
  zoneFromSvg: string,
  svgFallback: { ticket: string; noTicket: string; selected: string }
): { inStock: string; soldOut: string; selected: string } {
  if (!stadiumSlug) {
    return {
      inStock: svgFallback.ticket,
      soldOut: svgFallback.noTicket,
      selected: svgFallback.selected,
    };
  }

  const table = STADIUM_CATEGORY_THEMES[stadiumSlug];
  if (!table) {
    return {
      inStock: svgFallback.ticket,
      soldOut: svgFallback.noTicket,
      selected: svgFallback.selected,
    };
  }

  const nk = normalizeStadiumZoneKey(zoneFromSvg);
  const row = table[nk];

  if (!row) {
    return {
      inStock: svgFallback.ticket,
      soldOut: svgFallback.noTicket,
      selected: svgFallback.selected,
    };
  }

  return {
    inStock: row.inStock,
    soldOut: row.soldOut,
    selected: row.selected,
  };
}

/**
 * Örnek tema — yeni stadyum: `STADIUM_CATEGORY_THEMES["dosya-slug"] = { "kategori adı": { ... } }`
 * Kategori adı SVG’deki `zone:` ile aynı (küçük harf / boşluk normalize edilir).
 */
export const STADIUM_CATEGORY_THEMES: Record<string, Record<string, StadiumCategoryPalette>> = {
  "ali-samiyen": {
    vip: {
      inStock: "#2d8bb8",
      soldOut: "#d4e8f2",
      selected: "#1a5f80",
    },
    loca: {
      inStock: "#6b4fa3",
      soldOut: "#e8e0f4",
      selected: "#4a3570",
    },
    "alt kat": {
      inStock: "#2f9d5c",
      soldOut: "#d6f0e0",
      selected: "#1f6b3f",
    },
    "alt kat kenar": {
      inStock: "#c9782e",
      soldOut: "#f5e8d8",
      selected: "#8a5220",
    },
    "kale arkası alt kat": {
      inStock: "#b83c7a",
      soldOut: "#f5d9e8",
      selected: "#7d2954",
    },
    "üst kat": {
      inStock: "#c4a000",
      soldOut: "#f5f0c8",
      selected: "#8a7200",
    },
    "kale arkası üst kat": {
      inStock: "#a05030",
      soldOut: "#f0ddd4",
      selected: "#6b351f",
    },
  },
  /** Şükrü Saracoğlu — SVG `zone:` etiketleri; renkler Ali Sami Yen ile aynı mantık (tribün tipi başına palet) */
  "sukru-saracoglu": {
    /** Maraton 1907 — premium / tribün (GS vip mavisi) */
    "1907": {
      inStock: "#2d8bb8",
      soldOut: "#d4e8f2",
      selected: "#1a5f80",
    },
    "alt kat": {
      inStock: "#2f9d5c",
      soldOut: "#d6f0e0",
      selected: "#1f6b3f",
    },
    kenar: {
      inStock: "#c9782e",
      soldOut: "#f5e8d8",
      selected: "#8a5220",
    },
    "üst kat": {
      inStock: "#c4a000",
      soldOut: "#f5f0c8",
      selected: "#8a7200",
    },
    "üst kenar": {
      inStock: "#6b4fa3",
      soldOut: "#e8e0f4",
      selected: "#4a3570",
    },
    "kale arkası spor toto": {
      inStock: "#b83c7a",
      soldOut: "#f5d9e8",
      selected: "#7d2954",
    },
    "kale arkası kuzey": {
      inStock: "#a05030",
      soldOut: "#f0ddd4",
      selected: "#6b351f",
    },
    misafir: {
      inStock: "#5c6b7a",
      soldOut: "#e2e6ea",
      selected: "#3d4854",
    },
  },
  /** Beşiktaş Tüpraş Stadyumu — SVG `zone:` GS ile aynı isimler + 1903 Tribünü */
  "besiktas-tupras-stadyumu": {
    "1903 tribünü": {
      inStock: "#6b4fa3",
      soldOut: "#e8e0f4",
      selected: "#4a3570",
    },
    vip: {
      inStock: "#2d8bb8",
      soldOut: "#d4e8f2",
      selected: "#1a5f80",
    },
    "alt kat": {
      inStock: "#2f9d5c",
      soldOut: "#d6f0e0",
      selected: "#1f6b3f",
    },
    kenar: {
      inStock: "#c9782e",
      soldOut: "#f5e8d8",
      selected: "#8a5220",
    },
    "üst kat": {
      inStock: "#c4a000",
      soldOut: "#f5f0c8",
      selected: "#8a7200",
    },
    "kale arkası alt kat": {
      inStock: "#b83c7a",
      soldOut: "#f5d9e8",
      selected: "#7d2954",
    },
    "kale arkası üst kat": {
      inStock: "#a05030",
      soldOut: "#f0ddd4",
      selected: "#6b351f",
    },
    misafir: {
      inStock: "#5c6b7a",
      soldOut: "#e2e6ea",
      selected: "#3d4854",
    },
  },
};
