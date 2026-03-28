import Link from 'next/link';
import Table from '@/components/ui/Table';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { Listing, Sale, Member } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import EventListingsWithForm from './EventListingsWithForm';
import CopyableRef from '@/components/ui/CopyableRef';

function memberLabel(m: Member | string | undefined | null): string {
  if (m && typeof m === 'object' && 'name' in m) {
    return `${m.name} ${m.surname}`.trim();
  }
  if (typeof m === 'string' && m) return m;
  return '-';
}

interface Props {
  eventId: string;
  listings: Listing[];
  sales: Sale[];
  members: Member[];
  /** Etkinlikteki satıcı komisyonu (%); ilan formunda satıcı tutarı buna göre hesaplanır */
  sellerCommissionPercent: number;
}

export default function EventDetailLists({
  eventId,
  listings,
  sales,
  members,
  sellerCommissionPercent,
}: Props) {
  const saleColumns = [
    {
      key: 'refs',
      header: 'Referans / ID',
      className: 'align-top max-w-[14rem]',
      render: (row: Sale) => (
        <CopyableRef referenceCode={row.referenceCode} mongoId={row._id} compact />
      ),
    },
    {
      key: 'buyer',
      header: 'Alıcı',
      render: (row: Sale) => <span className="max-w-[140px] truncate block">{memberLabel(row.buyer)}</span>,
    },
    {
      key: 'seller',
      header: 'Satıcı',
      render: (row: Sale) => <span className="max-w-[140px] truncate block">{memberLabel(row.seller)}</span>,
    },
    {
      key: 'total',
      header: 'Tutar',
      render: (row: Sale) => <span className="font-medium">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'qty',
      header: 'Bilet',
      render: (row: Sale) => row.ticketQuantity,
    },
    {
      key: 'status',
      header: 'Durum',
      render: (row: Sale) => (
        <Badge label={row.status} variant={statusVariant[row.status] ?? 'gray'} />
      ),
    },
    {
      key: 'payment',
      header: 'Ödeme',
      render: (row: Sale) => (
        <Badge label={row.paymentStatus} variant={statusVariant[row.paymentStatus] ?? 'gray'} />
      ),
    },
    {
      key: 'deliveryStatus',
      header: 'deliveryStatus',
      render: (row: Sale) => (
        <Badge label={row.deliveryStatus} variant={statusVariant[row.deliveryStatus] ?? 'gray'} />
      ),
    },
    {
      key: 'date',
      header: 'Tarih',
      render: (row: Sale) => formatDateTime(row.saleDate),
    },
  ];

  return (
    <div className="space-y-10">
      <EventListingsWithForm
        eventId={eventId}
        listings={listings}
        members={members}
        sellerCommissionPercent={sellerCommissionPercent}
      />

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ShoppingCart className="h-5 w-5 shrink-0 text-emerald-600" />
            Satışlar
            <span className="text-sm font-normal text-gray-500">({sales.length})</span>
          </h2>
          <Link
            href={`/sales?eventId=${encodeURIComponent(eventId)}`}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Satışlar sayfasında aç →
          </Link>
        </div>
        <Table
          columns={saleColumns}
          data={sales}
          keyExtractor={(r) => r._id}
          emptyText="Bu etkinlik için satış yok."
        />
      </section>
    </div>
  );
}
