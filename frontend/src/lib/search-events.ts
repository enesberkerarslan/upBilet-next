import { getPublicApiBaseBrowser } from "@/lib/env";
import type { PublicEvent } from "@/types/event";

export async function searchEventsClient(query: string): Promise<PublicEvent[]> {
  const base = getPublicApiBaseBrowser();
  const res = await fetch(`${base}events/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.events || [];
}
