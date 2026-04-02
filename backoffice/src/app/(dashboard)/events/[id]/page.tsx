import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Tags } from 'lucide-react';
import { serverFetch } from '@/lib/server-fetch';
import { Event, Listing, Member, Sale, Tag } from '@/types';
import { formatDateTime } from '@/lib/utils';
import Badge, { statusVariant } from '@/components/ui/Badge';
import EventDetailLists from './EventDetailLists';

type PageProps = { params: Promise<{ id: string }> };

const TAG_TYPE_LABELS: Record<Tag['tag'], string> = {
  FutbolTakımı: 'Futbol takımı',
  BasketbolTakımı: 'Basketbol takımı',
  Sanatçı: 'Sanatçı',
  GenelTag: 'Genel tag',
  EtkinlikAlanı: 'Etkinlik alanı',
  AltTag: 'Alt tag',
};

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

  const venueTag = event.tags?.find((t) => t.tag === 'EtkinlikAlanı');
  const venueTagId = venueTag?._id ?? null;

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

        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Tags className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
              Bağlı etiketler
              {event.tags?.length != null ? (
                <span className="font-normal text-gray-500">({event.tags.length})</span>
              ) : null}
            </h2>
            <Link
              href="/tags"
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              Etiketleri yönet →
            </Link>
          </div>
          {!event.tags || event.tags.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Bu etkinliğe henüz etiket eklenmemiş.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-100 bg-gray-50/80">
              {event.tags.map((t) => (
                <li
                  key={t._id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="min-w-0 font-medium text-gray-900">{t.name}</span>
                  {t.tag ? (
                    <Badge label={TAG_TYPE_LABELS[t.tag] ?? t.tag} variant="gray" />
                  ) : null}
                  {t.slug ? (
                    <span className="text-xs text-gray-500 tabular-nums" title="Slug">
                      /{t.slug}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <EventDetailLists
        eventId={id}
        listings={listings}
        sales={sales}
        members={members}
        sellerCommissionPercent={event.commission}
        venueTagId={venueTagId}
      />
    </div>
  );
}
