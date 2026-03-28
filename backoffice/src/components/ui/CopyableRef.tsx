'use client';

import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';

type Props = {
  /** Müşteriyle paylaşılacak kısa kod (yoksa Mongo ID gösterilir) */
  referenceCode?: string | null;
  /** Veritabanı ObjectId */
  mongoId: string;
  className?: string;
  /** Tabloda kısa satır */
  compact?: boolean;
};

export default function CopyableRef({
  referenceCode,
  mongoId,
  className = '',
  compact = false,
}: Props) {
  const refOk = referenceCode?.trim() || '';

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error('Panoya kopyalanamadı.');
    }
  };

  return (
    <div className={`flex min-w-0 max-w-[220px] flex-col gap-1 ${className}`}>
      {refOk ? (
        <button
          type="button"
          onClick={() => void copy(refOk, 'Referans kopyalandı')}
          className="flex items-center gap-1.5 text-left font-mono text-xs font-semibold text-indigo-900 hover:underline"
          title="Müşteri ile paylaşmak için kopyala"
        >
          <Copy className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{refOk}</span>
        </button>
      ) : compact ? (
        <span className="text-[11px] text-gray-400" title="Kayıt güncellenince veya yeni kayıtta atanır">
          Referans yok
        </span>
      ) : (
        <p className="text-[11px] leading-snug text-amber-800">
          Kısa referans henüz yok. Aşağıdaki kayıt ID’sini kullanabilirsiniz.
        </p>
      )}
      <button
        type="button"
        onClick={() => void copy(mongoId, 'Kayıt ID kopyalandı')}
        className="flex min-w-0 items-center gap-1 text-left font-mono text-[11px] text-gray-500 hover:text-gray-800"
        title={mongoId}
      >
        <Copy className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
        <span className="truncate">ID {mongoId}</span>
      </button>
    </div>
  );
}
