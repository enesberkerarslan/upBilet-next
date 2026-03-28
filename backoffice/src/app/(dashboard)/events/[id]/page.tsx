import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-fetch';
import { Event, Listing, Member, Sale } from '@/types';
import { formatDateTime } from '@/lib/utils';
import Badge, { statusVariant } from '@/components/ui/Badge';
import EventDetailLists from './EventDetailLists';

type PageProps = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  let event: Event;
  try {
    event = await serverFetch<Event>(`/events/get-event-by-id/${id}`);
  } catch {
    notFound();
  }

  let listings: Listing[] = [];
  try {
    const list = await serverFetch<Listing[]>(`/listings/get-listings-by-event/${id}`);
    listings = Array.isArray(list) ? list : [];
  } catch {
    listings = [];
  }

  let sales: Sale[] = [];
  try {
    const wrapped = await serverFetch<{ success?: boolean; data?: Sale[] }>(
      `/sales/filter/event?eventId=${encodeURIComponent(id)}`
    );
    sales = Array.isArray(wrapped?.data) ? wrapped.data : [];
  } catch {
    sales = [];
  }

  let members: Member[] = [];
  try {
    const res = await serverFetch<{ data?: Member[] }>('/members/get-all-members');
    members = res.data ?? [];
  } catch {
    members = [];
  }

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link href="/events" className="font-medium text-indigo-600 hover:underline">
          ← Etkinliklere dön
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            <p className="mt-2 text-gray-600">
              <span className="whitespace-nowrap">{formatDateTime(event.date)}</span>
              <span className="mx-2 text-gray-300">·</span>
              <span>{event.location}</span>
            </p>
            {event.slug && (
              <p className="mt-1 text-xs text-gray-400">/{event.slug}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {event.isMainPage && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Anasayfa
              </span>
            )}
            <Badge label={event.status} variant={statusVariant[event.status] ?? 'gray'} />
          </div>
        </div>
        {event.description ? (
          <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-700">{event.description}</p>
        ) : null}
      </div>

      <EventDetailLists
        eventId={id}
        listings={listings}
        sales={sales}
        members={members}
        sellerCommissionPercent={event.commission}
      />
    </div>
  );
}
