"use client";

import { getPublicApiBaseBrowser } from "@/lib/env";

function publicRoot(): string {
  return getPublicApiBaseBrowser().replace(/\/$/, "");
}

export type PublicEventTag = { _id: string; name?: string; tag?: string };

export type PublicEventById = {
  _id: string;
  name?: string;
  date?: string;
  location?: string;
  tags?: PublicEventTag[];
};

export async function fetchPublicEventById(eventId: string): Promise<PublicEventById | null> {
  const r = await fetch(`${publicRoot()}/events/${encodeURIComponent(eventId)}`);
  const data = (await r.json()) as { success?: boolean; event?: PublicEventById };
  if (!r.ok || !data.success || !data.event) return null;
  return data.event;
}

export type VenueBlock = { _id?: string; name?: string };
export type VenueCategory = { _id: string; name: string; blocks?: VenueBlock[] };

export type VenueStructurePayload = {
  categories?: VenueCategory[];
};

export async function fetchPublicVenueStructure(venueId: string): Promise<VenueStructurePayload | null> {
  const r = await fetch(`${publicRoot()}/events/venue-structure/${encodeURIComponent(venueId)}`);
  const data = (await r.json()) as { success?: boolean; venueStructure?: VenueStructurePayload };
  if (!r.ok || !data.success || !data.venueStructure) return null;
  return data.venueStructure;
}

export type PublicSearchEvent = {
  _id: string;
  name?: string;
  date?: string;
  location?: string;
  tags?: PublicEventTag[];
};

export async function searchPublicEvents(q: string): Promise<PublicSearchEvent[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const r = await fetch(`${publicRoot()}/events/search?q=${encodeURIComponent(trimmed)}`);
  const data = (await r.json()) as { success?: boolean; events?: PublicSearchEvent[] };
  if (!r.ok || !data.success || !Array.isArray(data.events)) return [];
  return data.events;
}
