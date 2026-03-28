import { serverFetch } from '@/lib/server-fetch';
import { Event, Listing, Member } from '@/types';
import ListingsClient from './ListingsClient';

type Props = { searchParams: Promise<{ eventId?: string }> };

export default async function ListingsPage({ searchParams }: Props) {
  const { eventId } = await searchParams;
  const path = eventId
    ? `/listings/get-all-listings?eventId=${encodeURIComponent(eventId)}`
    : '/listings/get-all-listings';

  let listings: Listing[] = [];
  try {
    listings = await serverFetch<Listing[]>(path);
    if (!Array.isArray(listings)) listings = [];
  } catch {
    listings = [];
  }

  let filterEventName: string | undefined;
  if (eventId) {
    try {
      const ev = await serverFetch<Event>(`/events/get-event-by-id/${eventId}`);
      filterEventName = ev.name;
    } catch {
      filterEventName = undefined;
    }
  }

  let members: Member[] = [];
  try {
    const res = await serverFetch<{ data?: Member[] }>('/members/get-all-members');
    members = res.data ?? [];
  } catch {
    members = [];
  }

  return (
    <ListingsClient
      initialListings={listings}
      filterEventId={eventId}
      filterEventName={filterEventName}
      members={members}
    />
  );
}
