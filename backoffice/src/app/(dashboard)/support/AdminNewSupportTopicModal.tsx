'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, Paperclip } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supportService } from '@/services/support.service';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Doluysa üye alanı salt okunur (üye detayından açıldığında) */
  fixedMemberId?: string;
  /** Konu oluşturulunca topic id */
  onCreated?: (topicId: string) => void;
};

export default function AdminNewSupportTopicModal({
  open,
  onClose,
  fixedMemberId,
  onCreated,
}: Props) {
  const [memberId, setMemberId] = useState(fixedMemberId ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [refSaleId, setRefSaleId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    if (!fixedMemberId) setMemberId('');
    setSubject('');
    setBody('');
    setRefSaleId('');
    setFiles([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles((prev) => [...prev, ...list].slice(0, 5));
    e.target.value = '';
  };

  const submit = async () => {
    const mid = (fixedMemberId || memberId).trim();
    const sub = subject.trim();
    const txt = body.trim();
    if (!mid) {
      toast.error('Üye ID gerekli');
      return;
    }
    if (!sub) {
      toast.error('Konu başlığı gerekli');
      return;
    }
    if (!txt && files.length === 0) {
      toast.error('Mesaj veya ek dosya girin');
      return;
    }
    setLoading(true);
    try {
      const data = await supportService.createTopicForMember({
        memberId: mid,
        subject: sub,
        body: txt,
        referenceSaleId: refSaleId.trim() || undefined,
        files,
      });
      const id = data?.topic?._id;
      if (!id) throw new Error('Yanıtta konu kimliği yok');
      toast.success('Mesaj gönderildi');
      handleClose();
      onCreated?.(id);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Üyeye destek mesajı" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Yeni bir konu açılır; üye tarafında okunmamış görünür. Ek: yalnız JPG, PNG, WEBP veya PDF
          (en fazla 5).
        </p>
        <Input
          label="Üye (MongoDB ID)"
          value={fixedMemberId ?? memberId}
          onChange={(e) => setMemberId(e.target.value)}
          disabled={Boolean(fixedMemberId)}
          placeholder="507f1f77bcf86cd799439011"
        />
        <Input
          label="Konu başlığı"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Örn. Siparişiniz hakkında"
        />
        <Input
          label="İsteğe bağlı satış referansı (Satış ID)"
          value={refSaleId}
          onChange={(e) => setRefSaleId(e.target.value)}
          placeholder="Boş bırakılabilir"
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Mesaj</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Mesajınız…"
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          multiple
          className="hidden"
          onChange={onFiles}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Paperclip size={14} />}
            onClick={() => fileRef.current?.click()}
          >
            Ek ekle
          </Button>
          {files.length > 0 && (
            <span className="text-xs text-gray-600">{files.length} dosya</span>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            İptal
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<MessageCircle size={16} />}
            loading={loading}
            onClick={() => void submit()}
          >
            Gönder
          </Button>
        </div>
      </div>
    </Modal>
  );
}
