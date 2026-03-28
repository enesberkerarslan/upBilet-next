'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { Blog } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import BlogFormModal from './BlogFormModal';

export default function BlogsClient({ initialBlogs }: { initialBlogs: Blog[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Blog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await blogService.delete(deleteTarget._id);
      toast.success('Blog silindi.');
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error('Silinemedi.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'title', header: 'Başlık', render: (row: Blog) => (
      <div>
        <p className="font-medium text-gray-900">{truncate(row.title, 60)}</p>
        <p className="text-xs text-gray-400">{row.slug}</p>
      </div>
    )},
    { key: 'metaTitle', header: 'Meta Başlık', render: (row: Blog) => truncate(row.metaTitle, 50) },
    { key: 'createdAt', header: 'Tarih', render: (row: Blog) => formatDate(row.createdAt) },
    { key: 'actions', header: 'İşlemler', render: (row: Blog) => (
      <div className="flex flex-wrap items-center gap-2">
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
        title="Blog"
        description={`Toplam ${initialBlogs.length} yazı`}
        action={<Button icon={<Plus size={16} />} onClick={() => { setEditItem(null); setFormOpen(true); }}>Yazı Ekle</Button>}
      />
      <Table columns={columns} data={initialBlogs} keyExtractor={(r) => r._id} emptyText="Henüz blog yazısı yok." />
      <BlogFormModal
        key={formOpen ? (editItem?._id ?? 'create') : 'closed'}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        onSuccess={() => router.refresh()}
        editItem={editItem}
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Blogu Sil" description={`"${deleteTarget?.title}" yazısını silmek istediğinize emin misiniz?`} confirmLabel="Sil" />
    </div>
  );
}
