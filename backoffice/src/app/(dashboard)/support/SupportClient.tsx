'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Send } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import AdminNewSupportTopicModal from './AdminNewSupportTopicModal';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { formatDateTime } from '@/lib/utils';
import type { SupportTopicListItem } from '@/types';
import { supportService } from '@/services/support.service';
import CopyableRef from '@/components/ui/CopyableRef';

const STATUS_FILTER = [
  { value: 'all', label: 'Tümü' },
  { value: 'open', label: 'Açık' },
  { value: 'closed', label: 'Kapalı' },
];

interface Props {
  initialItems: SupportTopicListItem[];
  initialPagination: { page: number; limit: number; total: number; totalPages: number };
}

function memberLabel(m: SupportTopicListItem['memberId']) {
  if (m && typeof m === 'object' && 'email' in m) {
    const x = m as { name?: string; surname?: string; email?: string };
    const n = [x.name, x.surname].filter(Boolean).join(' ');
    return n || x.email || '—';
  }
  return '—';
}

function saleRefCell(row: SupportTopicListItem) {
  const ref = row.referenceSaleId;
  if (ref == null || ref === '') {
    return <span className="text-xs text-gray-400">—</span>;
  }
  if (typeof ref === 'object' && '_id' in ref) {
    const s = ref as { _id: string; referenceCode?: string };
    return <CopyableRef referenceCode={s.referenceCode} mongoId={s._id} compact />;
  }
  const id = String(ref);
  return (
    <span className="font-mono text-[11px] text-gray-600 max-w-[140px] truncate block" title={id}>
      {id}
    </span>
  );
}

export default function SupportClient({ initialItems, initialPagination }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState('all');
  const [items, setItems] = useState(initialItems);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [newTopicOpen, setNewTopicOpen] = useState(false);

  const load = async (st: string) => {
    setLoading(true);
    try {
      const payload = await supportService.listTopics({
        status: st === 'all' ? undefined : st,
        page: 1,
        limit: 50,
      });
      setItems(payload.items ?? []);
      if (payload.pagination) setPagination(payload.pagination);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onFilterChange = (v: string) => {
    setStatus(v);
    void load(v);
  };

  const columns = [
    {
      key: 'subject',
      header: 'Konu',
      render: (row: SupportTopicListItem) => (
        <div className="flex flex-col gap-0.5 max-w-md">
          <Link
            href={`/support/${row._id}`}
            className="text-sm font-semibold text-indigo-700 hover:underline truncate"
          >
            {row.subject}
          </Link>
          {row.unreadForAdmin && (
            <span className="text-[11px] font-medium text-amber-700">Okunmamış</span>
          )}
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Üye',
      render: (row: SupportTopicListItem) => (
        <span className="text-sm text-gray-800">{memberLabel(row.memberId)}</span>
      ),
    },
    {
      key: 'referenceSaleId',
      header: 'Satış',
      className: 'align-top max-w-[11rem]',
      render: (row: SupportTopicListItem) => saleRefCell(row),
    },
    {
      key: 'status',
      header: 'Durum',
      render: (row: SupportTopicListItem) => (
        <Badge
          label={row.status === 'open' ? 'Açık' : 'Kapalı'}
          variant={row.status === 'open' ? 'green' : 'gray'}
        />
      ),
    },
    {
      key: 'updatedAt',
      header: 'Son güncelleme',
      render: (row: SupportTopicListItem) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {formatDateTime(row.updatedAt)}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      render: (row: SupportTopicListItem) => (
        <Link
          href={`/support/${row._id}`}
          className="text-sm text-indigo-600 hover:underline whitespace-nowrap"
        >
          Aç
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Destek talepleri"
        description="Üyelerin talepleri; siz de üyeye yeni konu açıp mesaj atabilirsiniz. Ekler: JPG, PNG, WEBP, PDF."
        icon={<MessageCircle className="text-indigo-600" size={28} />}
      />

      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Durum"
          value={status}
          onChange={(e) => onFilterChange(e.target.value)}
          options={STATUS_FILTER}
          className="w-44"
        />
        <button
          type="button"
          onClick={() => router.refresh()}
          className="text-sm text-gray-600 hover:text-gray-900 underline mb-2"
        >
          Sayfayı yenile
        </button>
        {loading && <span className="text-xs text-gray-500 mb-2">Yükleniyor…</span>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Toplam {pagination.total} kayıt · sayfa {pagination.page}/{pagination.totalPages}
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={<Send size={14} />}
          onClick={() => setNewTopicOpen(true)}
          className="shrink-0"
        >
          Üyeye mesaj gönder
        </Button>
      </div>

      <Table
        data={items}
        columns={columns}
        emptyText="Henüz destek talebi yok."
        keyExtractor={(row) => row._id}
      />

      <AdminNewSupportTopicModal
        open={newTopicOpen}
        onClose={() => setNewTopicOpen(false)}
        onCreated={(topicId) => {
          setNewTopicOpen(false);
          router.push(`/support/${topicId}`);
        }}
      />
    </div>
  );
}
