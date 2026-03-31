"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProfileEmptyPanel } from "@/components/profile/ProfileEmptyPanel";
import { ProfilePanelHeader } from "@/components/profile/ProfilePanelHeader";
import { ProfileSoldTicketDetailModal } from "@/components/profile/ProfileSoldTicketDetailModal";
import {
  eventDateLoc,
  eventName,
  formatProfileUtcDateTime,
  formatSaleDate,
  saleProgressIconSrc,
  saleRefDisplay,
  sellerSaleStatusClass,
  sellerSaleStatusLabel,
} from "@/components/profile/profile-utils";
import { useLocale } from "@/contexts/locale-context";
import { apiGetMySales, type SaleRecord } from "@/lib/api/member-api";

type Props = { initialSales?: SaleRecord[] };

function eventLocation(ticket: SaleRecord): string {
  const e = ticket.eventId;
  return e && typeof e === "object" && "location" in e ? String((e as { location?: string }).location ?? "") : "";
}

function eventDateRaw(ticket: SaleRecord): string {
  const e = ticket.eventId;
  return e && typeof e === "object" && "date" in e ? String((e as { date?: string }).date ?? "") : "";
}

export function ProfileSoldPanel({ initialSales }: Props = {}) {
  const { t, locale, href } = useLocale();
  const fromServer = initialSales !== undefined;
  const [list, setList] = useState<SaleRecord[]>(() => (fromServer ? initialSales! : []));
  const [loading, setLoading] = useState(!fromServer);
  const [err, setErr] = useState<string | null>(null);
  const [modalTicket, setModalTicket] = useState<SaleRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiGetMySales();
      if (res.success && Array.isArray(res.data)) setList(res.data);
      else setList([]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("profile.errorGeneric"));
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (fromServer) return;
    void load();
  }, [fromServer, load]);

  return (
    <main className="flex w-full flex-1 flex-col rounded-3xl bg-white">
      <ProfilePanelHeader title={t("profile.soldPanelTitle")} />
      <div className="flex min-h-[min(50dvh,420px)] flex-1 flex-col px-4 py-8">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" aria-hidden />
          </div>
        ) : err ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-red-500">
            <span className="mb-2 text-center text-lg">{t("profile.errorGeneric")}</span>
            <span className="text-center text-sm opacity-90">{err}</span>
            <button type="button" onClick={() => void load()} className="mt-4 rounded-lg bg-gray-100 px-4 py-2">
              {t("profile.retry")}
            </button>
          </div>
        ) : list.length === 0 ? (
          <ProfileEmptyPanel
            variant="sold"
            title={t("profile.emptySoldTitle")}
            description={t("profile.emptySoldDesc")}
            action={
              <Link
                href={href("/")}
                className="rounded-lg bg-[#615FFF] px-8 py-3 text-sm font-medium text-white transition hover:opacity-80"
              >
                {t("profile.findTickets")}
              </Link>
            }
          />
        ) : (
          list.map((ticket) => (
            <div
              key={ticket._id}
              className="mb-4 w-full rounded-3xl border border-gray-200 bg-white shadow-sm md:mb-6"
            >
              <div className="hidden p-6 md:block">
                <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>{ticket.saleDate ? formatProfileUtcDateTime(ticket.saleDate, locale) : ""}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{saleRefDisplay(ticket)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="flex items-center gap-2 rounded px-2 py-1 text-xs">
                      <img src="/generalicon/football.svg" width={20} height={20} alt="" />
                      {t("profile.listingsFootball")}
                    </span>
                  </div>
                </div>
                <div className="mb-5 border-b border-gray-200" />
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">{eventName(ticket)}</span>
                </div>
                <div className="mb-2 mt-3 grid grid-cols-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <img src="/generalicon/calender.svg" className="h-4 w-4" alt="" />
                    <span>{formatProfileUtcDateTime(eventDateRaw(ticket), locale) || eventDateLoc(ticket, locale)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src="/generalicon/location.svg" className="h-4 w-4" alt="" />
                    <span>{eventLocation(ticket)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-xs">
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.category")}:</span>
                      <span>{ticket.category || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.block")}:</span>
                      <span>{ticket.block || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.row")}:</span>
                      <span>{ticket.row || "—"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">{t("profile.soldQty")}:</span>
                    <span>{ticket.ticketQuantity}</span>
                  </div>
                </div>
                <div className="mb-5 mt-5 border-b border-gray-200" />
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex flex-col justify-start">
                    <span className="text-lg font-bold">
                      {Number(ticket.sellerTotalAmount ?? 0).toFixed(2)} TL
                    </span>
                    <span className={`flex items-center pt-2 text-xs ${sellerSaleStatusClass(ticket.status)}`}>
                      <img src={saleProgressIconSrc(ticket.status)} alt="" className="mr-2 h-[13px] w-[13px]" />
                      {sellerSaleStatusLabel(ticket.status, t)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="rounded-[32px] bg-gray-100 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-200"
                    onClick={() => setModalTicket(ticket)}
                  >
                    {t("profile.soldViewDetails")}
                  </button>
                </div>
              </div>

              <div className="block p-4 md:hidden">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="break-all font-mono text-xs text-gray-400">{saleRefDisplay(ticket)}</span>
                    </div>
                    <h3 className="text-sm font-semibold leading-tight text-gray-800">{eventName(ticket)}</h3>
                    <div className="mt-2 flex items-center gap-1">
                      <img src="/generalicon/calender.svg" className="h-3 w-3" alt="" />
                      <span className="text-xs text-gray-500">{formatSaleDate(eventDateRaw(ticket), locale)}</span>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs ${
                      ticket.status === "pending_approval"
                        ? "bg-orange-100 text-orange-700"
                        : ticket.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : ticket.status === "approved" || ticket.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <img src={saleProgressIconSrc(ticket.status)} className="h-3 w-3" alt="" />
                    {sellerSaleStatusLabel(ticket.status, t)}
                  </span>
                </div>
                <div className="mb-3 rounded-2xl bg-gray-50 p-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.category")}:</span>
                      <span className="font-medium">{ticket.category || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.block")}:</span>
                      <span className="font-medium">{ticket.block || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.row")}:</span>
                      <span className="font-medium">{ticket.row || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.soldQty")}:</span>
                      <span className="font-medium">{ticket.ticketQuantity}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="text-xs text-gray-500">{t("profile.soldYourAmount")}:</span>
                    <span className="text-sm font-bold text-green-600">
                      {Number(ticket.sellerTotalAmount ?? 0).toFixed(2)} TL
                    </span>
                  </div>
                </div>
                <div className="flex">
                  <button
                    type="button"
                    className="flex-1 rounded-lg bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-200"
                    onClick={() => setModalTicket(ticket)}
                  >
                    {t("profile.soldViewDetails")}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ProfileSoldTicketDetailModal
        open={modalTicket != null}
        ticket={modalTicket}
        locale={locale}
        onClose={() => setModalTicket(null)}
        t={t}
        onUploaded={() => void load()}
      />
    </main>
  );
}
