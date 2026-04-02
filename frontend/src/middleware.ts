import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { UPBILET_PATHNAME_HEADER } from "@/lib/locale-path";

const STATIC_ROOTS = new Set(["img", "icons", "profile", "generalicon", "admin"]);

/** Son segmentte nokta + uzantı (ör. .webmanifest, .svg) — rewrite edilmesin */
function hasFileExtension(pathname: string): boolean {
  return /\.[a-z0-9]{2,}$/i.test(pathname);
}

function nextWithPathname(request: NextRequest, pathname: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(UPBILET_PATHNAME_HEADER, pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }
  if (hasFileExtension(pathname)) {
    return nextWithPathname(request, pathname);
  }

  // Legacy /tr/... → canonical prefix-free Turkish URLs
  if (pathname === "/tr") {
    return NextResponse.redirect(new URL("/", request.url), 308);
  }
  if (pathname.startsWith("/tr/")) {
    const dest = pathname.slice(3) || "/";
    return NextResponse.redirect(new URL(dest, request.url), 308);
  }

  const first = pathname.split("/").filter(Boolean)[0];
  if (first && STATIC_ROOTS.has(first)) {
    return nextWithPathname(request, pathname);
  }

  // English stays /en/... (matches app/[locale] with locale=en)
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return nextWithPathname(request, pathname);
  }

  // Turkish (default): browser shows /foo, internally /tr/foo
  const internalPath = `/tr${pathname === "/" ? "" : pathname}`;
  const url = request.nextUrl.clone();
  url.pathname = internalPath;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(UPBILET_PATHNAME_HEADER, pathname);
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
