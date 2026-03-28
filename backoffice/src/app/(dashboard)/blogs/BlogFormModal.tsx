'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { blogService } from '@/services/blog.service';
import { Blog } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Blog | null;
}

function formFromBlog(edit: Blog | null) {
  if (!edit) {
    return { title: '', metaTitle: '', metaDescription: '', contentText: '' };
  }
  const textBlock = edit.content?.find((c) => c != null && typeof c === 'object' && 'text' in c);
  return {
    title: edit.title,
    metaTitle: edit.metaTitle,
    metaDescription: edit.metaDescription,
    contentText: typeof textBlock?.text === 'string' ? textBlock.text : '',
  };
}

export default function BlogFormModal({ open, onClose, onSuccess, editItem }: Props) {
  const isEdit = !!editItem;
  const [loading, setLoading] = useState(false);
  /** Parent `key` ile remount edildiğinde ilk render’da doğru içerik (useEffect bir frame sonra kalırdı → Tiptap boş kalırdı) */
  const [form, setForm] = useState(() => formFromBlog(editItem));

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error('Başlık zorunludur.'); return; }
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        content: form.contentText ? [{ text: form.contentText }] : [],
      };
      if (isEdit) {
        await blogService.update(editItem._id, payload);
        toast.success('Blog güncellendi.');
      } else {
        await blogService.create(payload);
        toast.success('Blog oluşturuldu.');
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

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Blogu Düzenle' : 'Blog Yazısı Ekle'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Başlık *" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Blog başlığı" />
        <Input label="Meta Başlık" value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder="SEO başlığı" />
        <Input label="Meta Açıklama" value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} placeholder="SEO açıklaması" />
        <RichTextEditor
          label="İçerik"
          value={form.contentText}
          onChange={(html) => set('contentText', html)}
          placeholder="Blog içeriği yazın..."
          resetKey={`blog-${open}-${editItem?._id ?? 'new'}`}
          minHeight="min-h-[280px]"
        />
        <div className="flex gap-3 justify-end">
          <Button variant="outline" type="button" onClick={onClose}>İptal</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Güncelle' : 'Oluştur'}</Button>
        </div>
      </form>
    </Modal>
  );
}
