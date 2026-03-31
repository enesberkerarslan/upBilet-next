"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  EventImageFallback,
  EventSearchRowArrow,
  SearchLoadingPanel,
  SearchNoResultsPanel,
} from "@/components/layout/search-event-dropdown-primitives";
import { useLocale } from "@/contexts/locale-context";
import { formatDateTR, formatTimeTR } from "@/lib/date";
import { searchEventsClient } from "@/lib/search-events";
import type { PublicEvent } from "@/types/event";

export function MobileSearchBar() {
  const { href, t } = useLocale();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    setResults([]);
    try {
      const evs = await searchEventsClient(trimmed);
      setResults(evs);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function onInput(v: string) {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    if (!v.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => void runSearch(v), 300);
  }

  function pick(e: PublicEvent) {
    setOpen(false);
    setQ("");
    router.push(href(`/detay/${e.slug}`));
  }

  function fmt(d: string) {
    return `${formatDateTR(d)} ${formatTimeTR(d)}`;
  }

  return (
    <div className="block w-full px-4 py-3 md:hidden">
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          value={q}
          onChange={(e) => onInput(e.target.value)}
          onFocus={() => q.trim() && results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={t("header.mobileSearchPlaceholder")}
          aria-label={t("header.mobileSearchPlaceholder")}
          className="h-[44px] w-full rounded-[20px] border border-gray-300 bg-white pl-12 pr-4 text-sm focus:border-[#615FFF] focus:outline-none focus:ring-1 focus:ring-[#615FFF]"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {loading && open && q.trim() ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-xl">
            <SearchLoadingPanel title={t("header.searching")} subtitle={t("header.searchingHint")} />
          </div>
        ) : open && results.length > 0 ? (
          <div
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {results.map((event) => (
              <button
                key={event._id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(event)}
                aria-label={`${event.name} — ${t("header.openEvent")}`}
                className="w-full cursor-pointer border-b border-gray-100 p-4 text-left transition-colors last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="shrink-0">
                    <div className="h-12 w-12 overflow-hidden rounded-lg">
                      {event.image?.trim() && !event.image.includes(" ") ? (
                        <img
                          src={event.image}
                          alt={event.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <EventImageFallback />
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold leading-tight text-gray-900">{event.name}</h4>
                    <p className="mt-1 text-xs text-gray-600">{fmt(event.date)}</p>
                  </div>
                  <EventSearchRowArrow />
                </div>
              </button>
            ))}
          </div>
        ) : open && q.trim() && results.length === 0 ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-xl">
            <SearchNoResultsPanel title={t("header.noResults")} subtitle={t("header.noResultsHint")} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
