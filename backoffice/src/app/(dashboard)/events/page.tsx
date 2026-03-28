import { serverFetch } from '@/lib/server-fetch';
import { Event } from '@/types';
import EventsClient from './EventsClient';

export default async function EventsPage() {
  let events: Event[] = [];
  try {
    // getAllEvents direkt array döndürüyor (wrapper yok)
    events = await serverFetch<Event[]>('/events/get-all-events');
    if (!Array.isArray(events)) events = [];
  } catch {
    events = [];
  }

  return <EventsClient initialEvents={events} />;
}
