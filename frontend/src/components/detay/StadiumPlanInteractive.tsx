"use client";

/**
 * Stadyum planı: SVG yükleme, kategori renkleri (`stadium-themes`), blok stoku (`blockAvailability`),
 * seçim ve tükenmiş blokta hover ipucu.
 */
import type { Locale } from "@/i18n";
import { getMessages, translate } from "@/i18n";
import {
  listingStockModeEnabled,
  normalizeStadiumBlockKey,
  stadiumBlockHasStock,
  type BlockListingSummary,
  type StadiumListingAvailability,
  type StadiumListingSummaries,
} from "@/lib/stadium-listing-availability";
import {
  blockHasStockWithSelection,
  selectionHasDirectBlockStock,
  type StadiumMapSelection,
} from "@/lib/stadium-selection-scope";
import { normalizeStadiumZoneKey, resolveStadiumCategoryPalette } from "@/lib/stadium-themes";
import { useStadiumSelection } from "@/components/detay/StadiumSelectionContext";
import { stadiumSlugFromPlanPath } from "@/lib/stadium-svg";
import { stripNonInteractiveSvgLabels, zoneFromSvgGroup, type StadiumMapZone } from "@/lib/stadium-plan-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type { StadiumMapZone };

function listingSummaryForZone(
  z: StadiumMapZone,
  summaries: StadiumListingSummaries | undefined
): BlockListingSummary | undefined {
  if (!summaries) return undefined;
  const id = normalizeStadiumBlockKey(z.blockId);
  const sub = normalizeStadiumBlockKey(z.subzone);
  const zoneKey = normalizeStadiumZoneKey(z.zone);
  return summaries.byBlock[id] ?? summaries.byBlock[sub] ?? summaries.byCategory[zoneKey];
}

