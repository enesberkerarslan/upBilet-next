"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProfileEmptyPanel } from "@/components/profile/ProfileEmptyPanel";
import { ProfilePanelHeader } from "@/components/profile/ProfilePanelHeader";
import {
  buyerPurchaseStatusBadgeClass,
  buyerPurchaseStatusClass,
  buyerPurchaseStatusLabel,
  eventDateLoc,
  eventName,
  formatProfileUtcDateTime,
  formatSaleDate,
  saleProgressIconSrc,
  saleRefDisplay,
} from "@/components/profile/profile-utils";
import { useLocale } from "@/contexts/locale-context";
import { apiGetMyPurchases, type SaleRecord } from "@/lib/api/member-api";

type Props = { initialPurchases?: SaleRecord[] };

function eventLocation(ticket: SaleRecord): string {
  const e = ticket.eventId;
  return e && typeof e === "object" && "location" in e ? String((e as { location?: string }).location ?? "") : "";
}

function eventDateRaw(ticket: SaleRecord): string {
  const e = ticket.eventId;
  return e && typeof e === "object" && "date" in e ? String((e as { date?: string }).date ?? "") : "";
}

export function ProfileTicketsPanel({ initialPurchases }: Props = {}) {
  const { t, locale, href } = useLocale();
  const fromServer = initialPurchases !== undefined;
  const [list, setList] = useState<SaleRecord[]>(() => (fromServer ? initialPurchases! : []));
  const [loading, setLoading] = useState(!fromServer);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiGetMyPurchases();
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
      <ProfilePanelHeader title={t("profile.ticketsTitle")} />

      <div className="flex min-h-[min(50dvh,420px)] flex-1 flex-col px-4 py-8">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" aria-hidden />
          </div>
        ) : err ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-red-500">
            <span className="mb-2 text-lg">{t("profile.errorGeneric")}</span>
            <span className="text-sm">{err}</span>
            <button
              type="button"
              onClick={load}
              className="mt-4 rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200"
            >
              {t("profile.retry")}
            </button>
          </div>
        ) : list.length === 0 ? (
          <ProfileEmptyPanel
            variant="tickets"
            title={t("profile.emptyTicketsTitle")}
            description={t("profile.emptyTicketsDesc")}
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
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span>{ticket.saleDate ? formatProfileUtcDateTime(ticket.saleDate, locale) : ""}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{saleRefDisplay(ticket)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="flex items-center gap-2 rounded px-2 py-1 text-xs">
                      <img src="/generalicon/football.svg" width={20} height={20} alt="" />
                      {t("profile.listingsFootball")}
                    </span>
                  </div>
                </div>
                <div className="mb-5 border-b border-gray-200" />
                <div className="mb-2 text-lg font-bold">{eventName(ticket)}</div>
                <div className="mb-2 mt-3 grid grid-cols-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <img src="/generalicon/calender.svg" className="h-4 w-4" alt="" />
                    <span>
                      {formatProfileUtcDateTime(eventDateRaw(ticket), locale) || eventDateLoc(ticket, locale)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src="/generalicon/location.svg" className="h-4 w-4" alt="" />
                    <span>{eventLocation(ticket)}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400">{t("profile.category")}: </span>
                    {ticket.category}
                  </div>
                  <div>
                    <span className="text-gray-400">{t("profile.block")}: </span>
                    {ticket.block}
                  </div>
                  <div>
                    <span className="text-gray-400">{t("profile.row")}: </span>
                    {ticket.row}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <span className="text-gray-400">{t("profile.qty")}: </span>
                  {ticket.ticketQuantity}
                </div>
                <div className="mb-5 mt-5 border-b border-gray-200" />
                <div className="mt-5 flex items-center justify-between gap-4">
                  <span
                    className={`flex items-center text-xs ${buyerPurchaseStatusClass(ticket.status)}`}
                  >
                    <img
                      src={saleProgressIconSrc(ticket.status)}
                      alt=""
                      className="mr-2 h-[13px] w-[13px]"
                    />
                    {buyerPurchaseStatusLabel(ticket.status, t)}
                  </span>
                  <span className="shrink-0 text-lg font-bold">{ticket.totalAmount ?? 0} TL</span>
                </div>
              </div>
              <div className="block p-4 md:hidden">
                <div className="mb-2 flex items-start justify-between gap-2 text-[11px] text-gray-500">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                    <span className="shrink-0">{ticket.saleDate ? formatProfileUtcDateTime(ticket.saleDate, locale) : ""}</span>
                    <span className="shrink-0">•</span>
                    <span className="break-all font-mono text-gray-400">{saleRefDisplay(ticket)}</span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs">
                    <img src="/generalicon/football.svg" width={18} height={18} alt="" />
                    {t("profile.listingsFootball")}
                  </span>
                </div>
                <h3 className="text-sm font-semibold leading-tight text-gray-800">{eventName(ticket)}</h3>
                <div className="mt-2 flex items-center gap-1">
                  <img src="/generalicon/calender.svg" className="h-3 w-3" alt="" />
                  <span className="text-xs text-gray-500">
                    {formatSaleDate(eventDateRaw(ticket), locale) || eventDateLoc(ticket, locale)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  <img src="/generalicon/location.svg" className="h-3 w-3" alt="" />
                  <span className="text-xs text-gray-500">{eventLocation(ticket)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${buyerPurchaseStatusBadgeClass(ticket.status)}`}
                  >
                    <img src={saleProgressIconSrc(ticket.status)} className="h-3 w-3" alt="" />
                    {buyerPurchaseStatusLabel(ticket.status, t)}
                  </span>
                  <span className="shrink-0 text-sm font-bold">{ticket.totalAmount ?? 0} TL</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
