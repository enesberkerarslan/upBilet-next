"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/contexts/locale-context";

const STORAGE_KEY = "cookieConsent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { href } = useLocale();

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  function reject() {
    try {
      localStorage.setItem(STORAGE_KEY, "rejected");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="mt-1 shrink-0">
                <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">Çerez Kullanımı</h3>
                <p className="text-base leading-relaxed text-gray-600">
                  Web sitemizde deneyiminizi geliştirmek için çerezler kullanıyoruz. Siteyi kullanmaya devam ederek çerez
                  kullanımını kabul etmiş olursunuz.{" "}
                  <Link
                    href={href("/bilgi/cerez-politikasi")}
                    className="mt-2 block text-blue-600 hover:underline md:mt-0 md:inline"
                  >
                    Çerez Politikası
                  </Link>
                </p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <button
              type="button"
              onClick={reject}
              className="rounded-lg bg-gray-100 px-6 py-3 text-base font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              Reddet
            </button>
            <button
              type="button"
              onClick={accept}
              className="rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
            >
              Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
