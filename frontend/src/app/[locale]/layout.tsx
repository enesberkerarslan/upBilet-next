import { AppShell } from "@/components/layout/AppShell";
import { locales, type Locale } from "@/i18n";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

function decodeCookieValue(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!(locales as readonly string[]).includes(raw)) {
    notFound();
  }
  const locale = raw as Locale;
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("token")?.value;
  const initialAuth = {
    hasSession: Boolean(tokenCookie?.trim()),
    userType: decodeCookieValue(cookieStore.get("userType")?.value),
  };
  return (
    <AppShell locale={locale} initialAuth={initialAuth}>
      {children}
    </AppShell>
  );
}
