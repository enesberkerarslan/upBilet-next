"use client";

import { useCallback, useEffect, useState } from "react";
import { ProfileEmptyPanel } from "@/components/profile/ProfileEmptyPanel";
import { ProfilePanelHeader } from "@/components/profile/ProfilePanelHeader";
import { useLocale } from "@/contexts/locale-context";
import { apiGetProfile, type PaymentPeriodRecord } from "@/lib/api/member-api";

function formatPeriod(d?: string, locale?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

type Props = { initialPeriods?: PaymentPeriodRecord[] };

export function ProfilePaymentsPanel({ initialPeriods }: Props = {}) {
  const { t, locale } = useLocale();
  const fromServer = initialPeriods !== undefined;
  const [list, setList] = useState<PaymentPeriodRecord[]>(() => (fromServer ? initialPeriods! : []));
  const [loading, setLoading] = useState(!fromServer);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetProfile();
      if (res.success && res.member?.paymentPeriods && Array.isArray(res.member.paymentPeriods)) {
        setList(res.member.paymentPeriods);
      } else {
        setList([]);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fromServer) return;
    void load();
  }, [fromServer, load]);

  return (
    <main className="flex w-full flex-1 flex-col rounded-3xl bg-white">
      <ProfilePanelHeader title={t("profile.menuPayments")} />
      <div className="flex min-h-[min(50dvh,420px)] flex-1 flex-col px-4 py-8">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500" aria-hidden />
          </div>
        ) : list.length === 0 ? (
          <ProfileEmptyPanel
            variant="payments"
            title={t("profile.emptyPaymentsTitle")}
            description={t("profile.emptyPaymentsDesc")}
          />
        ) : (
          <ul className="w-full space-y-4 md:space-y-6">
            {list.map((p) => {
              const paid = p.status === "paid";
              return (
                <li
                  key={p._id}
                  className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-200/50 transition-all duration-200 hover:border-gray-300 hover:shadow-md md:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"
                        aria-hidden
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
                          />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          {t("profile.payPeriodLabel")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formatPeriod(p.startDate, locale)} — {formatPeriod(p.endDate, locale)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                        paid
                          ? "bg-emerald-50 text-emerald-800 ring-emerald-200/70"
                          : "bg-amber-50 text-amber-900 ring-amber-200/70"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${paid ? "bg-emerald-500" : "bg-amber-500"}`}
                        aria-hidden
                      />
                      {paid ? t("profile.payStatusPaid") : t("profile.payStatusPending")}
                    </span>
                  </div>
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium text-gray-500">{t("profile.amount")}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-gray-900">
                      {(p.totalAmount ?? 0).toLocaleString(locale === "en" ? "en-US" : "tr-TR")} TL
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