function formatTryPrice(locale: Locale, amount: number): string {
  const loc = locale === "en" ? "en-US" : "tr-TR";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Seçili koyu renk: blok ilanı varsa yalnızca o blok; yoksa tıklanan bloğun tribünü (aynı zone) */
function shapeIsSelectionHighlight(
  z: StadiumMapZone,
  selectedBlockId: string | null,
  mapSelection: StadiumMapSelection | null,
  av: StadiumListingAvailability | undefined
): boolean {
  if (!selectedBlockId) return false;
  if (!mapSelection) {
    const sel = normalizeStadiumBlockKey(selectedBlockId);
    return normalizeStadiumBlockKey(z.blockId) === sel || normalizeStadiumBlockKey(z.subzone) === sel;
  }
  if (!listingStockModeEnabled(av)) {
    const sel = normalizeStadiumBlockKey(selectedBlockId);
    return normalizeStadiumBlockKey(z.blockId) === sel || normalizeStadiumBlockKey(z.subzone) === sel;
  }
  if (selectionHasDirectBlockStock(av, mapSelection.blockId)) {
    const sel = normalizeStadiumBlockKey(selectedBlockId);
    return normalizeStadiumBlockKey(z.blockId) === sel || normalizeStadiumBlockKey(z.subzone) === sel;
  }
  return normalizeStadiumZoneKey(z.zone) === normalizeStadiumZoneKey(mapSelection.zone);
}

function applyZonePaint(
  container: HTMLElement,
  selectedBlockId: string | null,
  stadiumSlug: string | null,
  listingAvailability: StadiumListingAvailability | undefined,
  mapSelection: StadiumMapSelection | null
) {
  container.querySelectorAll<SVGElement>("g[data-select]").forEach((group) => {
    const z = zoneFromSvgGroup(group);
    const path = group.querySelector<SVGElement>(".svgshp");
    if (!z || !path) return;

    const pal = resolveStadiumCategoryPalette(stadiumSlug, z.zone, {
      ticket: z.ticketColor,
      noTicket: z.noTicketColor,
      selected: z.selectedColor,
    });

    const hasStock = blockHasStockWithSelection(z, listingAvailability, mapSelection);
    const selected = shapeIsSelectionHighlight(z, selectedBlockId, mapSelection, listingAvailability);

    const gEl = group as unknown as HTMLElement;
    if (listingStockModeEnabled(listingAvailability)) {
      group.setAttribute("data-sold-out", hasStock ? "0" : "1");
      gEl.style.cursor = hasStock ? "pointer" : "not-allowed";
    } else {
      group.removeAttribute("data-sold-out");
      gEl.style.cursor = "";
    }

    const fill = selected ? pal.selected : hasStock ? pal.inStock : pal.soldOut;
    path.setAttribute("style", `fill: ${fill}`);
  });
}

function applySvgAccessibility(root: HTMLElement) {
  root.querySelectorAll<SVGGElement>("g[data-select]").forEach((g) => {
    g.setAttribute("role", "button");
    const z = zoneFromSvgGroup(g);
    const label = z?.subzone || z?.blockId || "blok";
    g.setAttribute("tabIndex", "0");
    g.setAttribute("aria-label", label);
  });
}

export type StadiumPlanInteractiveProps = {
  src: string;
  alt: string;
  locale: Locale;
  /** Blok + bloksuz (kategori) stok; yoksa tüm bloklar “stok var” gibi boyanır */
  listingAvailability?: StadiumListingAvailability;
  /** Blok ve kategori özetleri (hover) */
  listingSummaries?: StadiumListingSummaries;
  onZoneClick?: (zone: StadiumMapZone) => void;
};

/** x,y: sectionRef içinde göreli (viewport fixed değil — scroll ile birlikte hareket) */
type HoverTip =
  | null
  | { kind: "soldout"; x: number; y: number }
  | { kind: "stock"; x: number; y: number; totalQty: number; minPrice: number };

export function StadiumPlanInteractive({
  src,
  alt,
  locale,
  listingAvailability,
  listingSummaries = { byBlock: {}, byCategory: {} },
  onZoneClick,
}: StadiumPlanInteractiveProps) {
  const stadiumCtx = useStadiumSelection();
  const mapSelection = stadiumCtx?.selection ?? null;

  const wrapRef = useRef<HTMLDivElement>(null);
  /** İpucu absolute; sayfa scroll’unda harita ile birlikte kayar */
  const sectionRef = useRef<HTMLDivElement>(null);
  const availabilityRef = useRef(listingAvailability);
  availabilityRef.current = listingAvailability;
  /** Hover’da her tribün: seçim filtresi değil tüm ilan özetleri */
  const hoverSummariesRef = useRef(listingSummaries);
  hoverSummariesRef.current = listingSummaries;
  const mapSelectionRef = useRef(mapSelection);
  mapSelectionRef.current = mapSelection;
  const setMapSelectionRef = useRef(stadiumCtx?.setSelection);
  setMapSelectionRef.current = stadiumCtx?.setSelection;

  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const selectedBlockIdRef = useRef<string | null>(null);
  selectedBlockIdRef.current = selectedBlockId;
  const [hoverTip, setHoverTip] = useState<HoverTip>(null);
  /** Dokunmatik / hover yok: ipucu fareyle değil dokunuşla */
  const [noHoverUi, setNoHoverUi] = useState(false);

  const onZoneClickRef = useRef(onZoneClick);
  onZoneClickRef.current = onZoneClick;

  const messages = getMessages(locale);
  const errLabel = translate(messages, "eventDetail.stadiumPlanLoadError");
  const selectedPrefix = translate(messages, "eventDetail.stadiumPlanSelectedPrefix");
  const soldOutLabel = translate(messages, "eventDetail.stadiumPlanSoldOut");
  const hoverCountTpl = translate(messages, "eventDetail.stadiumPlanHoverCount");
  const hoverPriceFromTpl = translate(messages, "eventDetail.stadiumPlanHoverPriceFrom");

  const stadiumSlug = useMemo(() => stadiumSlugFromPlanPath(src), [src]);

  function clientToSectionRel(clientX: number, clientY: number): { x: number; y: number } | null {
    const sec = sectionRef.current;
    if (!sec) return null;
    const r = sec.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  useEffect(() => {
    if (!stadiumCtx) return;
    if (stadiumCtx.selection === null) setSelectedBlockId(null);
  }, [stadiumCtx, stadiumCtx?.selection]);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const sync = () => setNoHoverUi(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** Web: Escape — blok seçimini ve bilet filtresini kaldır (odak input’ta değilken) */
  useEffect(() => {
    if (!svgMarkup) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return;
      if (t instanceof HTMLElement && t.isContentEditable) return;
      if (!mapSelectionRef.current && selectedBlockIdRef.current == null) return;
      e.preventDefault();
      setSelectedBlockId(null);
      setMapSelectionRef.current?.(null);
      setHoverTip(null);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [svgMarkup]);

  useEffect(() => {
    const ac = new AbortController();
    setLoadError(false);
    setSvgMarkup(null);
    setSelectedBlockId(null);
    setHoverTip(null);
    setMapSelectionRef.current?.(null);

    (async () => {
      try {
        const r = await fetch(src, { signal: ac.signal });
        if (!r.ok) throw new Error("svg fetch failed");
        let text = await r.text();
        text = text.replace(
          /<defs>\s*<style[^>]*>@import url\([^)]+\)[^<]*<\/style>\s*<\/defs>\s*/i,
          ""
        );
        text = text.replace(/<svg\b([^>]*?)\s*style="([^"]*)"/i, (_, before, style: string) => {
          const s = style.replace(/height:\s*100%/gi, "height:auto");
          return `<svg${before} style="${s}"`;
        });
        text = stripNonInteractiveSvgLabels(text);
        setSvgMarkup(text);
      } catch {
        if (!ac.signal.aborted) {
          setLoadError(true);
          setSvgMarkup(null);
        }
      }
    })();

    return () => ac.abort();
  }, [src]);

  /**
   * dangerouslySetInnerHTML her re-render’da SVG’yi sıfırlar; hoverTip vb. state değişince
   * fill’ler silinir. innerHTML yalnızca svgMarkup değişince set edilir.
   */
  useLayoutEffect(() => {
    const root = wrapRef.current;
    if (!root || !svgMarkup) return;
    root.innerHTML = svgMarkup;
    applyZonePaint(root, selectedBlockId, stadiumSlug, listingAvailability, mapSelection);
    applySvgAccessibility(root);

    if (process.env.NODE_ENV === "development") {
      const shapes: { blockId: string; zone: string }[] = [];
      root.querySelectorAll<SVGElement>("g[data-select]").forEach((g) => {
        const z = zoneFromSvgGroup(g);
        if (z) shapes.push({ blockId: z.blockId, zone: z.zone });
      });
      const byZone = new Map<string, Set<string>>();
      for (const s of shapes) {
        const cat = s.zone.trim() || "(zone yok)";
        if (!byZone.has(cat)) byZone.set(cat, new Set());
        if (s.blockId.trim()) byZone.get(cat)!.add(s.blockId);
      }
      const kategoriBloklar: Record<string, string[]> = {};
      for (const cat of [...byZone.keys()].sort((a, b) => a.localeCompare(b, "tr"))) {
        kategoriBloklar[cat] = [...byZone.get(cat)!].sort((a, b) => a.localeCompare(b, "tr", { numeric: true }));
      }
      console.log("[StadiumPlan] kategori → bloklar", kategoriBloklar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sadece yeni SVG metni; seçim/stok aşağıdaki efektte
  }, [svgMarkup]);

  /** Seçim / stok / tema değişince DOM’u yeniden parse etmeden renkleri güncelle */
  useLayoutEffect(() => {
    const root = wrapRef.current;
    if (!root?.querySelector("svg")) return;
    applyZonePaint(root, selectedBlockId, stadiumSlug, listingAvailability, mapSelection);
  }, [selectedBlockId, stadiumSlug, listingAvailability, mapSelection]);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root || !svgMarkup) return;

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const g = t.closest("[data-select]");
      if (!g || !root.contains(g)) return;
      const z = zoneFromSvgGroup(g);
      if (!z) return;
      if (!stadiumBlockHasStock(z, availabilityRef.current)) return;

      e.preventDefault();
      e.stopPropagation();

      const sameBlock =
        selectedBlockIdRef.current != null &&
        normalizeStadiumBlockKey(selectedBlockIdRef.current) === normalizeStadiumBlockKey(z.blockId);
      if (sameBlock) {
        setSelectedBlockId(null);
        setMapSelectionRef.current?.(null);
        return;
      }

      setSelectedBlockId(z.blockId);
      setMapSelectionRef.current?.({ blockId: z.blockId, zone: z.zone });
      onZoneClickRef.current?.(z);
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [svgMarkup]);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root || !svgMarkup) return;

    const onMove = (e: PointerEvent) => {
      if (noHoverUi) return;
      const t = e.target as Element | null;
      const g = t?.closest?.("g[data-select]");
      if (!g || !root.contains(g)) {
        setHoverTip(null);
        return;
      }
      const z = zoneFromSvgGroup(g);
      if (!z) {
        setHoverTip(null);
        return;
      }
      const av = availabilityRef.current;
      const hasStock = blockHasStockWithSelection(z, av, mapSelectionRef.current);
      const hoverSummaries = hoverSummariesRef.current;
      const row = listingSummaryForZone(z, hoverSummaries);

      if (listingStockModeEnabled(av) && !hasStock) {
        const rel = clientToSectionRel(e.clientX, e.clientY);
        if (rel) setHoverTip({ kind: "soldout", x: rel.x, y: rel.y });
        return;
      }

      if (hasStock && row && row.totalQty > 0) {
        const rel = clientToSectionRel(e.clientX, e.clientY);
        if (rel)
          setHoverTip({
            kind: "stock",
            x: rel.x,
            y: rel.y,
            totalQty: row.totalQty,
            minPrice: row.minPrice,
          });
        return;
      }

      setHoverTip(null);
    };

    /** Dokunmatikte parmak kalkınca pointerleave gelir; ipucu hemen silinmesin */
    const onLeave = () => {
      if (noHoverUi) return;
      setHoverTip(null);
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [svgMarkup, noHoverUi]);

  /** Mobil / dokunmatik: bloka dokununca stok / tükenmiş ipucu (hover yok) */
  useEffect(() => {
    const root = wrapRef.current;
    if (!root || !svgMarkup || !noHoverUi) return;

    const tipAt = (clientX: number, clientY: number, target: EventTarget | null) => {
      const t = target as Element | null;
      const g = t?.closest?.("g[data-select]");
      if (!g || !root.contains(g)) {
        setHoverTip(null);
        return;
      }
      const z = zoneFromSvgGroup(g);
      if (!z) {
        setHoverTip(null);
        return;
      }
      const av = availabilityRef.current;
      const hasStock = blockHasStockWithSelection(z, av, mapSelectionRef.current);
      const hoverSummaries = hoverSummariesRef.current;
      const row = listingSummaryForZone(z, hoverSummaries);

      if (listingStockModeEnabled(av) && !hasStock) {
        const rel = clientToSectionRel(clientX, clientY);
        if (rel) setHoverTip({ kind: "soldout", x: rel.x, y: rel.y });
        return;
      }

      if (hasStock && row && row.totalQty > 0) {
        const rel = clientToSectionRel(clientX, clientY);
        if (rel)
          setHoverTip({
            kind: "stock",
            x: rel.x,
            y: rel.y,
            totalQty: row.totalQty,
            minPrice: row.minPrice,
          });
        return;
      }

      setHoverTip(null);
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      tipAt(e.clientX, e.clientY, e.target);
    };

    root.addEventListener("pointerup", onUp);
    return () => root.removeEventListener("pointerup", onUp);
  }, [svgMarkup, noHoverUi]);

  useEffect(() => {
    if (!noHoverUi || !hoverTip) return;
    const id = window.setTimeout(() => setHoverTip(null), 4000);
    return () => clearTimeout(id);
  }, [hoverTip, noHoverUi]);

  useEffect(() => {
    if (!noHoverUi) return;
    const onDown = (e: PointerEvent) => {
      const root = wrapRef.current;
      if (!root?.contains(e.target as Node)) setHoverTip(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [noHoverUi, svgMarkup]);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root || !svgMarkup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = document.activeElement;
      if (!el || !root.contains(el)) return;
      const g = el.closest("g[data-select]");
      if (!g || !root.contains(g)) return;
      const zone = zoneFromSvgGroup(g);
      if (!zone) return;
      if (!stadiumBlockHasStock(zone, availabilityRef.current)) return;
      e.preventDefault();

      const sameBlock =
        selectedBlockIdRef.current != null &&
        normalizeStadiumBlockKey(selectedBlockIdRef.current) === normalizeStadiumBlockKey(zone.blockId);
      if (sameBlock) {
        setSelectedBlockId(null);
        setMapSelectionRef.current?.(null);
        return;
      }

      setSelectedBlockId(zone.blockId);
      setMapSelectionRef.current?.({ blockId: zone.blockId, zone: zone.zone });
      onZoneClickRef.current?.(zone);
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [svgMarkup]);

  const tipPosition = useMemo(() => {
    if (!hoverTip) return null;
    const sec = sectionRef.current;
    if (typeof window === "undefined" || !sec) {
      return { left: hoverTip.x + 12, top: hoverTip.y + 12 };
    }
    const pad = 8;
    const offset = 12;
    const r = sec.getBoundingClientRect();
    const maxW = Math.min(r.width * 0.92, 300);
    const estH = 72;
    let left = hoverTip.x + offset;
    let top = hoverTip.y + offset;
    left = Math.max(pad, Math.min(left, r.width - maxW - pad));
    top = Math.max(pad, Math.min(top, r.height - estH - pad));
    return { left, top };
  }, [hoverTip]);

  if (loadError) {
    return (
      <p className="rounded-2xl border border-dashed border-red-200 bg-red-50/50 px-4 py-6 text-center text-sm text-red-700">
        {errLabel}
      </p>
    );
  }

  if (!svgMarkup) {
    return (
      <div
        className="flex min-h-[200px] w-full max-w-full items-center justify-center rounded-none border-x-0 bg-white text-sm text-gray-500"
        role="status"
        aria-live="polite"
      >
        …
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="relative w-full min-w-0 space-y-3">
      {selectedBlockId ? (
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {selectedPrefix} {selectedBlockId}
        </span>
      ) : null}
      {hoverTip && tipPosition ? (
        <div
          className="pointer-events-none absolute z-200 max-w-[min(92%,300px)] rounded-xl border border-white/10 bg-gray-900/95 px-3.5 py-2.5 text-white shadow-xl backdrop-blur-sm"
          style={{ left: tipPosition.left, top: tipPosition.top }}
          role="tooltip"
        >
          {hoverTip.kind === "soldout" ? (
            <p className="text-sm font-medium leading-snug">{soldOutLabel}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-[13px] font-semibold leading-snug tracking-tight">
                {hoverCountTpl.replace("{{count}}", String(hoverTip.totalQty))}
              </p>
              <p className="border-t border-white/10 pt-1.5 text-xs font-normal leading-snug text-white/85">
                {hoverPriceFromTpl.replace("{{price}}", formatTryPrice(locale, hoverTip.minPrice))}
              </p>
            </div>
          )}
        </div>
      ) : null}
      <div
        ref={wrapRef}
        className="stadium-plan-svg box-border flex w-full max-w-full min-w-0 justify-center overflow-x-hidden rounded-none border-x-0 bg-white p-px leading-none [&_svg]:m-0 [&_svg]:block [&_svg]:h-auto! [&_svg]:max-h-none! [&_svg]:w-[106%] [&_svg]:max-w-none [&_svg]:shrink-0"
        role="img"
        aria-label={alt}
      />
    </div>
  );
}
