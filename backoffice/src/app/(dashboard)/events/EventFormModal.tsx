'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { eventService } from '@/services/event.service';
import { tagService } from '@/services/tag.service';
import { Event, Tag } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import RichTextEditor from '@/components/ui/RichTextEditor';
import MediaUrlPickerField from '@/components/ui/MediaUrlPickerField';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Event | null;
}

const emptyForm = {
  name: '',
  description: '',
  date: '',
  location: '',
  image: '',
  slug: '',
  metaTitle: '',
  metaDescription: '',
  keywords: '',
  commission: '20',
  comissionCustomer: '20',
  isMainPage: false,
  tags: [] as string[],
};

export default function EventFormModal({ open, onClose, onSuccess, editItem }: Props) {
  const isEdit = !!editItem;
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    tagService.getAll().then((r) => setTags(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name ?? '',
        description: editItem.description ?? '',
        date: editItem.date ? String(editItem.date).slice(0, 16) : '',
        location: editItem.location ?? '',
        image: editItem.image ?? '',
        slug: editItem.slug ?? '',
        metaTitle: (editItem as unknown as Record<string, string>).metaTitle ?? '',
        metaDescription: (editItem as unknown as Record<string, string>).metaDescription ?? '',
        keywords: (editItem as unknown as Record<string, string>).keywords ?? '',
        commission: String(editItem.commission ?? 20),
        comissionCustomer: String(editItem.comissionCustomer ?? 20),
        isMainPage: editItem.isMainPage ?? false,
        tags: editItem.tags?.map((t) => (typeof t === 'string' ? t : t._id)) ?? [],
      });
    } else {
      setForm(emptyForm);
    }
  }, [editItem, open]);

  const set = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.location) {
      toast.error('Ad, tarih ve konum zorunludur.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        // Girilen saat olduğu gibi saklanır, timezone dönüşümü yapılmaz
        date: form.date ? form.date + ':00.000Z' : '',
        commission: Number(form.commission),
        comissionCustomer: Number(form.comissionCustomer),
      };
      if (isEdit) {
        await eventService.update(editItem._id, payload);
        toast.success('Etkinlik güncellendi.');
      } else {
        await eventService.create(payload);
        toast.success('Etkinlik oluşturuldu.');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'İşlem başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (id: string) => {
    setForm((p) => ({
      ...p,
      tags: p.tags.includes(id) ? p.tags.filter((t) => t !== id) : [...p.tags, id],
    }));
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Etkinliği Düzenle' : 'Etkinlik Ekle'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Temel Bilgiler */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Temel Bilgiler</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Etkinlik Adı *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Etkinlik adı" />
            <Input label="Tarih *" type="datetime-local" value={form.date} onChange={(e) => set('date', e.target.value)} />
            <Input label="Konum *" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Şehir veya mekan" />
            <MediaUrlPickerField
              label="Görsel URL"
              value={form.image}
              onChange={(url) => set('image', url)}
              placeholder="https://... veya Medyadan seç"
            />
          </div>
          <div className="mt-4">
            <RichTextEditor
              label="Açıklama"
              value={form.description}
              onChange={(html) => set('description', html)}
              placeholder="Etkinlik açıklaması..."
              resetKey={`evt-${open}-${editItem?._id ?? 'new'}`}
              minHeight="min-h-[200px]"
            />
          </div>
        </div>

        {/* SEO */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">SEO</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="Boş bırakılırsa isimden üretilir"
            />
            <Input label="Meta Başlık (max 60)" value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder="SEO başlığı" maxLength={60} />
          </div>
          <div className="mt-3">
            <Input label="Meta Açıklama (max 160)" value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} placeholder="SEO açıklaması" maxLength={160} />
          </div>
          <div className="mt-3">
            <Input label="Anahtar Kelimeler" value={form.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="futbol, maç, bilet" />
          </div>
        </div>

        {/* Komisyon & Ayarlar */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Komisyon & Ayarlar</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
            <Input label="Satıcı Komisyon (%)" type="number" value={form.commission} onChange={(e) => set('commission', e.target.value)} min="0" max="100" />
            <Input label="Müşteri Komisyon (%)" type="number" value={form.comissionCustomer} onChange={(e) => set('comissionCustomer', e.target.value)} min="0" max="100" />
            <div className="flex items-center gap-3 pb-2">
              <button
                type="button"
                onClick={() => set('isMainPage', !form.isMainPage)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isMainPage ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.isMainPage ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-gray-700">Anasayfada Göster</span>
            </div>
          </div>
        </div>

        {/* Etiketler */}
        {tags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Etiketler</p>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {tags.map((tag) => (
                <button
                  key={tag._id}
                  type="button"
                  onClick={() => toggleTag(tag._id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.tags.includes(tag._id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2 border-t">
          <Button variant="outline" type="button" onClick={onClose}>İptal</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Güncelle' : 'Oluştur'}</Button>
        </div>
      </form>
    </Modal>
  );
}
