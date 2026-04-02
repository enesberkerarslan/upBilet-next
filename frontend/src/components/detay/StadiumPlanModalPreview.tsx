"use client";

import { applyModalHighlightPaint, stripNonInteractiveSvgLabels } from "@/lib/stadium-plan-dom";
import { stadiumSlugFromPlanPath } from "@/lib/stadium-svg";
import { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";

type Props = {
  src: string;
  /** `id` veya `subzone` ile eşleşir; yoksa `category` ile tribün boyanır */
  highlightBlock?: string | null;
  highlightCategory: string;
  className?: string;
};

type LoadState = "loading" | "ready" | "error";

/**
 * Bazı SVG’lerde viewBox üstünde geniş boş şerit var (ör. y=197). Üstten kırpınca harita yukarı kayar,
 * sağdaki “Bilet fiyatı” ile hizalanır.
 */
function trimModalViewBoxTop(svg: SVGElement): void {
  const raw = svg.getAttribute("viewBox");
  if (!raw) return;
  const parts = raw.trim().split(/[\s,]+/).map(parseFloat);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return;
  const [x, y, w, h] = parts;
  if (w <= 0 || h <= 0) return;
  if (y < 150) return;
  const ratio = 0.14;
  const dy = Math.min(h * ratio, h * 0.32);
  if (dy < 2) return;
  svg.setAttribute("viewBox", `${x} ${y + dy} ${w} ${h - dy}`);
}

/**
 * Bilet modalında: stadyum SVG’sinin küçük kopyası, seçili blok / kategori vurgulu (salt okunur).
 */
export function StadiumPlanModalPreview({ src, highlightBlock, highlightCategory, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const stadiumSlug = useMemo(() => stadiumSlugFromPlanPath(src), [src]);

  useEffect(() => {
    const ac = new AbortController();
    setLoadState("loading");
    setSvgMarkup(null);

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
        if (!ac.signal.aborted) {
          setSvgMarkup(text);
          setLoadState("ready");
        }
      } catch {
        if (!ac.signal.aborted) {
          setSvgMarkup(null);
          setLoadState("error");
        }
      }
    })();

    return () => ac.abort();
  }, [src]);

  useLayoutEffect(() => {
    const root = wrapRef.current;
    if (!root || !svgMarkup || loadState !== "ready") return;
    root.innerHTML = svgMarkup;
    const svg = root.querySelector("svg");
    if (svg) {
      trimModalViewBoxTop(svg);
      svg.setAttribute("width", "100%");
      svg.removeAttribute("height");
      svg.setAttribute("preserveAspectRatio", "xMidYMin meet");
      svg.setAttribute("overflow", "hidden");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.maxWidth = "100%";
      svg.style.maxHeight = "min(52vh, 460px)";
      svg.style.boxSizing = "border-box";
      svg.style.display = "block";
      svg.style.shapeRendering = "geometricPrecision";
      svg.style.textRendering = "geometricPrecision";
    }
    applyModalHighlightPaint(root, {
      stadiumSlug,
      highlightBlock: highlightBlock ?? undefined,
      highlightCategory,
    });
  }, [svgMarkup, stadiumSlug, highlightBlock, highlightCategory, loadState]);

  if (loadState === "error") return null;

  if (loadState === "loading") {
    return (
      <div
        className={`min-h-[140px] w-full min-w-0 max-w-full max-h-[min(52vh,460px)] animate-pulse bg-gray-100 ${className ?? ""}`}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={`stadium-plan-svg leading-none w-full min-w-0 max-w-full max-h-[min(52vh,460px)] overflow-hidden [&_svg]:leading-none ${className ?? ""}`}
      aria-hidden
      ref={wrapRef}
    />
  );
}
