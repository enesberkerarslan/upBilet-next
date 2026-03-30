"use client";

import { useLocale } from "@/contexts/locale-context";

const copyKey = {
  payments: "profile.comingPayments",
  bank: "profile.comingBank",
  address: "profile.comingAddress",
} as const;

export function ProfileComingSoon({ section }: { section: keyof typeof copyKey }) {
  const { t } = useLocale();
  return (
    <div className="w-full rounded-2xl bg-white p-10 text-center">
      <h2 className="text-lg font-semibold text-gray-800">{t("profile.comingTitle")}</h2>
      <p className="mt-3 text-sm text-gray-500">{t(copyKey[section])}</p>
    </div>
  );
}
