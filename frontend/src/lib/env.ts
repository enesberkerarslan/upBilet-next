import { resolvePublicUrl, resolveServerUrl } from "@/lib/api-config";

function withTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

const DEFAULT_API_ROOT = "http://localhost:3002/api";

function apiRootServer(): string {
  return resolveServerUrl({
    singleServer: process.env.API_URL,
    singlePublic: process.env.NEXT_PUBLIC_API_URL,
    devPublic: process.env.NEXT_PUBLIC_API_URL_DEV,
    prodPublic: process.env.NEXT_PUBLIC_API_URL_PROD,
    devServer: process.env.API_URL_DEV,
    prodServer: process.env.API_URL_PROD,
    fallback: DEFAULT_API_ROOT,
  });
}

function apiRootBrowser(): string {
  return resolvePublicUrl({
    singlePublic: process.env.NEXT_PUBLIC_API_URL,
    devPublic: process.env.NEXT_PUBLIC_API_URL_DEV,
    prodPublic: process.env.NEXT_PUBLIC_API_URL_PROD,
    fallback: DEFAULT_API_ROOT,
  });
}

function optionalBase(
  serverKeys: { full?: string; dev?: string; prod?: string },
  browserKeys: { full?: string; dev?: string; prod?: string },
  derived: string
): { server: string; browser: string } {
  const server = resolveServerUrl({
    singleServer: serverKeys.full,
    singlePublic: browserKeys.full,
    devPublic: browserKeys.dev,
    prodPublic: browserKeys.prod,
    devServer: serverKeys.dev,
    prodServer: serverKeys.prod,
    fallback: derived,
  });
  const browser = resolvePublicUrl({
    singlePublic: browserKeys.full,
    devPublic: browserKeys.dev,
    prodPublic: browserKeys.prod,
    fallback: derived,
  });
  return { server: withTrailingSlash(server), browser: withTrailingSlash(browser) };
}

/** Sunucu: public API tabanı (…/public/) */
export function getPublicApiBaseServer(): string {
  const root = apiRootServer();
  const { server } = optionalBase(
    { full: process.env.API_PUBLIC_URL, dev: process.env.API_PUBLIC_URL_DEV, prod: process.env.API_PUBLIC_URL_PROD },
    {
      full: process.env.NEXT_PUBLIC_PUBLIC_API_URL,
      dev: process.env.NEXT_PUBLIC_PUBLIC_API_URL_DEV,
      prod: process.env.NEXT_PUBLIC_PUBLIC_API_URL_PROD,
    },
    `${root}/public`
  );
  return server;
}

/** İstemci: public API tabanı */
export function getPublicApiBaseBrowser(): string {
  if (typeof window === "undefined") return getPublicApiBaseServer();
  const root = apiRootBrowser();
  const { browser } = optionalBase(
    {},
    {
      full: process.env.NEXT_PUBLIC_PUBLIC_API_URL,
      dev: process.env.NEXT_PUBLIC_PUBLIC_API_URL_DEV,
      prod: process.env.NEXT_PUBLIC_PUBLIC_API_URL_PROD,
    },
    `${root}/public`
  );
  return browser;
}

/** Sunucu: üye API tabanı (…/user) */
export function getUserApiBaseServer(): string {
  const root = apiRootServer();
  const { server } = optionalBase(
    { full: process.env.API_USER_URL, dev: process.env.API_USER_URL_DEV, prod: process.env.API_USER_URL_PROD },
    {
      full: process.env.NEXT_PUBLIC_USER_API_URL,
      dev: process.env.NEXT_PUBLIC_USER_API_URL_DEV,
      prod: process.env.NEXT_PUBLIC_USER_API_URL_PROD,
    },
    `${root}/user`
  );
  return server;
}

/** İstemci: üye API tabanı */
export function getUserApiBaseBrowser(): string {
  if (typeof window === "undefined") return getUserApiBaseServer();
  const root = apiRootBrowser();
  const { browser } = optionalBase(
    {},
    {
      full: process.env.NEXT_PUBLIC_USER_API_URL,
      dev: process.env.NEXT_PUBLIC_USER_API_URL_DEV,
      prod: process.env.NEXT_PUBLIC_USER_API_URL_PROD,
    },
    `${root}/user`
  );
  return browser;
}

/** Ödeme / diğer — API köküne göre */
export function getPaymentApiBaseBrowser(): string {
  const root = apiRootBrowser();
  const url = resolvePublicUrl({
    singlePublic: process.env.NEXT_PUBLIC_PAYMENT_API_URL,
    devPublic: process.env.NEXT_PUBLIC_PAYMENT_API_URL_DEV,
    prodPublic: process.env.NEXT_PUBLIC_PAYMENT_API_URL_PROD,
    fallback: `${root}/`,
  });
  return withTrailingSlash(url);
}
