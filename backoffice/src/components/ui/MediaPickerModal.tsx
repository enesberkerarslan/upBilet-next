'use client';

import { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { mediaService } from '@/services/media.service';
import type { Media } from '@/types';
import { Image as ImageIcon } from 'lucide-react';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** Seçilen medyanın public URL'si */
  onSelect: (url: string) => void;
  title?: string;
  /** true: sadece görseller (PDF hariç) */
  imagesOnly?: boolean;
}

export default function MediaPickerModal({
  open,
  onClose,
  onSelect,
  title = 'Medyadan görsel seç',
  imagesOnly = true,
}: MediaPickerModalProps) {
  const [list, setList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mediaService.getAll();
      const raw = res.data ?? [];
      const filtered = imagesOnly
        ? raw.filter((m: Media) => m.fileType?.startsWith('image'))
        : raw;
      setList(filtered);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [imagesOnly]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Yükleniyor…</p>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-gray-500 text-sm">
          <ImageIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" strokeWidth={1.25} />
          <p>Gösterilecek görsel yok.</p>
          <p className="mt-1 text-xs text-gray-400">Önce Medya sayfasından görsel yükleyin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-1 -mx-1">
          {list.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => {
                onSelect(item.url);
                onClose();
              }}
              className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-100 hover:ring-2 hover:ring-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-shadow"
              title={item.fileName}
            >
              {item.fileType?.startsWith('image') ? (
                <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-xs text-gray-500 p-1">{item.fileName}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
