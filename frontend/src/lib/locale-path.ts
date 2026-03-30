import { defaultLocale, type Locale } from "@/i18n";

/** Set on the request in middleware so server components (e.g. not-found) can read the public URL path. */
export const UPBILET_PATHNAME_HEADER = "x-upbilet-pathname";

/** Turkish (default): no /tr prefix. English: /en/... */
export function localizedPath(locale: Locale, path: string): string {
  const normalized =
    path === "/" || path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) {
    return normalized === "" ? "/" : normalized;
  }
  return `/en${normalized}`;
}

export function switchLocaleInPath(pathname: string, newLocale: Locale): string {
  const parts = pathname.split("/").filter(Boolean);
  let restParts = parts;
  if (parts[0] === "en" || parts[0] === "tr") {
    restParts = parts.slice(1);
  }
  const tail = restParts.length === 0 ? "/" : `/${restParts.join("/")}`;
  return localizedPath(newLocale, tail);
}

export function currentLocaleFromPathname(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0];
  return first === "en" ? "en" : defaultLocale;
}
