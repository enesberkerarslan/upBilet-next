"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";
import { StadiumPlanModalPreview } from "@/components/detay/StadiumPlanModalPreview";

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
  /** Varsa modalda sol sütunda ilgili blok/kategori vurgulu plan */
  stadiumPlanSrc?: string | null;
};

export function TicketPurchaseModal({
  locale,
  open,
  ticket,
  matchName,
  onClose,
  stadiumPlanSrc,
}: Props) {
  const router = useRouter();
  const [selectedQty, setSelectedQty] = useState(1);
  const [extraQtyOpen, setExtraQtyOpen] = useState(false);

  const maxQty = useMemo(() => (ticket ? Math.min(10, ticket.quantity) : 1), [ticket]);

  useEffect(() => {
    if (ticket) {
      setSelectedQty(1);
      setExtraQtyOpen(false);
    }
  }, [ticket?.id]);

  useEffect(() => {
    if (selectedQty > 5) setExtraQtyOpen(true);
  }, [selectedQty]);

  if (!open || !ticket) return null;

  const active = ticket;
  const showStadium = Boolean(stadiumPlanSrc);

  function selectQty(n: number) {
    if (n < 1 || n > maxQty) return;
    setSelectedQty(n);
  }

  /** Header / profil ile aynı marka rengi (#615FFF) */
  const qtyBtnClass = (n: number) =>
    `flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-base font-semibold transition ${
      selectedQty === n
        ? "bg-[#615FFF] text-white shadow-sm ring-2 ring-[#615FFF]/25"
        : "border border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-[#615FFF]/45 hover:bg-[#615FFF]/10"
    }`;

  function handleSelect() {
    const q = new URLSearchParams({ id: active.id, quantity: String(selectedQty) });
    router.push(localizedPath(locale, `/odeme?${q.toString()}`));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 py-4">
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-4 shadow-xl md:p-8 ${
          showStadium ? "max-w-4xl" : "max-w-2xl"
        }`}
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
          <div className="text-lg font-semibold text-zinc-900">{matchName}</div>
          <div className="text-base font-semibold text-[#615FFF] md:text-right">
            {active.category}
            {active.block ? ` - Blok: ${active.block}` : ""}
          </div>
        </div>

        <div
          className={
            showStadium
              ? "grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,48%)_minmax(0,1fr)] md:items-start"
              : ""
          }
        >
          {showStadium && stadiumPlanSrc ? (
            <div className="min-w-0 w-full max-w-full self-start overflow-hidden bg-white md:sticky md:top-0">
              <StadiumPlanModalPreview
                src={stadiumPlanSrc}
                highlightBlock={active.block}
                highlightCategory={active.category}
                className="w-full"
              />
            </div>
          ) : null}

          <div className={showStadium ? "min-w-0" : "mx-auto max-w-md"}>
            <div className="text-sm text-gray-500">Bilet fiyatı</div>
            <div className="mb-1 text-3xl font-bold">₺{active.price.toLocaleString("tr-TR")}</div>
            <div className="mb-4">
              <label className="mb-2 block text-xs text-gray-500">Bilet adedi</label>
              <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: Math.min(5, maxQty) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => selectQty(n)}
                    className={qtyBtnClass(n)}
                    aria-pressed={selectedQty === n}
                  >
                    {n}
                  </button>
                ))}
                {maxQty > 5 ? (
                  <button
                    type="button"
                    onClick={() => setExtraQtyOpen((o) => !o)}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition ${
                      extraQtyOpen || selectedQty > 5
                        ? "border-2 border-[#615FFF] bg-[#615FFF]/12 text-[#615FFF]"
                        : "border border-dashed border-zinc-300 bg-white text-[#615FFF] hover:border-[#615FFF]/50 hover:bg-[#615FFF]/08"
                    }`}
                    aria-expanded={extraQtyOpen}
                    aria-label="6 ve üzeri adet"
                  >
                    +5
                  </button>
                ) : null}
              </div>
              {maxQty > 5 && extraQtyOpen ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.from({ length: maxQty - 5 }, (_, i) => i + 6).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => selectQty(n)}
                      className={qtyBtnClass(n)}
                      aria-pressed={selectedQty === n}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="w-full rounded-lg bg-[#615FFF] py-3 text-lg font-semibold text-white shadow-[0_4px_14px_rgba(97,95,255,0.35)] transition hover:bg-[#5050e8] hover:shadow-[0_6px_18px_rgba(97,95,255,0.4)]"
              onClick={handleSelect}
            >
              Bileti seç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
