import { AppShell } from "@/components/layout/AppShell";
import { locales, type Locale } from "@/i18n";
import { notFound } from "next/navigation";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!(locales as readonly string[]).includes(raw)) {
    notFound();
  }
  const locale = raw as Locale;
  return <AppShell locale={locale}>{children}</AppShell>;
}
