import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { NotFoundView } from "@/components/layout/NotFoundView";
import { defaultLocale } from "@/i18n";
import { notFoundMetadata } from "@/lib/not-found-metadata";

export const metadata: Metadata = notFoundMetadata;

export default function NotFound() {
  return (
    <AppShell locale={defaultLocale}>
      <NotFoundView />
    </AppShell>
  );
}
