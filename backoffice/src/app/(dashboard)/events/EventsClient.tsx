'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, Star, ToggleLeft, FileSearch, ImageIcon } from 'lucide-react';
import { formatDateTime, stripHtmlToPlainText, truncate } from '@/lib/utils';
import { eventService } from '@/services/event.service';
import { Event } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge, { statusVariant } from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EventFormModal from './EventFormModal';

interface Props {
  initialEvents: Event[];
}

const SEO_LIST_PREVIEW_CHARS = 18;

function seoPreview(value: string | undefined) {
  const t = value?.trim();
  if (!t) {
    return (
      <span className="flex min-h-5 items-center text-gray-400">—</span>
    );
  }
  return (
    <span className="flex min-h-5 max-w-30 items-center" title={t}>
      <span className="min-w-0 truncate text-gray-700">
        {truncate(t, SEO_LIST_PREVIEW_CHARS)}
      </span>
    </span>
  );
}

function descriptionCell(html: string | undefined) {
  const plain = stripHtmlToPlainText(html ?? '');
  return seoPreview(plain || undefined);
}

export default function EventsClient({ initialEvents }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refresh = useCallback(() => {
    router.refresh();
    setLoading(false);
  }, [router]);

  const handleToggleStatus = async (row: Event) => {
    const newStatus = row.status === 'active' ? 'inactive' : 'active';
    try {
      await eventService.toggleStatus(row._id, newStatus);
      toast.success('Durum güncellendi.');
      router.refresh();
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await eventService.delete(deleteTarget._id);
      toast.success('Etkinlik silindi.');
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

  const columns = [
    {
      key: 'image',
      header: '',
      className: 'w-[72px] max-w-[72px]',
      render: (row: Event) => (
        <div className="flex items-center justify-start py-0.5">
          {row.image ? (
            <img
              src={row.image}
              alt=""
              className="h-14 w-14 shrink-0 rounded-lg object-cover border border-gray-200 bg-gray-100"
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-300"
              title="Görsel yok"
            >
              <ImageIcon size={22} strokeWidth={1.25} />
            </div>
          )}
        </div>
      ),
    },
    { key: 'name', header: 'Etkinlik Adı', render: (row: Event) => (
      <div className="flex items-start gap-1.5 min-w-0 max-w-[240px]">
        {row.isMainPage && <Star size={13} className="text-yellow-400 fill-yellow-400 shrink-0 mt-0.5" />}
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{row.name}</p>
          {row.slug ? (
            <p className="mt-0.5 font-mono text-[11px] text-gray-400 truncate" title={row.slug}>
              /{row.slug}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-gray-300">—</p>
          )}
        </div>
      </div>
    )},
    { key: 'date', header: 'Tarih', render: (row: Event) => (
      <span className="text-sm whitespace-nowrap">{formatDateTime(row.date)}</span>
    )},
    { key: 'location', header: 'Konum', render: (row: Event) => (
      <span className="text-sm truncate max-w-[150px] block">{row.location}</span>
    )},
    {
      key: 'description',
      header: 'Açıklama',
      className: 'w-32 max-w-32 align-middle',
      render: (row: Event) => descriptionCell(row.description),
    },
    {
      key: 'metaTitle',
      header: 'Meta başlık',
      className: 'w-32 max-w-32 align-middle',
      render: (row: Event) => seoPreview(row.metaTitle),
    },
    {
      key: 'keywords',
      header: 'Anahtar',
      className: 'w-32 max-w-32 align-middle pr-15',
      render: (row: Event) => seoPreview(row.keywords),
    },
    {
      key: 'metaDescription',
      header: 'Meta açıklama',
      className: 'w-32 max-w-32 align-middle pl-4',
      render: (row: Event) => seoPreview(row.metaDescription),
    },
    { key: 'status', header: 'Durum', render: (row: Event) => (
      <Badge label={row.status} variant={statusVariant[row.status]} />
    )},
    { key: 'actions', header: 'İşlemler', render: (row: Event) => (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/events/${row._id}`}
          className="inline-flex h-8 min-w-[88px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        >
          <FileSearch size={14} className="shrink-0" />
          İncele
        </Link>
        <Button
          size="sm"
          variant="outline"
          className="h-8 min-w-[88px] justify-center"
          icon={<Pencil size={14} />}
          onClick={() => { setEditItem(row); setFormOpen(true); }}
        >
          Düzenle
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 min-w-[88px] justify-center"
          icon={<ToggleLeft size={14} />}
          onClick={() => handleToggleStatus(row)}
        >
          Durum
        </Button>
        <Button
          size="sm"
          variant="dangerOutline"
          className="h-8 min-w-[88px] justify-center"
          icon={<Trash2 size={14} />}
          onClick={() => setDeleteTarget(row)}
        >
          Sil
        </Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Etkinlikler"
        description={`Toplam ${initialEvents.length} etkinlik`}
        action={
          <Button icon={<Plus size={16} />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
            Etkinlik Ekle
          </Button>
        }
      />

      <Table
        columns={columns}
        data={initialEvents}
        loading={loading}
        keyExtractor={(r) => r._id}
        emptyText="Henüz etkinlik bulunmuyor."
      />

      <EventFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        onSuccess={refresh}
        editItem={editItem}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Etkinliği Sil"
        description={`"${deleteTarget?.name}" etkinliğini silmek istediğinize emin misiniz?`}
        confirmLabel="Sil"
      />
    </div>
  );
}
