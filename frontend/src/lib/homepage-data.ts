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

/**
 * Anasayfa bundle herkese aynı. Next dev bazen aynı navigasyonda ardışık/paralel birden fazla SSR turu çalıştırıyor.
 * - Paralel: `inflight` tek `fetch`.
 * - İlki bitip ikincisi hemen sonra: kısa süreli `recent` ile ikinci kez backend’e gitme.
 */
const RECENT_REUSE_MS = 500;
let homepageBundleInflight: Promise<HomepagePayload> | null = null;
let recentPayload: HomepagePayload | null = null;
let recentResolvedAt = 0;

async function fetchHomepageBundleJson(): Promise<unknown | null> {
  try {
    const base = getPublicApiBaseServer();
    const r = await fetch(`${base}homepage/bundle`, { ...noStore });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function loadHomepageDataOnce(): Promise<HomepagePayload> {
  try {
    const raw = await fetchHomepageBundleJson();
    if (!raw || typeof raw !== "object") {
      return {
        success: false,
        football: null,
        concert: null,
        footballResponse: null,
        homepage: null,
      };
    }

    const o = raw as Record<string, unknown>;
    const homepage =
      (o.homepage as HomepagePayload["homepage"]) ||
      (o.body as { homepage?: HomepagePayload["homepage"] } | undefined)?.homepage ||
      null;

    const football = (o.football as HomepagePayload["football"]) ?? null;
    const concert = (o.concert as HomepagePayload["concert"]) ?? null;
    const footballResponse = (o.footballResponse as HomepagePayload["footballResponse"]) ?? null;

    return {
      success: o.success === true,
      football,
      concert,
      footballResponse,
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

export function fetchHomepageData(): Promise<HomepagePayload> {
  const now = Date.now();
  if (recentPayload !== null && now - recentResolvedAt < RECENT_REUSE_MS) {
    return Promise.resolve(recentPayload);
  }
  if (!homepageBundleInflight) {
    homepageBundleInflight = loadHomepageDataOnce()
      .then((p) => {
        recentPayload = p;
        recentResolvedAt = Date.now();
        return p;
      })
      .finally(() => {
        homepageBundleInflight = null;
      });
  }
  return homepageBundleInflight;
}
