"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiUpdateListing,
  type ListingRecord,
  type ListingUpdatePayload,
} from "@/lib/api/member-api";
import { fetchPublicEventById, fetchPublicVenueStructure } from "@/lib/public-api-browser";

type Props = {
  open: boolean;
  listing: ListingRecord | null;
  onClose: () => void;
  onSaved: () => void;
  t: (key: string) => string;
};

function eventIdFromListing(l: ListingRecord): string {
  const e = l.eventId;
  if (e && typeof e === "object" && "_id" in e && (e as { _id?: string })._id) {
    return String((e as { _id: string })._id);
  }
  return typeof e === "string" ? e : "";
}

function eventNameFromListing(l: ListingRecord): string {
  const e = l.eventId;
  if (e && typeof e === "object" && "name" in e) return String((e as { name?: string }).name ?? "");
  return "";
}

export function ProfileListingEditModal({ open, listing, onClose, onSaved, t }: Props) {
  const [category, setCategory] = useState("");
  const [block, setBlock] = useState("");
  const [row, setRow] = useState("");
  const [seat, setSeat] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [ticketType, setTicketType] = useState("pdf");
  const [venueStructure, setVenueStructure] = useState<{ categories?: { _id: string; name: string; blocks?: { name?: string }[] }[] } | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
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

  const resetFromListing = useCallback(
    async (l: ListingRecord) => {
      setLoadErr(null);
      setCategory(l.category ?? "");
      setBlock(l.block ?? "");
      setRow(l.row ?? "");
      setSeat(l.seat ?? "");
      setQuantity(l.quantity ?? "");
      setPrice(l.price ?? "");
      setTicketType(l.ticketType ?? "pdf");
      setVenueStructure(null);

      const eid = eventIdFromListing(l);
      if (!eid) return;

      try {
        const ev = await fetchPublicEventById(eid);
        const venueTag = ev?.tags?.find((tag) => tag.tag === "EtkinlikAlanı");
        if (venueTag?._id) {
          const vs = await fetchPublicVenueStructure(venueTag._id);
          if (vs) setVenueStructure(vs);
        }
      } catch {
        setLoadErr(t("profile.listingsVenueLoadError"));
      }
    },
    [t]
  );

  useEffect(() => {
    if (open && listing) void resetFromListing(listing);
  }, [open, listing, resetFromListing]);

  if (!open || !listing) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listing) return;
    setSaving(true);
    try {
      const q = typeof quantity === "number" ? quantity : parseInt(String(quantity), 10);
      const p = typeof price === "number" ? price : parseFloat(String(price));
      const body: ListingUpdatePayload = {
        ticketType,
        category,
        block,
        row,
        seat,
        quantity: Number.isFinite(q) ? q : undefined,
        price: Number.isFinite(p) ? p : undefined,
      };
      const res = await apiUpdateListing(listing._id, body);
      if (res.success) {
        onClose();
        onSaved();
      } else {
        window.alert(res.error ?? t("profile.errorGeneric"));
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t("profile.errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-4">
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-semibold">{t("profile.editListingTitle")}</div>
          <button type="button" className="text-2xl text-gray-400 hover:text-gray-600" onClick={onClose} aria-label={t("header.close")}>
            ×
          </button>
        </div>
        {loadErr ? <p className="mb-3 text-sm text-amber-700">{loadErr}</p> : null}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editEventName")}</label>
            <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-800">
              {eventNameFromListing(listing) || "—"}
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editTicketFormat")}</label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
            >
              <option value="e-ticket">{t("profile.ticketTypeE")}</option>
              <option value="paper">{t("profile.ticketTypePaper")}</option>
              <option value="pdf">{t("profile.ticketTypePdf")}</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editTicketCategory")}</label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setBlock("");
              }}
            >
              {category && !venueStructure?.categories?.some((c) => c.name === category) ? (
                <option value={category}>{category}</option>
              ) : null}
              {(venueStructure?.categories ?? []).map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">{t("profile.block")}</label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-60"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              disabled={!category || selectedBlocks.length === 0}
            >
              {block && !selectedBlocks.some((b) => b.name === block) ? (
                <option value={block}>{block}</option>
              ) : null}
              {selectedBlocks.map((b, i) => (
                <option key={`${b.name}-${i}`} value={b.name ?? ""}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">{t("profile.row")}</label>
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                value={row}
                onChange={(e) => setRow(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">{t("profile.editSeatNo")}</label>
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                value={seat}
                onChange={(e) => setSeat(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editQty")}</label>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
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
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editListPrice")}</label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-200">
              <input
                className="min-w-0 flex-1 border-0 bg-transparent py-0.5 outline-none ring-0 focus:outline-none focus:ring-0"
                type="number"
                min={0}
                step="0.01"
                value={price === "" ? "" : price}
                onChange={(e) => {
                  const v = e.target.value;
                  setPrice(v === "" ? "" : parseFloat(v));
                }}
              />
              <span className="ml-2 shrink-0 font-semibold text-gray-500">TL</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">{t("profile.editSellerNet")}</label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-100 px-3 py-2">
              <input
                className="min-w-0 flex-1 border-0 bg-transparent py-0.5 outline-none ring-0 focus:outline-none focus:ring-0"
                readOnly
                value={sellerNet}
              />
              <span className="ml-2 shrink-0 font-semibold text-gray-500">TL</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-lg bg-indigo-500 py-3 font-semibold text-white disabled:opacity-60"
          >
            {saving ? "…" : t("profile.save")}
          </button>
        </form>
      </div>
    </div>
  );
}
