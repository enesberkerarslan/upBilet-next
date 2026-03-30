import { cookies } from "next/headers";
import { getUserApiBaseServer } from "@/lib/env";

function bearerFromCookieValue(raw: string): string {
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  return decoded.startsWith("Bearer ") ? decoded : `Bearer ${decoded}`;
}

export async function getMemberBearerFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get("token")?.value;
  if (!raw?.trim()) return null;
  return bearerFromCookieValue(raw);
}

export async function memberFetchServer<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const auth = await getMemberBearerFromCookies();
  if (!auth) return { ok: false, status: 401, data: null };

  const base = getUserApiBaseServer().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: auth,
      ...(init?.headers as Record<string, string>),
    },
    cache: "no-store",
  });

  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
}
