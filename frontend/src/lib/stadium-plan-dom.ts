import { normalizeStadiumBlockKey } from "@/lib/stadium-listing-availability";
import { normalizeStadiumZoneKey, resolveStadiumCategoryPalette } from "@/lib/stadium-themes";

export type StadiumMapZone = {
  blockId: string;
  dataId: string | null;
  zone: string;
  zoneId: string;
  subzone: string;
  subzoneId: string;
  noTicketColor: string;
  ticketColor: string;
  selectedColor: string;
  raw: Record<string, string>;
};

export function parseStadiumDataSelect(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const segment of raw.split(";")) {
    const idx = segment.indexOf(":");
    if (idx <= 0) continue;
    const key = segment.slice(0, idx).trim();
    const val = segment.slice(idx + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

export function zoneFromSvgGroup(g: Element): StadiumMapZone | null {
  const ds = g.getAttribute("data-select");
  if (!ds) return null;
  const raw = parseStadiumDataSelect(ds);
  return {
    blockId: g.getAttribute("id") ?? "",
    dataId: g.getAttribute("data-id"),
    zone: raw.zone ?? "",
    zoneId: raw.zoneid ?? "",
    subzone: raw.subzone ?? "",
    subzoneId: raw.subzoneid ?? "",
    noTicketColor: raw.noTicket ?? "#cccccc",
    ticketColor: raw.ticket ?? "#7ac2ee",
    selectedColor: raw.selected ?? "#4ea4d9",
    raw,
  };
}

export function stripNonInteractiveSvgLabels(svgMarkup: string): string {
  try {
    const doc = new DOMParser().parseFromString(svgMarkup, "image/svg+xml");
    if (doc.querySelector("parsererror")) return svgMarkup;
    const svg = doc.querySelector("svg");
    if (!svg) return svgMarkup;
    svg.querySelectorAll("text").forEach((t) => {
      if (!t.closest("g[data-select]")) t.remove();
    });
    return new XMLSerializer().serializeToString(svg);
  } catch {
    return svgMarkup;
  }
}

/**
 * Ödeme modalı vb.: tek blok veya (bloksuz) kategori vurgusu; diğer tribünler soldOut paletiyle soluk.
 */
export function applyModalHighlightPaint(
  container: HTMLElement,
  opts: {
    stadiumSlug: string | null;
    highlightBlock?: string | null;
    highlightCategory?: string | null;
  }
): void {
  const blockRaw = (opts.highlightBlock ?? "").trim();
  const catRaw = (opts.highlightCategory ?? "").trim();
  const blockKey = blockRaw ? normalizeStadiumBlockKey(blockRaw) : "";
  const catKey = catRaw ? normalizeStadiumZoneKey(catRaw) : "";

  container.querySelectorAll<SVGElement>("g[data-select]").forEach((group) => {
    const z = zoneFromSvgGroup(group);
    const path = group.querySelector<SVGElement>(".svgshp");
    if (!z || !path) return;

    const pal = resolveStadiumCategoryPalette(opts.stadiumSlug, z.zone, {
      ticket: z.ticketColor,
      noTicket: z.noTicketColor,
      selected: z.selectedColor,
    });

    let highlighted = false;
    if (blockKey) {
      highlighted =
        normalizeStadiumBlockKey(z.blockId) === blockKey ||
        normalizeStadiumBlockKey(z.subzone) === blockKey;
    } else if (catKey) {
      highlighted = normalizeStadiumZoneKey(z.zone) === catKey;
    }

    const fill = highlighted ? pal.inStock : pal.soldOut;
    path.setAttribute("style", `fill: ${fill}`);
    const gEl = group as unknown as HTMLElement;
    gEl.style.pointerEvents = "none";
    group.removeAttribute("tabIndex");
    group.removeAttribute("role");
  });
}
