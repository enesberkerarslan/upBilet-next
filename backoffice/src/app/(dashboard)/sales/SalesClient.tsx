'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, X } from 'lucide-react';
import { Sale, Event, Member } from '@/types';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge, { statusVariant } from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import SaleDetailModal from './SaleDetailModal';
import CopyableRef from '@/components/ui/CopyableRef';
import { saleService } from '@/services/sale.service';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'pending_approval', label: 'Onay Bekliyor' },
  { value: 'approved', label: 'Onaylandı' },
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
];

interface SalesClientProps {
  initialSales: Sale[];
  filterEventId?: string;
  filterEventName?: string;
}

export default function SalesClient({
  initialSales,
  filterEventId,
  filterEventName,
}: SalesClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [detailItem, setDetailItem] = useState<Sale | null>(null);

  const filtered = statusFilter
    ? initialSales.filter((s) => s.status === statusFilter)
    : initialSales;

  const openSaleDetail = async (row: Sale) => {
    try {
      const res = (await saleService.getById(row._id)) as { data?: Sale };
      setDetailItem(res?.data ?? row);
    } catch {
      setDetailItem(row);
    }
  };

  const columns = [
    {
      key: 'refs',
      header: 'Referans / ID',
      className: 'align-top max-w-[14rem]',
      render: (row: Sale) => (
        <CopyableRef referenceCode={row.referenceCode} mongoId={row._id} compact />
      ),
    },
    { key: 'event', header: 'Etkinlik', render: (row: Sale) => (
      <span className="text-sm font-medium max-w-[160px] block truncate">
        {typeof row.eventId === 'object' ? (row.eventId as Event).name : row.eventId}
      </span>
    )},
    { key: 'buyer', header: 'Alıcı', render: (row: Sale) => (
      <span className="text-sm">{typeof row.buyer === 'object' ? `${(row.buyer as Member).name} ${(row.buyer as Member).surname}` : row.buyer}</span>
    )},
    { key: 'seller', header: 'Satıcı', render: (row: Sale) => (
      <span className="text-sm">{typeof row.seller === 'object' ? `${(row.seller as Member).name} ${(row.seller as Member).surname}` : row.seller}</span>
    )},
    { key: 'totalAmount', header: 'Tutar', render: (row: Sale) => <span className="font-semibold">{formatCurrency(row.totalAmount)}</span> },
    { key: 'ticketQuantity', header: 'Bilet', render: (row: Sale) => row.ticketQuantity },
    { key: 'status', header: 'Durum', render: (row: Sale) => <Badge label={row.status} variant={statusVariant[row.status]} /> },
    { key: 'paymentStatus', header: 'Ödeme', render: (row: Sale) => <Badge label={row.paymentStatus} variant={statusVariant[row.paymentStatus]} /> },
    {
      key: 'deliveryStatus',
      header: 'deliveryStatus',
      render: (row: Sale) => (
        <Badge label={row.deliveryStatus} variant={statusVariant[row.deliveryStatus] ?? 'gray'} />
      ),
    },
    { key: 'saleDate', header: 'Tarih', render: (row: Sale) => formatDateTime(row.saleDate) },
    { key: 'actions', header: '', render: (row: Sale) => (
      <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => void openSaleDetail(row)}>Detay</Button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Satışlar" description={`Toplam ${initialSales.length} satış`} />
      {filterEventId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm">
          <span className="text-indigo-900">
            Etkinlik filtresi
            {filterEventName ? (
              <strong className="ml-1">{filterEventName}</strong>
            ) : (
              <code className="ml-1 rounded bg-white/80 px-1.5 py-0.5 text-xs">{filterEventId}</code>
            )}
          </span>
          <Link
            href="/sales"
            className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:underline"
          >
            <X size={14} />
            Filtreyi kaldır
          </Link>
        </div>
      )}
      <div className="mb-4">
        <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[200px]" placeholder="Durum filtrele" />
      </div>
      <Table columns={columns} data={filtered} keyExtractor={(r) => r._id} emptyText="Satış bulunamadı." />
      {detailItem && (
        <SaleDetailModal
          sale={detailItem}
          open={!!detailItem}
          onClose={() => setDetailItem(null)}
          onRefresh={async () => {
            router.refresh();
            try {
              const res = (await saleService.getById(detailItem._id)) as { data?: Sale };
              if (res?.data) setDetailItem(res.data);
            } catch {
              /* liste yenilendi; detay açık kalır */
            }
          }}
        />
      )}
    </div>
  );
}
