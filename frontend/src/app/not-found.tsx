import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { NotFoundView } from "@/components/layout/NotFoundView";
import { defaultLocale } from "@/i18n";

export const metadata: Metadata = {
  title: "Hata 404 - UpBilet",
  description: "Aradığınız sayfa bulunamadı.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <AppShell locale={defaultLocale}>
      <NotFoundView />
    </AppShell>
  );
}
