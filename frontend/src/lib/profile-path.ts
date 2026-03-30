import type { Locale } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";

/** Profil alt sayfaları — URL segmentleri (Türkçe slug). */
export const PROFILE_SECTIONS = [
  "biletlerim",
  "ilanlarim",
  "sattigim-biletler",
  "odemelerim",
  "banka-hesaplarim",
  "adreslerim",
  "kisisel-bilgilerim",
  "destek",
] as const;

export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

export function isProfileSection(value: string): value is ProfileSection {
  return (PROFILE_SECTIONS as readonly string[]).includes(value);
}

export const PROFILE_DEFAULT_SECTION: ProfileSection = "biletlerim";

export function profileSectionPath(section: ProfileSection): string {
  return `/profil/${section}`;
}

export function profileDefaultHref(locale: Locale): string {
  return localizedPath(locale, profileSectionPath(PROFILE_DEFAULT_SECTION));
}
