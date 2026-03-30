"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiCreateListing } from "@/lib/api/member-api";
import { formatDateTR, formatTimeTR } from "@/lib/date";
import {
  fetchPublicVenueStructure,
  type PublicSearchEvent,
  searchPublicEvents,
} from "@/lib/public-api-browser";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  t: (key: string) => string;
};

export function ProfileListingCreateModal({ open, onClose, onCreated, t }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicSearchEvent[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PublicSearchEvent | null>(null);

  const [category, setCategory] = useState("");
  const [block, setBlock] = useState("");
  const [row, setRow] = useState("");
  const [seat, setSeat] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [price, setPrice] = useState<number | "">("");
  const [ticketType, setTicketType] = useState("pdf");
  const [venueStructure, setVenueStructure] = useState<{
    categories?: { _id: string; name: string; blocks?: { name?: string }[] }[];
  } | null>(null);
  const [venueErr, setVenueErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedBlocks = useMemo(() => {
    if (!venueStructure?.categories) return [];
    const cat = venueStructure.categories.find((c) => c.name === category);
    return cat?.blocks ?? [];
  }, [venueStructure, category]);

  const sellerNet = useMemo(() => {
    const p = typeof price === "number" ? price : parseFloat(String(price));
    if (Number.isNaN(p)) return "0.00";
    return (p * 0.8).toFixed(2);
  }, [price]);

  const resetForm = useCallback(() => {
    setQuery("");
    setResults([]);
    setSelectedEvent(null);
    setCategory("");
    setBlock("");
    setRow("");
    setSeat("");
    setQuantity(1);
    setPrice("");
    setTicketType("pdf");
    setVenueStructure(null);
    setVenueErr(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
  }, [open, resetForm]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void (async () => {
        if (!query.trim()) {
          setResults([]);
          return;
        }
        setSearching(true);
        try {
          const evs = await searchPublicEvents(query);
          setResults(evs);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 320);
    return () => clearTimeout(timer);
  }, [query, open]);

  const loadVenueForEvent = useCallback(
    async (ev: PublicSearchEvent) => {
      setVenueErr(null);
      setVenueStructure(null);
      setCategory("");
      setBlock("");
      const venueTag = ev.tags?.find((tag) => tag.tag === "EtkinlikAlanı");
      if (!venueTag?._id) {
        setVenueErr(t("profile.listingsVenueLoadError"));
        return;
      }
      try {
        const vs = await fetchPublicVenueStructure(venueTag._id);
        if (vs) setVenueStructure(vs);
        else setVenueErr(t("profile.listingsVenueLoadError"));
      } catch {
        setVenueErr(t("profile.listingsVenueLoadError"));
      }
    },
    [t]
  );

  const pickEvent = (ev: PublicSearchEvent) => {
    setSelectedEvent(ev);
    setQuery("");
    setResults([]);
    void loadVenueForEvent(ev);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent?._id) {
      window.alert(t("profile.listingsPickEventFirst"));
      return;
    }
    const cat = category.trim();
    if (!cat) {
      window.alert(t("profile.listingsCategoryRequired"));
      return;
    }
    const q = typeof quantity === "number" ? quantity : parseInt(String(quantity), 10);
    const p = typeof price === "number" ? price : parseFloat(String(price));
    if (!Number.isFinite(q) || q < 1 || q > 10) {
      window.alert(t("profile.listingsQtyInvalid"));
      return;
    }
    if (!Number.isFinite(p) || p < 0) {
      window.alert(t("profile.listingsPriceInvalid"));
      return;
    }

    setSaving(true);
    try {
      const res = await apiCreateListing({
        eventId: selectedEvent._id,
        price: p,
        category: cat,
        ticketType,
        quantity: q,
        block: block.trim() || undefined,
        row: row.trim() || undefined,
        seat: seat.trim() || undefined,
      });
      if (res.success) {
        onClose();
        resetForm();
        onCreated();
      } else {
        const err = res.error;
        window.alert(Array.isArray(err) ? err.join("\n") : (err ?? t("profile.errorGeneric")));
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t("profile.errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-4">
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-semibold">{t("profile.listingsCreateTitle")}</div>
          <button type="button" className="text-2xl text-gray-400 hover:text-gray-600" onClick={onClose} aria-label={t("header.close")}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("profile.listingsSearchEvent")}</label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={!!selectedEvent}
                className="w-full rounded-lg border bg-gray-50 px-4 py-2 pr-10 disabled:bg-gray-100"
                placeholder={t("profile.listingsSearchPlaceholder")}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {searching ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                ) : null}
              </div>
            </div>
            {selectedEvent ? (
              <div className="mt-2 rounded-lg border bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{selectedEvent.name}</div>
                    <div className="text-sm text-gray-500">
                      {selectedEvent.date ? `${formatDateTR(selectedEvent.date)} ${formatTimeTR(selectedEvent.date)}` : ""}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedEvent.tags?.find((tag) => tag.tag === "EtkinlikAlanı")?.name || selectedEvent.location}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-sm text-indigo-600 hover:underline"
                    onClick={() => {
                      setSelectedEvent(null);
                      setVenueStructure(null);
                      setCategory("");
                      setBlock("");
                      setVenueErr(null);
                    }}
                  >
                    {t("profile.listingsChangeEvent")}
                  </button>
                </div>
              </div>
            ) : results.length > 0 && query.trim() ? (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border bg-white shadow-lg">
                {results.map((ev) => (
                  <button
                    key={ev._id}
                    type="button"
                    className="w-full border-b p-3 text-left last:border-b-0 hover:bg-gray-50"
                    onClick={() => pickEvent(ev)}
                  >
                    <div className="font-medium">{ev.name}</div>
                    <div className="text-sm text-gray-500">
                      {ev.date ? `${formatDateTR(ev.date)} ${formatTimeTR(ev.date)}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {venueErr ? <p className="text-sm text-amber-700">{venueErr}</p> : null}

          <div>
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editTicketFormat")}</label>
            <select className="w-full rounded-lg border bg-white px-3 py-2" value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
              <option value="paper">{t("profile.ticketTypePaper")}</option>
              <option value="pdf">{t("profile.ticketTypePdf")}</option>
              <option value="e-ticket">{t("profile.ticketTypeE")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editTicketCategory")}</label>
            {venueStructure?.categories && venueStructure.categories.length > 0 ? (
              <select
                className="w-full rounded-lg border bg-white px-3 py-2"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setBlock("");
                }}
              >
                <option value="">{t("profile.listingsPickCategory")}</option>
                {venueStructure.categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="w-full rounded-lg border bg-white px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t("profile.listingsCategoryManual")}
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">{t("profile.block")}</label>
            {selectedBlocks.length > 0 ? (
              <select className="w-full rounded-lg border bg-white px-3 py-2" value={block} onChange={(e) => setBlock(e.target.value)}>
                <option value="">{t("profile.listingsPickBlock")}</option>
                {selectedBlocks.map((b, i) => (
                  <option key={`${b.name}-${i}`} value={b.name ?? ""}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <input className="w-full rounded-lg border bg-white px-3 py-2" value={block} onChange={(e) => setBlock(e.target.value)} />
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">{t("profile.row")}</label>
              <input className="w-full rounded-lg border bg-white px-3 py-2" value={row} onChange={(e) => setRow(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">{t("profile.editSeatNo")}</label>
              <input className="w-full rounded-lg border bg-white px-3 py-2" value={seat} onChange={(e) => setSeat(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editQty")}</label>
            <input
              className="w-full rounded-lg border bg-gray-50 px-3 py-2"
              type="number"
              min={1}
              max={10}
              value={quantity === "" ? "" : quantity}
              onChange={(e) => {
                const v = e.target.value;
                setQuantity(v === "" ? "" : parseInt(v, 10));
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editListPrice")}</label>
            <div className="flex items-center">
              <input
                className="w-full rounded-lg border bg-white px-3 py-2"
                type="number"
                min={0}
                step="0.01"
                value={price === "" ? "" : price}
                onChange={(e) => {
                  const v = e.target.value;
                  setPrice(v === "" ? "" : parseFloat(v));
                }}
              />
              <span className="ml-2 font-semibold text-gray-500">TL</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editSellerNet")}</label>
            <div className="flex items-center">
              <input className="w-full rounded-lg border bg-gray-100 px-3 py-2" readOnly value={sellerNet} />
              <span className="ml-2 font-semibold text-gray-500">TL</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !selectedEvent}
            className="mt-4 w-full rounded-lg bg-indigo-500 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "…" : t("profile.listingsSubmitCreate")}
          </button>
        </form>
      </div>
    </div>
  );
}
