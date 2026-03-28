import { serverFetch } from '@/lib/server-fetch';
import { Event, Sale } from '@/types';
import SalesClient from './SalesClient';

type Props = { searchParams: Promise<{ eventId?: string }> };

export default async function SalesPage({ searchParams }: Props) {
  const { eventId } = await searchParams;
  const path = eventId
    ? `/sales/filter/event?eventId=${encodeURIComponent(eventId)}`
    : '/sales';

  let sales: Sale[] = [];
  try {
    const res = await serverFetch<{ data?: Sale[] }>(path);
    sales = res.data ?? [];
  } catch {
    sales = [];
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

  return (
    <SalesClient
      initialSales={sales}
      filterEventId={eventId}
      filterEventName={filterEventName}
    />
  );
}
