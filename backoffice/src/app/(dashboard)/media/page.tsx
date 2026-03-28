'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, Trash2, Copy, ImageIcon, FileText } from 'lucide-react';
import { mediaService } from '@/services/media.service';
import { Media } from '@/types';
import { formatDate } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const FILE_ACCEPT = 'image/*,application/pdf,.pdf';

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mediaService.getAll();
      setMedia(res.data ?? []);
    } catch {
      toast.error('Medya yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const uploadSingleFile = useCallback(
    async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      setUploading(true);
      try {
        await mediaService.upload(fd);
        toast.success('Yüklendi.');
        setUploadModalOpen(false);
        await load();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Yükleme başarısız.';
        toast.error(msg);
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    },
    [load]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadSingleFile(file);
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = e.relatedTarget as Node | null;
    if (!next || !e.currentTarget.contains(next)) {
      setIsDragging(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadSingleFile(file);
  };

  const openFilePicker = () => {
    if (!uploading) fileRef.current?.click();
  };

  const closeUploadModal = () => {
    if (uploading) return;
    setUploadModalOpen(false);
    setIsDragging(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await mediaService.delete(deleteTarget._id);
      toast.success('Silindi.');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Silinemedi.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL kopyalandı!');
  };

  return (
    <div>
      <PageHeader
        title="Medya"
        description={`Toplam ${media.length} dosya`}
        action={
          <Button icon={<Upload size={16} />} onClick={() => setUploadModalOpen(true)}>
            Medya ekle
          </Button>
        }
      />

      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        accept={FILE_ACCEPT}
        onChange={handleInputChange}
        aria-hidden
        tabIndex={-1}
      />

      <Modal open={uploadModalOpen} onClose={closeUploadModal} title="Medya yükle" size="lg">
        <div
          role="button"
          tabIndex={0}
          aria-label="Medya yükle: sürükleyip bırakın veya dosya seçin"
          aria-busy={uploading}
          onClick={openFilePicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={[
            'rounded-xl border-2 border-dashed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400',
            isDragging ? 'border-gray-500 bg-gray-50' : 'border-gray-200 bg-gray-50/50',
            uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:border-gray-300 hover:bg-gray-50',
          ].join(' ')}
        >
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <ImageIcon className="h-10 w-10" strokeWidth={1.25} />
              <FileText className="h-10 w-10" strokeWidth={1.25} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {uploading ? 'Yükleniyor…' : 'Dosyaları buraya sürükleyip bırakın'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                veya{' '}
                <span className="font-medium text-gray-700 underline decoration-gray-300 underline-offset-2">
                  dosya seçmek için tıklayın
                </span>
              </p>
              <p className="mt-2 text-xs text-gray-400">JPEG, PNG, WebP, GIF veya PDF · en fazla 10 MB</p>
            </div>
          </div>
        </div>
      </Modal>

      {loading ? (
        <p className="text-sm text-gray-400">Yükleniyor...</p>
      ) : media.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Upload size={32} className="mx-auto mb-3 text-gray-300" />
          <p>Henüz medya yok.</p>
          <p className="mt-1 text-sm">Yüklemek için üstteki <span className="text-gray-600 font-medium">Medya ekle</span> butonunu kullanın.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {media.map((item) => (
            <div key={item._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {item.fileType?.startsWith('image') ? (
                  <img src={item.url} alt={item.fileName} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    {item.fileType}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyUrl(item.url)}
                    className="p-1.5 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 bg-white rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-600 truncate">{item.fileName}</p>
                <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Medyayı Sil"
        description={`"${deleteTarget?.fileName}" dosyasını silmek istediğinize emin misiniz?`}
        confirmLabel="Sil"
      />
    </div>
  );
}
