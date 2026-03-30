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
    <main className="flex w-full flex-1 flex-col rounded-2xl bg-white px-2">
      <ProfilePanelHeader title={t("profile.menuPayments")} />
      <div className="flex min-h-[min(50dvh,420px)] flex-1 flex-col py-4 md:px-6">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" aria-hidden />
          </div>
        ) : list.length === 0 ? (
          <ProfileEmptyPanel
            variant="payments"
            title={t("profile.emptyPaymentsTitle")}
            description={t("profile.emptyPaymentsDesc")}
          />
        ) : (
          <ul className="mx-auto w-full max-w-3xl space-y-3">
            {list.map((p) => (
              <li
                key={p._id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-gray-500">
                    {formatPeriod(p.startDate, locale)} — {formatPeriod(p.endDate, locale)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      p.status === "paid" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {p.status === "paid" ? t("profile.payStatusPaid") : t("profile.payStatusPending")}
                  </span>
                </div>
                <p className="mt-3 text-lg font-bold text-gray-900">
                  {(p.totalAmount ?? 0).toLocaleString(locale === "en" ? "en-US" : "tr-TR")} TL
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
