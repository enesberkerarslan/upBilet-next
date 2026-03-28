'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Trash2, ToggleLeft, X, Copy, Pencil } from 'lucide-react';
import { listingService } from '@/services/listing.service';
import { eventService } from '@/services/event.service';
import { buildDuplicateListingPayload, listingEventId } from '@/lib/listing-duplicate';
import { Listing, Event, Member } from '@/types';
import EventListingFormModal from '@/app/(dashboard)/events/[id]/EventListingFormModal';
import { formatDate, formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge, { statusVariant } from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CopyableRef from '@/components/ui/CopyableRef';
import Input from '@/components/ui/Input';

function sellerCommissionForListing(row: Listing): number {
  const ev = row.eventId;
  if (ev && typeof ev === 'object' && 'commission' in ev) {
    return Number((ev as Event).commission) || 0;
  }
  return 0;
}

/** Tabloda yalnızca satıcı e-postası; yoksa — */
function sellerEmail(row: Listing, memberById: Map<string, Member>): string {
  const mid = row.memberId;
  if (mid && typeof mid === 'object') {
    const e = (mid as Member).email?.trim();
    return e || '—';
  }
  const id = typeof mid === 'string' ? mid : null;
  if (id) {
    const e = memberById.get(id)?.email?.trim();
    return e || '—';
  }
  return '—';
}

function sellerSearchText(row: Listing, memberById: Map<string, Member>): string {
  const email = sellerEmail(row, memberById);
  const mid = row.memberId;
  let nameParts = '';
  if (mid && typeof mid === 'object') {
    nameParts = `${(mid as Member).name} ${(mid as Member).surname}`;
  } else if (typeof mid === 'string') {
    const m = memberById.get(mid);
    if (m) nameParts = `${m.name} ${m.surname}`;
  }
  return `${email} ${nameParts} ${row.referenceCode ?? ''} ${row._id}`.toLowerCase();
}

interface ListingsClientProps {
  initialListings: Listing[];
  filterEventId?: string;
  filterEventName?: string;
  members: Member[];
}

export default function ListingsClient({
  initialListings,
  filterEventId,
  filterEventName,
  members,
}: ListingsClientProps) {
  const router = useRouter();
  const memberById = useMemo(() => {
    const m = new Map<string, Member>();
    for (const mem of members) {
      m.set(mem._id, mem);
    }
    return m;
  }, [members]);

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);

  const closeEditModal = () => {
    setFormOpen(false);
    setEditListing(null);
  };

  const openEdit = (row: Listing) => {
    const eid = listingEventId(row);
    if (!eid) {
      toast.error('Etkinlik bilgisi eksik; düzenlenemiyor.');
      return;
    }
    setEditListing(row);
    setFormOpen(true);
  };

  const handleToggle = async (id: string) => {
    try {
      await listingService.toggleStatus(id);
      toast.success('Durum güncellendi.');
      router.refresh();
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const handleCopy = async (row: Listing) => {
    setCopyingId(row._id);
    try {
      const eid = listingEventId(row);
      let merged: Listing = row;
      let commission: number | undefined;
      if (row.sellerAmount == null || Number.isNaN(Number(row.sellerAmount))) {
        const [full, ev] = await Promise.all([
          listingService.getById(row._id),
          eventService.getById(eid),
        ]);
        merged = { ...row, ...(full as Listing) };
        commission = (ev as { commission?: number }).commission;
      }
      const payload = buildDuplicateListingPayload(merged, eid, commission);
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
    } catch {
      toast.error('Silinemedi.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = initialListings.filter((l) => {
    const event = typeof l.eventId === 'object' ? (l.eventId as Event).name : '';
    const q = search.toLowerCase();
    return (
      event.toLowerCase().includes(q) || sellerSearchText(l, memberById).includes(q)
    );
  });

  const columns = [
    {
      key: 'refs',
      header: 'Referans / ID',
      className: 'align-top max-w-[14rem]',
      render: (row: Listing) => (
        <CopyableRef referenceCode={row.referenceCode} mongoId={row._id} compact />
      ),
    },
    { key: 'event', header: 'Etkinlik', render: (row: Listing) => (
      <span className="text-sm font-medium">{typeof row.eventId === 'object' ? (row.eventId as Event).name : row.eventId}</span>
    )},
    {
      key: 'member',
      header: 'Satıcı',
      render: (row: Listing) => (
        <span className="text-sm break-all">{sellerEmail(row, memberById)}</span>
      ),
    },
    { key: 'price', header: 'Fiyat', render: (row: Listing) => <span className="font-medium">{formatCurrency(row.price)}</span> },
    { key: 'qty', header: 'Adet', render: (row: Listing) => `${row.soldQuantity}/${row.quantity}` },
    { key: 'ticketType', header: 'Tür', render: (row: Listing) => <Badge label={row.ticketType} variant="blue" /> },
    { key: 'status', header: 'Durum', render: (row: Listing) => <Badge label={row.status} variant={statusVariant[row.status]} /> },
    { key: 'createdAt', header: 'Tarih', render: (row: Listing) => formatDate(row.createdAt) },
    { key: 'actions', header: 'İşlemler', render: (row: Listing) => (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 min-w-[88px] justify-center"
          icon={<Pencil size={14} />}
          onClick={() => openEdit(row)}
          disabled={!listingEventId(row)}
        >
          Düzenle
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 min-w-[88px] justify-center"
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
          className="h-8 min-w-[88px] justify-center"
          icon={<ToggleLeft size={14} />}
          onClick={() => handleToggle(row._id)}
        >
          Durum
        </Button>
        <Button
          size="sm"
          variant="dangerOutline"
          className="h-8 min-w-[88px] justify-center"
          icon={<Trash2 size={14} />}
          onClick={() => setDeleteTarget(row)}
          disabled={(row.soldQuantity ?? 0) > 0}
          title={
            (row.soldQuantity ?? 0) > 0 ? 'Satılmış bilet varken ilan silinemez' : 'İlanı sil'
          }
        >
          Sil
        </Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="İlanlar" description={`Toplam ${initialListings.length} ilan`} />
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
            href="/listings"
            className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:underline"
          >
            <X size={14} />
            Filtreyi kaldır
          </Link>
        </div>
      )}
      <div className="mb-4">
        <Input
          placeholder="Etkinlik, satıcı e-posta veya ad…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <Table columns={columns} data={filtered} keyExtractor={(r) => r._id} emptyText="İlan bulunamadı." />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="İlanı Sil" description="Bu ilanı kalıcı olarak silmek istediğinize emin misiniz?" confirmLabel="Sil" />

      {editListing && listingEventId(editListing) ? (
        <EventListingFormModal
          open={formOpen}
          onClose={closeEditModal}
          eventId={listingEventId(editListing)}
          members={members}
          sellerCommissionPercent={sellerCommissionForListing(editListing)}
          listingToEdit={editListing}
          onSuccess={() => {
            closeEditModal();
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
