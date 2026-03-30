"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Locale } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";

export type ModalTicket = {
  id: string;
  category: string;
  block?: string;
  row?: string;
  price: number;
  quantity: number;
};

type Props = {
  locale: Locale;
  open: boolean;
  ticket: ModalTicket | null;
  matchName: string;
  onClose: () => void;
};

export function TicketPurchaseModal({ locale, open, ticket, matchName, onClose }: Props) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);

  const maxQty = useMemo(() => (ticket ? Math.min(10, ticket.quantity) : 1), [ticket]);

  if (!open || !ticket) return null;

  const active = ticket;

  function selectQty(n: number) {
    setSelectedQty(n);
    setShowDropdown(false);
  }

  function handleSelect() {
    const q = new URLSearchParams({ id: active.id, quantity: String(selectedQty) });
    router.push(localizedPath(locale, `/odeme?${q.toString()}`));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 py-4">
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl md:p-8"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          onClick={onClose}
          aria-label="Kapat"
        >
          ×
        </button>
        <div className="mb-6 flex flex-col gap-2 pr-10 md:flex-row md:items-center md:justify-between">
          <div className="text-lg font-semibold text-indigo-900">{matchName}</div>
          <div className="text-base font-semibold text-indigo-900 md:text-right">
            {active.category}
            {active.block ? ` - Blok: ${active.block}` : ""}
          </div>
        </div>

        <div className="mx-auto max-w-md">
          <div className="text-sm text-gray-500">Bilet fiyatı</div>
          <div className="mb-1 text-3xl font-bold">₺{active.price.toLocaleString("tr-TR")}</div>
          <div className="mb-4 text-xs text-gray-400">bilet başı fiyatı</div>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">Bilet adedi</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg border bg-gray-100 px-4 py-2 text-left"
              >
                {selectedQty} adet
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path stroke="#333" strokeWidth="2" d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {showDropdown ? (
                <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg bg-white shadow">
                  {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => selectQty(n)}
                      className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                        selectedQty === n ? "font-semibold text-indigo-600" : ""
                      }`}
                    >
                      {n} adet
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-indigo-900 py-3 text-lg font-semibold text-white transition hover:bg-indigo-800"
            onClick={handleSelect}
          >
            Bileti seç
          </button>
        </div>
      </div>
    </div>
  );
}
