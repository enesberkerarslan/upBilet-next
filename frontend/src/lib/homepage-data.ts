import { getPublicApiBaseServer } from "@/lib/env";

export type HomepagePayload = {
  success: boolean;
  football: { events?: unknown[] } | null;
  concert: { events?: unknown[] } | null;
  footballResponse: { events?: unknown[] } | null;
  homepage: {
    hero?: Record<string, string | undefined>;
    banners?: { imageUrl?: string; label?: string; link?: string }[];
  } | null;
  error?: string;
};

const noStore: RequestInit = { cache: "no-store" };

async function fetchJsonOk(url: string, init?: RequestInit): Promise<unknown | null> {
  try {
    const r = await fetch(url, { ...noStore, ...init });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function fetchHomepageData(): Promise<HomepagePayload> {
  const base = getPublicApiBaseServer();

  try {
    const [footballMainPage, concert, footballResponse, homepageRes] = await Promise.all([
      fetchJsonOk(`${base}events/mainpage/tag/Futbol/mainpage`),
      fetchJsonOk(`${base}events/mainpage/tag/Konser/mainpage`),
      fetchJsonOk(`${base}events/mainpage/tag/Futbol`),
      // CMS anasayfa: panelden kayıt sonrası eski boş yanıtı 60 sn cache’ten vermesin
      fetchJsonOk(`${base}homepage`),
    ]);

    const raw = homepageRes as Record<string, unknown> | null;
    const homepage =
      (raw?.homepage as HomepagePayload["homepage"]) ||
      (raw?.body as { homepage?: HomepagePayload["homepage"] } | undefined)?.homepage ||
      null;

    const anyBlock =
      footballMainPage != null ||
      concert != null ||
      footballResponse != null ||
      homepage != null;

    return {
      success: anyBlock,
      football: (footballMainPage as HomepagePayload["football"]) ?? null,
      concert: (concert as HomepagePayload["concert"]) ?? null,
      footballResponse: (footballResponse as HomepagePayload["footballResponse"]) ?? null,
      homepage,
    };
  } catch (e) {
    console.error("Homepage fetch error:", e);
    return {
      success: false,
      football: null,
      concert: null,
      footballResponse: null,
      homepage: null,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
