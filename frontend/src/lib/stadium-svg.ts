/**
 * Basenames of files in /public/stadiums/*.svg — keep in sync when adding stadium plans.
 */
export const STADIUM_SVG_SLUGS = new Set([
  "ali-samiyen",
  "ataturk-olimpiyat-stadyumu",
  "basaksehir-fatih-terim-stadyumu",
  "caykur-didi-stadyumu",
  "coredon-airlines-park-antalya-stadyumu",
  "eryaman-stadyumu",
  "festival-park-yenikapi",
  "gain-park-stadyumu",
  "gaziantep-buyuksehir-stadyumu",
  "gursel-aksel-stadyumu",
  "harbiye-cemil-topuzlu",
  "medas-konya-buyuksehir-stadyumu",
  "papara-park-stadyumu",
  "recep-tayyip-erdogan-stadyumu",
  "rhg-enerturk-enerji-stadyumu",
  "samsun-19-mayis-stadyumu",
  "senol-gunes-spor-kompleksi",
  "sukru-saracoglu",
  "besiktas-tupras-stadyumu",
  "yildiz-entegre-kocaeli-stadyumu",
  "ulker-spor-ve-etkinlik-salonu",
]);

const turkishToLatin: Record<string, string> = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  I: "I",
  İ: "I",
  i: "i",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
};

/** Same rules as backend tag.model.js slug pre-save */
export function slugifyTagName(name: string): string {
  let slug = name.trim();
  for (const [tr, lat] of Object.entries(turkishToLatin)) {
    slug = slug.split(tr).join(lat);
  }
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** When paneldeki mekan adı ürettiği slug dosya adından farklıysa eşle */
const SLUG_TO_FILE: Record<string, string> = {
  "ali-sami-yen": "ali-samiyen",
  "ali-sami-yen-stadyumu": "ali-samiyen",
  "ali-samiyen-stadyumu": "ali-samiyen",
  /** Chobani / Fenerbahçe tam resmi adres → sukru-saracoglu.svg */
  "chobani-stadyumu-fenerbahce-sukru-saracoglu-spor-kompleksi": "sukru-saracoglu",
  "chobani-stadyumu-fenerbahce-sukru-saracoglu": "sukru-saracoglu",
  "fenerbahce-sukru-saracoglu-spor-kompleksi": "sukru-saracoglu",
  "fenerbahce-sukru-saracoglu": "sukru-saracoglu",
  /** Resmi yazım Corendon; SVG dosya adı coredon (tek n) */
  "corendon-airlines-park-antalya-stadyumu": "coredon-airlines-park-antalya-stadyumu",
  "corendon-airlines-park-antalya": "coredon-airlines-park-antalya-stadyumu",
};

const NAME_SUFFIX = /\s+(stadyumu|stadyum|spor kompleksi|a\.ş\.|as)\s*$/i;

function resolveSlugCandidate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (STADIUM_SVG_SLUGS.has(s)) return s;
  const mapped = SLUG_TO_FILE[s];
  if (mapped && STADIUM_SVG_SLUGS.has(mapped)) return mapped;
  return null;
}

function slugCandidatesFromName(name: string): string[] {
  const base = name.trim();
  if (!base) return [];
  const stripped = base.replace(NAME_SUFFIX, "").trim();
  const set = new Set<string>();
  set.add(slugifyTagName(base));
  if (stripped !== base) set.add(slugifyTagName(stripped));
  return [...set];
}

export type StadiumPlanLookup = {
  /** EtkinlikAlanı etiketinin adı */
  venueName?: string | null;
  /** Tag.slug — public API'de dolduğunda dosya adıyla birebir eşleşebilir */
  venueSlug?: string | null;
};

/**
 * Eşleşen SVG public path'i veya null (plan yok).
 */
export function resolveStadiumPlanPath(lookup: StadiumPlanLookup): string | null {
  const slugDirect = (lookup.venueSlug ?? "").trim().toLowerCase();
  if (slugDirect) {
    const fromSlug = resolveSlugCandidate(slugDirect);
    if (fromSlug) return `/stadiums/${fromSlug}.svg`;
  }

  const name = lookup.venueName?.trim();
  if (name) {
    for (const cand of slugCandidatesFromName(name)) {
      const hit = resolveSlugCandidate(cand);
      if (hit) return `/stadiums/${hit}.svg`;
    }
  }

  return null;
}

/** `/stadiums/ali-samiyen.svg` → `ali-samiyen` */
export function stadiumSlugFromPlanPath(path: string): string | null {
  const m = path.match(/\/stadiums\/([^/]+)\.svg$/i);
  return m ? m[1].toLowerCase() : null;
}
