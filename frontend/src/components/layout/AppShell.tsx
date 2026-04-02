"use client";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { LocaleProvider } from "@/contexts/locale-context";
import type { Locale } from "@/i18n";

export type InitialAuthFromCookies = { hasSession: boolean; userType: string | null };

const emptyInitialAuth: InitialAuthFromCookies = { hasSession: false, userType: null };

export function AppShell({
  locale,
  children,
  initialAuth = emptyInitialAuth,
}: {
  locale: Locale;
  children: React.ReactNode;
  initialAuth?: InitialAuthFromCookies;
}) {
  return (
    <LocaleProvider initialLocale={locale}>
      <div className="main-container flex min-h-screen flex-col">
        <Header initialAuth={initialAuth} />
        <div className="container mx-auto flex min-h-0 max-w-[1280px] flex-1 flex-col px-4 md:px-6">{children}</div>
        <Footer />
        <CookieConsent />
      </div>
    </LocaleProvider>
  );
}
