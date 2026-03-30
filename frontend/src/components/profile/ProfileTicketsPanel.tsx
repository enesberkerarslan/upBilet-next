"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProfileEmptyPanel } from "@/components/profile/ProfileEmptyPanel";
import { ProfilePanelHeader } from "@/components/profile/ProfilePanelHeader";
import { eventDateLoc, eventName, formatSaleDate, saleStatusLabel } from "@/components/profile/profile-utils";
import { useLocale } from "@/contexts/locale-context";
import { apiGetMyPurchases, type SaleRecord } from "@/lib/api/member-api";

type Props = { initialPurchases?: SaleRecord[] };

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
    <main className="flex w-full flex-1 flex-col rounded-2xl bg-white px-2">
      <ProfilePanelHeader title={t("profile.ticketsTitle")} />

      <div className="flex min-h-[min(50dvh,420px)] flex-1 flex-col py-4 md:px-6">
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
            <div key={ticket._id} className="mb-4 w-full max-w-3xl rounded-2xl border bg-white shadow-sm md:mb-6">
              <div className="hidden p-6 md:block">
                <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{ticket.saleDate ? formatSaleDate(ticket.saleDate, locale) : ""}</span>
                  <span className="font-mono text-[11px]">{ticket._id}</span>
                </div>
                <div className="mb-5 border-b border-gray-200" />
                <div className="mb-2 text-lg font-bold">{eventName(ticket)}</div>
                <div className="mt-3 grid grid-cols-2 text-sm text-gray-500">
                  <span>{eventDateLoc(ticket, locale)}</span>
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
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">{ticket.totalAmount ?? 0} TL</span>
                    <p className="pt-2 text-xs text-gray-600">{saleStatusLabel(ticket.status, t)}</p>
                  </div>
                </div>
              </div>
              <div className="block p-4 md:hidden">
                <div className="mb-1.5 text-xs text-gray-400">{ticket._id}</div>
                <h3 className="text-sm font-semibold leading-tight text-gray-800">{eventName(ticket)}</h3>
                <p className="mt-2 text-xs text-gray-500">{eventDateLoc(ticket, locale)}</p>
                <p className="mt-3 text-sm font-bold">{ticket.totalAmount ?? 0} TL</p>
                <p className="text-xs text-gray-600">{saleStatusLabel(ticket.status, t)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
