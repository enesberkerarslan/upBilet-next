/**
 * Ortam seçimi: NODE_ENV === 'production' → PROD URL'leri, aksi halde DEV.
 * Tek satırlık NEXT_PUBLIC_API_URL / API_URL her zaman önceliklidir (override).
 */

const isProduction = process.env.NODE_ENV === "production";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function pickString(...candidates: (string | undefined)[]): string | undefined {
  for (const c of candidates) {
    if (c != null && String(c).trim() !== "") return String(c).trim();
  }
  return undefined;
}

export type UrlResolverOptions = {
  /** Tek değişken — dev ve prod için ortak override */
  singlePublic?: string;
  singleServer?: string;
  devPublic?: string;
  prodPublic?: string;
  devServer?: string;
  prodServer?: string;
  fallback: string;
};

/** Tarayıcıda yalnızca NEXT_PUBLIC_* kullanılır */
export function resolvePublicUrl(opts: UrlResolverOptions): string {
  const single = pickString(opts.singlePublic);
  if (single) return stripTrailingSlash(single);
  const env = isProduction
    ? pickString(opts.prodPublic, opts.devPublic)
    : pickString(opts.devPublic, opts.prodPublic);
  return stripTrailingSlash(env ?? opts.fallback);
}

/** Sunucuda önce server-only, sonra public, sonra fallback */
export function resolveServerUrl(opts: UrlResolverOptions): string {
  const serverSingle = pickString(opts.singleServer);
  if (serverSingle) return stripTrailingSlash(serverSingle);
  const publicSingle = pickString(opts.singlePublic);
  if (publicSingle) return stripTrailingSlash(publicSingle);

  const serverDual = isProduction
    ? pickString(opts.prodServer, opts.devServer)
    : pickString(opts.devServer, opts.prodServer);
  if (serverDual) return stripTrailingSlash(serverDual);

  return resolvePublicUrl(opts);
}
