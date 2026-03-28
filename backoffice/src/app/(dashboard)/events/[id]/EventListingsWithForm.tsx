'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Ticket, Pencil, Copy, ToggleLeft, Trash2, FlaskConical } from 'lucide-react';
import Table from '@/components/ui/Table';
import Badge, { statusVariant } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { listingService } from '@/services/listing.service';
import { Listing, Member } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { buildDuplicateListingPayload, sellerNetFromListPrice } from '@/lib/listing-duplicate';
import EventListingFormModal from './EventListingFormModal';
import TestSaleModal from './TestSaleModal';
import CopyableRef from '@/components/ui/CopyableRef';

function memberLabel(m: Member | string | undefined | null): string {
  if (m && typeof m === 'object' && 'name' in m) {
    return `${m.name} ${m.surname}`.trim();
  }
  if (typeof m === 'string' && m) return m;
  return '-';
}

function ListingPriceInput({
  listing,
  sellerCommissionPercent,
  onUpdated,
}: {
  listing: Listing;
  sellerCommissionPercent: number;
  onUpdated: () => void;
}) {
  const [value, setValue] = useState(() =>
    listing.price != null ? String(listing.price) : ''
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(listing.price != null ? String(listing.price) : '');
  }, [listing._id, listing.price]);

  const resetToServer = () => {
    setValue(listing.price != null ? String(listing.price) : '');
  };

  const commit = async () => {
    const raw = value.replace(',', '.').trim();
    if (raw === '') {
      toast.error('Fiyat boş olamaz.');
      resetToServer();
      return;
    }
    const p = parseFloat(raw);
    if (Number.isNaN(p) || p < 0) {
      toast.error('Geçerli bir fiyat girin.');
      resetToServer();
      return;
    }
    const prev = Number(listing.price);
    if (Number.isFinite(prev) && Math.round(p * 100) === Math.round(prev * 100)) {
      return;
    }
    const s = sellerNetFromListPrice(p, sellerCommissionPercent);
    if (!Number.isFinite(s) || s < 0) {
      toast.error('Satıcı tutarı hesaplanamadı.');
      resetToServer();
      return;
    }
    setSaving(true);
    try {
      await listingService.update(listing._id, { price: p, sellerAmount: s });
      toast.success('Liste fiyatı güncellendi.');
      onUpdated();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg ?? 'Fiyat güncellenemedi.');
      resetToServer();
    } finally {
      setSaving(false);
    }
  };

  return (
    <input
      type="number"
      inputMode="decimal"
      step="0.01"
      min={0}
      disabled={saving}
      aria-label="Liste fiyatı (TRY)"
      title="Değiştirdikten sonra Enter veya başka alana tıklayın"
      className="h-9 w-29 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

interface Props {
  eventId: string;
  listings: Listing[];
  members: Member[];
  sellerCommissionPercent: number;
}

export default function EventListingsWithForm({ eventId, listings, members, sellerCommissionPercent }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [testListing, setTestListing] = useState<Listing | null>(null);

  const closeModal = () => {
    setFormOpen(false);
    setEditListing(null);
  };

  const openCreate = () => {
    setEditListing(null);
    setFormOpen(true);
  };

  const openEdit = (row: Listing) => {
    setEditListing(row);
    setFormOpen(true);
  };

  const handleToggle = async (id: string) => {
    try {
      await listingService.toggleStatus(id);
      toast.success('Durum güncellendi.');
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg ?? 'İşlem başarısız.');
    }
  };

  const handleCopy = async (row: Listing) => {
    setCopyingId(row._id);
    try {
      const payload = buildDuplicateListingPayload(row, eventId, sellerCommissionPercent);
      await listingService.create(payload);
      toast.success('İlan kopyalandı (yeni kayıt).');
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg ?? 'Kopyalanamadı.');
    } finally {
      setCopyingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await listingService.delete(deleteTarget._id);
      toast.success('İlan silindi.');
      setDeleteTarget(null);
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg ?? 'Silinemedi.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const listingColumns = [
    {
      key: 'refs',
      header: 'Referans / ID',
      className: 'align-top max-w-[14rem]',
      render: (row: Listing) => (
        <CopyableRef referenceCode={row.referenceCode} mongoId={row._id} compact />
      ),
    },
    {
      key: 'member',
      header: 'Satıcı',
      render: (row: Listing) => <span className="whitespace-nowrap">{memberLabel(row.memberId)}</span>,
    },
    {
      key: 'price',
      header: 'Liste fiyatı',
      className: 'align-middle',
      render: (row: Listing) => (
        <ListingPriceInput
          listing={row}
          sellerCommissionPercent={sellerCommissionPercent}
          onUpdated={() => router.refresh()}
        />
      ),
    },
    {
      key: 'sellerAmount',
      header: 'Satıcıya kalan',
      render: (row: Listing) => {
        let s = row.sellerAmount;
        if (s == null || !Number.isFinite(Number(s))) {
          const p = Number(row.price);
          const c = Math.min(100, Math.max(0, Number(sellerCommissionPercent) || 0));
          s = Math.round(((p * (100 - c)) / 100) * 100) / 100;
        }
        return <span className="whitespace-nowrap">{formatCurrency(Number(s))}</span>;
      },
    },
    {
      key: 'qty',
      header: 'Adet',
      render: (row: Listing) => `${row.soldQuantity}/${row.quantity}`,
    },
    {
      key: 'ticketType',
      header: 'Tür',
      render: (row: Listing) => <Badge label={row.ticketType} variant="blue" />,
    },
    {
      key: 'status',
      header: 'Durum',
      render: (row: Listing) => (
        <Badge label={row.status} variant={statusVariant[row.status] ?? 'gray'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Oluşturulma',
      render: (row: Listing) => (
        <span className="whitespace-nowrap text-gray-700">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Düzenlenme',
      render: (row: Listing) => (
        <span className="whitespace-nowrap text-gray-700">
          {row.updatedAt ? formatDateTime(row.updatedAt) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (row: Listing) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 min-w-0 justify-center gap-1 px-2"
            icon={<FlaskConical size={14} />}
            onClick={() => setTestListing(row)}
            disabled={row.status !== 'active' || (row.quantity ?? 0) - (row.soldQuantity ?? 0) < 1}
            title={
              row.status !== 'active'
                ? 'Sadece aktif ilanlarda test satışı'
                : (row.quantity ?? 0) - (row.soldQuantity ?? 0) < 1
                  ? 'Kontenjan yok'
                  : 'Ödeme olmadan test satışı oluştur'
            }
          >
            Test satış
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 min-w-0 justify-center gap-1 px-2"
            icon={<Pencil size={14} />}
            onClick={() => openEdit(row)}
          >
            Düzenle
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 min-w-0 justify-center gap-1 px-2"
            icon={<Copy size={14} />}
            onClick={() => handleCopy(row)}
            loading={copyingId === row._id}
            disabled={copyingId !== null}
          >
            Kopyala
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 min-w-0 justify-center gap-1 px-2"
            icon={<ToggleLeft size={14} />}
            onClick={() => handleToggle(row._id)}
          >
            Durum
          </Button>
          <Button
            size="sm"
            variant="dangerOutline"
            className="h-8 min-w-0 justify-center gap-1 px-2"
            icon={<Trash2 size={14} />}
            onClick={() => setDeleteTarget(row)}
            disabled={(row.soldQuantity ?? 0) > 0}
            title={
              (row.soldQuantity ?? 0) > 0
                ? 'Satılmış bilet varken ilan silinemez'
                : 'İlanı sil'
            }
          >
            Sil
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Ticket className="h-5 w-5 shrink-0 text-indigo-600" />
          İlanlar
          <span className="text-sm font-normal text-gray-500">({listings.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>
            İlan ekle
          </Button>
          <Link
            href={`/listings?eventId=${encodeURIComponent(eventId)}`}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            İlanlar sayfasında aç →
          </Link>
        </div>
      </div>
      <Table
        columns={listingColumns}
        data={listings}
        keyExtractor={(r) => r._id}
        emptyText="Bu etkinlik için ilan yok. İlan ekleyerek başlayın."
        maxHeightClass={listings.length > 10 ? 'max-h-[31rem]' : undefined}
      />

      <EventListingFormModal
        open={formOpen}
        onClose={closeModal}
        eventId={eventId}
        members={members}
        sellerCommissionPercent={sellerCommissionPercent}
        listingToEdit={editListing}
        onSuccess={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="İlanı sil"
        description="Bu ilanı kalıcı olarak silmek istediğinize emin misiniz?"
        confirmLabel="Sil"
      />

      <TestSaleModal
        open={!!testListing}
        onClose={() => setTestListing(null)}
        listing={testListing}
        members={members}
        onSuccess={() => router.refresh()}
      />
    </section>
  );
}
