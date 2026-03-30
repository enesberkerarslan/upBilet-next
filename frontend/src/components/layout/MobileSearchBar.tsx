"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useLocale } from "@/contexts/locale-context";
import { formatDateTR, formatTimeTR } from "@/lib/date";
import { searchEventsClient } from "@/lib/search-events";
import type { PublicEvent } from "@/types/event";

export function MobileSearchBar() {
  const { href } = useLocale();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const evs = await searchEventsClient(query);
      setResults(evs);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function onInput(v: string) {
    setQ(v);
    if (t.current) clearTimeout(t.current);
    if (!v.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    t.current = setTimeout(() => runSearch(v), 300);
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
          type="search"
          value={q}
          onChange={(e) => onInput(e.target.value)}
          onFocus={() => q.trim() && results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Ara.."
          className="h-[44px] w-full rounded-[20px] border border-gray-300 bg-white pl-12 pr-4 text-sm focus:border-[#615FFF] focus:outline-none focus:ring-1 focus:ring-[#615FFF]"
        />
        <svg
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {open && results.length > 0 ? (
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
                className="w-full border-b border-gray-100 p-4 text-left transition-colors last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    {event.image?.trim() && !event.image.includes(" ") ? (
                      <img src={event.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 text-gray-500">
                        <span className="text-xs">—</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold leading-tight text-gray-900">{event.name}</h4>
                    <p className="mt-1 text-xs text-gray-600">{fmt(event.date)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {open && q.trim() && !loading && results.length === 0 ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
            <p className="text-sm text-gray-500">Sonuç bulunamadı</p>
          </div>
        ) : null}

        {loading && open ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
            <p className="text-sm text-gray-600">Aranıyor...</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
