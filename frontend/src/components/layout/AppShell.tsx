"use client";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { LocaleProvider } from "@/contexts/locale-context";
import type { Locale } from "@/i18n";

export function AppShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <LocaleProvider initialLocale={locale}>
      <div className="main-container flex min-h-screen flex-col">
        <Header />
        <div className="container mx-auto flex min-h-0 max-w-[1280px] flex-1 flex-col px-4 md:px-6">{children}</div>
        <Footer />
        <CookieConsent />
      </div>
    </LocaleProvider>
  );
}
