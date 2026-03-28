'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, ToggleLeft } from 'lucide-react';
import { tagService } from '@/services/tag.service';
import { Tag } from '@/types';
import { stripHtmlToPlainText, truncate } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge, { statusVariant } from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import RichTextEditor from '@/components/ui/RichTextEditor';

const TAG_TYPES = [
  { value: 'FutbolTakımı', label: 'Futbol Takımı' },
  { value: 'BasketbolTakımı', label: 'Basketbol Takımı' },
  { value: 'Sanatçı', label: 'Sanatçı' },
  { value: 'GenelTag', label: 'Genel Tag' },
  { value: 'EtkinlikAlanı', label: 'Etkinlik Alanı' },
  { value: 'AltTag', label: 'Alt Tag' },
];

const emptyForm = {
  name: '',
  description: '',
  tag: 'GenelTag',
  metaTitle: '',
  metaDescription: '',
  keywords: '',
};

/** Liste hücrelerinde üst üste binmeyi önlemek için kısa önizleme; tam metin title ile */
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

function apiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object' || !('response' in err)) return fallback;
  const data = (err as { response?: { data?: { message?: string; error?: string } } }).response?.data;
  const msg = data?.message || data?.error;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

export default function TagsClient({ initialTags }: { initialTags: Tag[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Tag | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const openForm = (item?: Tag) => {
    if (item) {
      setEditItem(item);
      setForm({
        name: item.name,
        description: item.description ?? '',
        tag: item.tag,
        metaTitle: item.metaTitle ?? '',
        metaDescription: item.metaDescription ?? '',
        keywords: item.keywords ?? '',
      });
    } else {
      setEditItem(null);
      setForm(emptyForm);
    }
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Ad zorunludur.'); return; }
    setFormLoading(true);
    try {
      if (editItem) {
        await tagService.update(editItem._id, form);
        toast.success('Etiket güncellendi.');
      } else {
        await tagService.create(form);
        toast.success('Etiket oluşturuldu.');
      }
      setFormOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'İşlem başarısız.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = async (tag: Tag) => {
    try {
      await tagService.update(tag._id, { status: tag.status === 'active' ? 'inactive' : 'active' });
      toast.success('Durum güncellendi.');
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'İşlem başarısız.'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await tagService.delete(deleteTarget._id);
      toast.success('Etiket silindi.');
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Silinemedi.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Ad', render: (row: Tag) => (
      <div>
        <p className="font-medium text-gray-900">{row.name}</p>
        <p className="text-xs text-gray-400">{row.slug}</p>
      </div>
    )},
    { key: 'tag', header: 'Tür', render: (row: Tag) => (
      <Badge label={TAG_TYPES.find((t) => t.value === row.tag)?.label ?? row.tag} variant="blue" />
    )},
    {
      key: 'description',
      header: 'Açıklama',
      className: 'w-32 max-w-32 align-middle',
      render: (row: Tag) => descriptionCell(row.description),
    },
    {
      key: 'metaTitle',
      header: 'Meta başlık',
      className: 'w-32 max-w-32 align-middle',
      render: (row: Tag) => seoPreview(row.metaTitle),
    },
    {
      key: 'keywords',
      header: 'Anahtar',
      className: 'w-32 max-w-32 align-middle pr-6',
      render: (row: Tag) => seoPreview(row.keywords),
    },
    {
      key: 'metaDescription',
      header: 'Meta açıklama',
      className: 'w-32 max-w-32 align-middle pl-4',
      render: (row: Tag) => seoPreview(row.metaDescription),
    },
    { key: 'status', header: 'Durum', render: (row: Tag) => (
      <Badge label={row.status} variant={statusVariant[row.status]} />
    )},
    { key: 'actions', header: 'İşlemler', render: (row: Tag) => (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 min-w-[88px] justify-center"
          icon={<Pencil size={14} />}
          onClick={() => openForm(row)}
        >
          Düzenle
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 min-w-[88px] justify-center"
          icon={<ToggleLeft size={14} />}
          onClick={() => handleToggle(row)}
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
        title="Etiketler"
        description={`Toplam ${initialTags.length} etiket`}
        action={<Button icon={<Plus size={16} />} onClick={() => openForm()}>Etiket Ekle</Button>}
      />

      <Table columns={columns} data={initialTags} keyExtractor={(r) => r._id} emptyText="Henüz etiket yok." />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? 'Etiketi Düzenle' : 'Etiket Ekle'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Ad *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Select label="Tür *" value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))} options={TAG_TYPES} />
          <RichTextEditor
            label="Açıklama"
            value={form.description}
            onChange={(html) => setForm((p) => ({ ...p, description: html }))}
            placeholder="Etiket açıklaması..."
            resetKey={`tag-${formOpen}-${editItem?._id ?? 'new'}`}
            minHeight="min-h-[180px]"
          />

          <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">SEO</p>
            {editItem?.slug ? (
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-600">Slug:</span>{' '}
                <code className="rounded bg-white px-1.5 py-0.5 font-mono text-gray-700">/{editItem.slug}</code>
                <span className="ml-2 text-gray-400">— Ad değişince otomatik güncellenir</span>
              </p>
            ) : (
              <p className="text-xs text-gray-400">Slug, kayıttan sonra etiket adından otomatik oluşturulur.</p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Meta başlık"
                value={form.metaTitle}
                onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))}
                placeholder="SEO başlığı"
                maxLength={60}
              />
              <Input
                label="Anahtar kelimeler"
                value={form.keywords}
                onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))}
                placeholder="futbol, takım, bilet"
              />
            </div>
            <Input
              label="Meta açıklama"
              value={form.metaDescription}
              onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))}
              placeholder="SEO açıklaması"
              maxLength={160}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setFormOpen(false)}>İptal</Button>
            <Button type="submit" loading={formLoading}>{editItem ? 'Güncelle' : 'Oluştur'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Etiketi Sil"
        description={`"${deleteTarget?.name}" etiketini silmek istediğinize emin misiniz?`} confirmLabel="Sil" />
    </div>
  );
}
