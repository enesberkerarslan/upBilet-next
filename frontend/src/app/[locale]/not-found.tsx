import type { Metadata } from "next";
import { headers } from "next/headers";
import { NotFoundView } from "@/components/layout/NotFoundView";
import { defaultLocale, locales, type Locale } from "@/i18n";
import { currentLocaleFromPathname, UPBILET_PATHNAME_HEADER } from "@/lib/locale-path";

export const metadata: Metadata = {
  title: "Hata 404 - UpBilet",
  description: "Aradığınız sayfa bulunamadı.",
  robots: { index: false, follow: false },
};

type Props = { params?: Promise<{ locale?: string }> };

async function resolveLocale(params?: Promise<{ locale?: string }>): Promise<Locale> {
  if (params) {
    const p = await params;
    const raw = p?.locale;
    if (raw && (locales as readonly string[]).includes(raw)) {
      return raw as Locale;
    }
  }
  const pathname = (await headers()).get(UPBILET_PATHNAME_HEADER) ?? "";
  return pathname ? currentLocaleFromPathname(pathname) : defaultLocale;
}

export default async function NotFound({ params }: Props) {
  const locale = await resolveLocale(params);
  return <NotFoundView locale={locale} />;
}
