"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { defaultLocale, getMessages, type Locale, translate, type MessageTree } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";

type Ctx = {
  locale: Locale;
  href: (path: string) => string;
  t: (path: string) => string;
  messages: MessageTree;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const locale = initialLocale ?? defaultLocale;

  const href = useCallback((path: string) => localizedPath(locale, path), [locale]);

  const messages = useMemo(() => getMessages(locale), [locale]);

  const t = useCallback((path: string) => translate(messages, path), [messages]);

  const value = useMemo(
    () => ({ locale, href, t, messages }),
    [locale, href, t, messages]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale outside LocaleProvider");
  return ctx;
}
