'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { saleService } from '@/services/sale.service';
import { Sale, Event, Member, SellerProofAttachment } from '@/types';
import { formatDateTime, formatCurrency, cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import CopyableRef from '@/components/ui/CopyableRef';
import Button from '@/components/ui/Button';
import Badge, { statusVariant } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  PackageCheck,
  ChevronRight,
  Undo2,
  FileImage,
  Trash2,
  Plus,
  Upload,
  StickyNote,
} from 'lucide-react';

/** Backend (üye + admin) ile aynı: bilet başına en fazla 5 kanıt; tek yüklemede 1 dosya */
const MAX_SELLER_PROOFS_PER_TICKET = 5;

function SellerProofGallery({
  items,
  emptyHint,
}: {
  items: SellerProofAttachment[];
  emptyHint?: string;
}) {
  if (!items?.length) {
    return (
      <p className="text-sm text-gray-400 py-2">
        {emptyHint ??
          'Satıcı henüz kanıt yüklemedi. Üye panelinden (satışlarım) eklenebilir.'}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-3 pt-1">
      {items.map((a, i) => {
        const isPdf =
          a.kind === 'pdf' ||
          (a.mimeType && a.mimeType.includes('pdf')) ||
          /\.pdf(\?|$)/i.test(a.url || '');
        if (isPdf) {
          return (
            <a
              key={`${a.url}-${i}`}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-gray-100"
            >
              <FileImage size={16} className="shrink-0 opacity-70" aria-hidden />
              {a.originalName?.trim() || 'PDF kanıt'}
            </a>
          );
        }
        return (
          <a
            key={`${a.url}-${i}`}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-gray-200 overflow-hidden bg-gray-50 hover:ring-2 hover:ring-indigo-300 transition-shadow"
            title={a.originalName || 'Kanıt görseli'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.url}
              alt={a.originalName || 'Satıcı kanıtı'}
              className="max-h-44 max-w-[200px] object-contain"
            />
          </a>
        );
      })}
    </div>
  );
}

type SaleConfirm =
  | null
  | { kind: 'approve' }
  | { kind: 'cancel' }
  | { kind: 'refund' }
  | { kind: 'revert'; ticketIndex: number };

type HolderFormState = {
  name: string;
  surname: string;
  nationality: string;
  identityNumber: string;
  passoligEmail: string;
  passoligPassword: string;
  proofUrls: string;
  /** Admin düzenlemesi — kayıtta sellerProofAttachments olarak gider */
  sellerProofDraft: SellerProofAttachment[];
  adminNewProofUrl: string;
  adminNewProofName: string;
};

interface Props {
  sale: Sale;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void | Promise<void>;
}

export default function SaleDetailModal({ sale, open, onClose, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [holderForms, setHolderForms] = useState<Record<number, HolderFormState>>({});
  /** Her bilet satırı kendi başına açılır / kapanır */
  const [holderPanelOpen, setHolderPanelOpen] = useState<Record<number, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<SaleConfirm>(null);
  const [saleNotes, setSaleNotes] = useState('');

  useEffect(() => {
    if (!open) setConfirmDialog(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSaleNotes(sale.notes ?? '');
  }, [open, sale._id, sale.notes]);

  /**
   * Bilet formlarını sadece modal açılışında veya sunucudan gelen satış gerçekten güncellendiğinde sıfırla.
   * `sale.ticketHolders` referansını bağımlılıkta kullanma: üst render’larda yeni dizi gelince effect
   * tekrar çalışıp admin’in “Kaldır” ile yaptığı sellerProofDraft düzenini anında siliyordu.
   */
  useEffect(() => {
    if (!open) return;
    const nextForms: Record<number, HolderFormState> = {};
    const nextOpen: Record<number, boolean> = {};
    (sale.ticketHolders ?? []).forEach((th, i) => {
      nextForms[i] = {
        name: th.name ?? '',
        surname: th.surname ?? '',
        nationality: th.nationality ?? 'Türkiye',
        identityNumber: th.identityNumber ?? '',
        passoligEmail: th.passoligEmail ?? '',
        passoligPassword: th.passoligPassword ?? '',
        proofUrls: (th.proofPhotos?.map((p) => p.url).filter(Boolean) ?? []).join(', '),
        sellerProofDraft: (th.sellerProofAttachments ?? []).map((a) => ({ ...a })),
        adminNewProofUrl: '',
        adminNewProofName: '',
      };
      nextOpen[i] = false;
    });
    setHolderForms(nextForms);
    setHolderPanelOpen(nextOpen);
  }, [open, sale._id, sale.ticketHolders]);

  /** Teslimat onayı: modal açık kalsın, satış verisi yenilensin */
  const deliveryAction = async (fn: () => Promise<unknown>, key: string, msg: string) => {
    setLoading(key);
    try {
      await fn();
      toast.success(msg);
      await onRefresh();
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(m ?? 'İşlem başarısız.');
    } finally {
      setLoading(null);
    }
  };

  const canConfirmDelivery = sale.status === 'approved' || sale.status === 'active';
  /** Tamamlanmış satışta da yanlış teslimi geri alabilmek için */
  const canRevertTicketDelivery = ['approved', 'active', 'completed'].includes(sale.status);
  const hasUndelivered =
    (sale.ticketHolders?.length ?? 0) > 0 &&
    sale.ticketHolders.some((th) => th.deliveryStatus !== 'delivered');

  const confirmBusy = loading === 'confirm-action';

  const handleConfirmDialog = async () => {
    if (!confirmDialog) return;
    setLoading('confirm-action');
    try {
      if (confirmDialog.kind === 'approve') {
        await saleService.approve(sale._id);
        toast.success('Ödeme tamamlandı ve satış onaylandı (satıcı sürecine düştü).');
        await onRefresh();
        setConfirmDialog(null);
        onClose();
      } else if (confirmDialog.kind === 'cancel') {
        await saleService.cancel(sale._id);
        toast.success('Satış iptal edildi.');
        await onRefresh();
        setConfirmDialog(null);
        onClose();
      } else if (confirmDialog.kind === 'refund') {
        await saleService.refund(sale._id);
        toast.success('İade işlendi.');
        await onRefresh();
        setConfirmDialog(null);
        onClose();
      } else if (confirmDialog.kind === 'revert') {
        await saleService.updateTicketHolderDelivery(sale._id, confirmDialog.ticketIndex, 'pending');
        toast.success(`Bilet ${confirmDialog.ticketIndex + 1} teslimi geri alındı (bekliyor).`);
        await onRefresh();
        setConfirmDialog(null);
      }
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(m ?? 'İşlem başarısız.');
    } finally {
      setLoading(null);
    }
  };

  const eventName = typeof sale.eventId === 'object' ? (sale.eventId as Event).name : sale.eventId;
  const buyerName = typeof sale.buyer === 'object' ? `${(sale.buyer as Member).name} ${(sale.buyer as Member).surname}` : sale.buyer;
  const sellerName = typeof sale.seller === 'object' ? `${(sale.seller as Member).name} ${(sale.seller as Member).surname}` : sale.seller;

  const confirmCopy =
    confirmDialog?.kind === 'approve'
      ? {
          title: 'Satışı onayla',
          description:
            'Ödeme hesaba geçti kabul edilecek: ödeme durumu tamamlandı, satış onaylı olacak ve alıcıya onay e-postası gidebilir. Devam edilsin mi?',
          confirmLabel: 'Satışı onayla',
          confirmVariant: 'primary' as const,
        }
      : confirmDialog?.kind === 'cancel'
        ? {
            title: 'Satışı iptal et',
            description:
              'Bu satış iptal edilecek. Emin misiniz?',
            confirmLabel: 'İptal et',
            confirmVariant: 'danger' as const,
          }
        : confirmDialog?.kind === 'refund'
          ? {
              title: 'İade işle',
              description:
                'Bu satış için iade kaydı işlenecek. Devam edilsin mi?',
              confirmLabel: 'İade et',
              confirmVariant: 'danger' as const,
            }
          : confirmDialog?.kind === 'revert'
            ? {
                title: `Bilet ${confirmDialog.ticketIndex + 1} — teslimi geri al`,
                description:
                  'Bu bilet “teslim edildi” durumundan “bekliyor” durumuna döner. Satış tamamlandıysa, tüm biletler teslimde değilse satış yeniden onaylı aşamaya alınır.',
                confirmLabel: 'Teslimi geri al',
                confirmVariant: 'primary' as const,
              }
            : null;

  return (
    <>
    <Modal open={open} onClose={onClose} title="Satış Detayı" size="xl">
      <div className="space-y-5">
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Müşteriyle paylaşım</p>
          <CopyableRef referenceCode={sale.referenceCode} mongoId={sale._id} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Etkinlik</p>
            <p className="font-medium text-gray-900 mt-0.5">{eventName}</p>
          </div>
          <div>
            <p className="text-gray-500">Tarih</p>
            <p className="font-medium text-gray-900 mt-0.5">{formatDateTime(sale.saleDate)}</p>
          </div>
          <div>
            <p className="text-gray-500">Alıcı</p>
            <p className="font-medium text-gray-900 mt-0.5">{buyerName}</p>
          </div>
          <div>
            <p className="text-gray-500">Satıcı</p>
            <p className="font-medium text-gray-900 mt-0.5">{sellerName}</p>
          </div>
          <div>
            <p className="text-gray-500">Toplam Tutar</p>
            <p className="font-semibold text-gray-900 mt-0.5">{formatCurrency(sale.totalAmount)}</p>
          </div>
          <div>
            <p className="text-gray-500">Satıcıya Ödeme</p>
            <p className="font-semibold text-gray-900 mt-0.5">{formatCurrency(sale.sellerTotalAmount)}</p>
          </div>
          <div>
            <p className="text-gray-500">Durum</p>
            <div className="mt-0.5"><Badge label={sale.status} variant={statusVariant[sale.status]} /></div>
          </div>
          <div>
            <p className="text-gray-500">Ödeme Durumu</p>
            <div className="mt-0.5"><Badge label={sale.paymentStatus} variant={statusVariant[sale.paymentStatus]} /></div>
          </div>
          <div>
            <p className="text-gray-500">
              deliveryStatus
              <span className="block text-xs font-normal text-gray-400">Teslimat özeti (satış)</span>
            </p>
            <div className="mt-0.5">
              <Badge label={sale.deliveryStatus} variant={statusVariant[sale.deliveryStatus] ?? 'gray'} />
            </div>
          </div>
          <div>
            <p className="text-gray-500">Bilet Sayısı</p>
            <p className="font-medium text-gray-900 mt-0.5">{sale.ticketQuantity}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StickyNote className="size-4 text-gray-500 shrink-0" aria-hidden />
            <p className="text-sm font-semibold text-gray-900">Satış notu</p>
            <span className="text-xs text-gray-500">Yalnızca admin paneli</span>
          </div>
          <textarea
            className="w-full min-h-[88px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
            placeholder="İç takip, eksik bilgi, destek özeti…"
            value={saleNotes}
            onChange={(e) => setSaleNotes(e.target.value)}
          />
          <Button
            size="sm"
            variant="secondary"
            loading={loading === 'save-sale-notes'}
            onClick={() =>
              deliveryAction(
                () => saleService.update(sale._id, { notes: saleNotes }),
                'save-sale-notes',
                'Satış notu kaydedildi.'
              )
            }
          >
            Notu kaydet
          </Button>
        </div>

        {sale.ticketHolders?.length > 0 && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Bilet Sahipleri</p>
              <p className="text-xs text-gray-500 mt-1 tabular-nums">
                {sale.ticketHolders.length} bilet — her satırı ayrı açıp kapatabilirsiniz.
              </p>
              {canConfirmDelivery && (
                <p className="text-xs text-gray-500 mt-1">
                  Teslimatı tamamladıysanız tek tek veya toplu onaylayın; tüm biletler teslim olunca satış{' '}
                  <strong>completed</strong> olur ve alıcıya teslim e-postası gider.
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Bilgileri düzenleyip <strong>Kaydet</strong> ile güncelleyin; satıcı dosya yüklediyse her bilet
                satırında görünür. İsterseniz aşağıdaki URL alanıyla ek kanıt bağlantıları da ekleyebilirsiniz.
              </p>
            </div>
            <div className="space-y-2">
              {sale.ticketHolders.map((th, i) => {
                const form = holderForms[i];
                if (!form) return null;
                const proofDraftCount = (form.sellerProofDraft ?? []).length;
                const proofCapReached = proofDraftCount >= MAX_SELLER_PROOFS_PER_TICKET;
                const isOpen = holderPanelOpen[i] ?? false;
                const preview =
                  [th.name, th.surname].filter(Boolean).join(' ').trim() ||
                  [form.name, form.surname].filter(Boolean).join(' ').trim() ||
                  '—';
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden text-sm"
                  >
                    <div className="flex flex-wrap items-stretch gap-2 sm:gap-3 px-3 py-2.5 bg-gray-50/80 border-b border-gray-100">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-0.5 text-left hover:bg-white/60 transition-colors"
                        onClick={() =>
                          setHolderPanelOpen((prev) => ({ ...prev, [i]: !prev[i] }))
                        }
                        aria-expanded={isOpen}
                      >
                        <ChevronRight
                          className={cn(
                            'size-5 shrink-0 text-gray-400 transition-transform duration-200',
                            isOpen && 'rotate-90'
                          )}
                          aria-hidden
                        />
                        <span className="shrink-0 font-semibold text-gray-900">Bilet {i + 1}</span>
                        <span className="min-w-0 truncate text-xs font-normal text-gray-500">{preview}</span>
                      </button>
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
                        <Badge label={th.deliveryStatus} variant={statusVariant[th.deliveryStatus]} />
                        {canRevertTicketDelivery && th.deliveryStatus === 'delivered' && (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Undo2 size={14} />}
                            onClick={() => setConfirmDialog({ kind: 'revert', ticketIndex: i })}
                          >
                            Teslimi geri al
                          </Button>
                        )}
                        {canConfirmDelivery && th.deliveryStatus !== 'delivered' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<CheckCircle size={14} />}
                            loading={loading === `deliver-${i}`}
                            onClick={() =>
                              deliveryAction(
                                () => saleService.approveTicket(sale._id, i),
                                `deliver-${i}`,
                                `Bilet ${i + 1} teslim onaylandı.`
                              )
                            }
                          >
                            Teslim onayı
                          </Button>
                        )}
                      </div>
                    </div>
                    {isOpen && (
                      <div className="space-y-3 bg-gray-50/40 p-3 border-t border-gray-100">
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-900">
                            Satıcının bu bilet için yüklediği kanıt
                          </p>
                          <p className="text-xs text-gray-600">
                            Üye uygulamasından bu bilet sırasına (Bilet {i + 1}) JPG, PNG, WEBP veya PDF
                            yüklenir; bilet başına en fazla {MAX_SELLER_PROOFS_PER_TICKET} kanıt, her seferde tek
                            dosya. Admin tarafında burada önizlenir.
                          </p>
                          <SellerProofGallery
                            items={th.sellerProofAttachments ?? []}
                            emptyHint="Bu bilet için satıcı henüz dosya yüklemedi."
                          />
                        </div>

                        <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-3 space-y-3">
                          <p className="text-xs font-semibold text-amber-950">Admin — satıcı kanıtı</p>
                          <p className="text-xs text-amber-900/80">
                            Yanlış dosyaları listeden kaldırın, doğru URL ekleyin veya dosya yükleyin (her seferde
                            tek dosya; en fazla {MAX_SELLER_PROOFS_PER_TICKET} kanıt / bilet). Liste
                            değişiklikleri <strong>Bilet bilgisini kaydet</strong> ile yazılır; dosya yükleme
                            hemen eklenir.
                          </p>
                          {proofCapReached && (
                            <p className="text-xs font-medium text-amber-950">
                              Bu bilet için kanıt limiti doldu ({proofDraftCount}/
                              {MAX_SELLER_PROOFS_PER_TICKET}). Yeni eklemek için önce kaldırın.
                            </p>
                          )}
                          <div className="space-y-2">
                            {(form.sellerProofDraft ?? []).map((att, ai) => (
                              <div
                                key={`${att.url}-${ai}`}
                                className="grid grid-cols-1 min-[400px]:grid-cols-[minmax(0,1fr)_auto] gap-2 items-center rounded-md border border-amber-100 bg-white/90 px-2 py-1.5"
                              >
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="min-w-0 truncate text-xs text-indigo-700 hover:underline"
                                >
                                  {att.originalName?.trim() || att.url}
                                </a>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="dangerOutline"
                                  className="w-full min-[400px]:w-auto justify-center"
                                  icon={<Trash2 size={14} />}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setHolderForms((prev) => {
                                      const cur = prev[i];
                                      if (!cur) return prev;
                                      const draft = cur.sellerProofDraft ?? [];
                                      return {
                                        ...prev,
                                        [i]: {
                                          ...cur,
                                          sellerProofDraft: draft.filter((_, j) => j !== ai),
                                        },
                                      };
                                    });
                                  }}
                                >
                                  Kaldır
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Input
                              label="Kanıt URL ekle"
                              value={form.adminNewProofUrl}
                              placeholder="https://..."
                              disabled={proofCapReached}
                              onChange={(e) =>
                                setHolderForms((prev) => ({
                                  ...prev,
                                  [i]: { ...prev[i], adminNewProofUrl: e.target.value },
                                }))
                              }
                            />
                            <Input
                              label="Dosya adı (isteğe bağlı)"
                              value={form.adminNewProofName}
                              placeholder="ör. bilet.pdf"
                              disabled={proofCapReached}
                              onChange={(e) =>
                                setHolderForms((prev) => ({
                                  ...prev,
                                  [i]: { ...prev[i], adminNewProofName: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              icon={<Plus size={14} />}
                              disabled={proofCapReached}
                              onClick={() => {
                                if (proofCapReached) {
                                  toast.error(
                                    `Bu bilet için en fazla ${MAX_SELLER_PROOFS_PER_TICKET} kanıt eklenebilir.`
                                  );
                                  return;
                                }
                                const url = form.adminNewProofUrl.trim();
                                const label = form.adminNewProofName.trim();
                                if (!url) {
                                  toast.error('Önce kanıt URL’si girin.');
                                  return;
                                }
                                const isPdf = /\.pdf(\?|$)/i.test(url);
                                setHolderForms((prev) => ({
                                  ...prev,
                                  [i]: {
                                    ...prev[i],
                                    adminNewProofUrl: '',
                                    adminNewProofName: '',
                                    sellerProofDraft: [
                                      ...prev[i].sellerProofDraft,
                                      {
                                        url,
                                        originalName: label,
                                        kind: isPdf ? 'pdf' : 'image',
                                        fileKey: '',
                                        mimeType: isPdf ? 'application/pdf' : '',
                                      },
                                    ],
                                  },
                                }));
                              }}
                            >
                              URL’yi listeye ekle
                            </Button>
                            <>
                              <input
                                id={`admin-seller-proof-file-${sale._id}-${i}`}
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (proofCapReached) {
                                    toast.error(
                                      `Bu bilet için en fazla ${MAX_SELLER_PROOFS_PER_TICKET} kanıt eklenebilir.`
                                    );
                                    e.target.value = '';
                                    return;
                                  }
                                  setLoading(`admin-proof-${i}`);
                                  try {
                                    await saleService.uploadTicketHolderSellerProof(
                                      sale._id,
                                      i,
                                      [file]
                                    );
                                    toast.success('Dosya yüklendi.');
                                    e.target.value = '';
                                    await onRefresh();
                                  } catch (err: unknown) {
                                    const m =
                                      err instanceof Error
                                        ? err.message
                                        : 'Yükleme başarısız.';
                                    toast.error(m);
                                  } finally {
                                    setLoading(null);
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                icon={<Upload size={14} />}
                                disabled={proofCapReached}
                                loading={loading === `admin-proof-${i}`}
                                onClick={() =>
                                  document
                                    .getElementById(`admin-seller-proof-file-${sale._id}-${i}`)
                                    ?.click()
                                }
                              >
                                Dosya yükle (S3)
                              </Button>
                            </>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                      <Input
                        label="Ad"
                        value={form.name}
                        onChange={(e) =>
                          setHolderForms((prev) => ({ ...prev, [i]: { ...prev[i], name: e.target.value } }))
                        }
                      />
                      <Input
                        label="Soyad"
                        value={form.surname}
                        onChange={(e) =>
                          setHolderForms((prev) => ({ ...prev, [i]: { ...prev[i], surname: e.target.value } }))
                        }
                      />
                      <Input
                        label="Uyruk"
                        value={form.nationality}
                        onChange={(e) =>
                          setHolderForms((prev) => ({
                            ...prev,
                            [i]: { ...prev[i], nationality: e.target.value },
                          }))
                        }
                      />
                      <Input
                        label="Kimlik / TC"
                        value={form.identityNumber}
                        onChange={(e) =>
                          setHolderForms((prev) => ({
                            ...prev,
                            [i]: { ...prev[i], identityNumber: e.target.value },
                          }))
                        }
                      />
                      <Input
                        label="Passolig e-posta"
                        type="email"
                        autoComplete="off"
                        value={form.passoligEmail}
                        onChange={(e) =>
                          setHolderForms((prev) => ({
                            ...prev,
                            [i]: { ...prev[i], passoligEmail: e.target.value },
                          }))
                        }
                      />
                      <Input
                        label="Passolig şifre"
                        type="text"
                        autoComplete="new-password"
                        value={form.passoligPassword}
                        onChange={(e) =>
                          setHolderForms((prev) => ({
                            ...prev,
                            [i]: { ...prev[i], passoligPassword: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Satıcı PDF / belge URL’leri (virgülle ayırın)
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                        placeholder="Satıcının yüklediği PDF veya dosya bağlantıları…"
                        value={form.proofUrls}
                        onChange={(e) =>
                          setHolderForms((prev) => ({
                            ...prev,
                            [i]: { ...prev[i], proofUrls: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      loading={loading === `holder-save-${i}`}
                      onClick={() => {
                        const proofPhotos = form.proofUrls
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((url) => ({ url }));
                        const updateData: Record<string, unknown> = {
                          name: form.name.trim(),
                          surname: form.surname.trim(),
                          nationality: form.nationality.trim(),
                          identityNumber: form.identityNumber.trim(),
                          passoligEmail: form.passoligEmail.trim(),
                          passoligPassword: form.passoligPassword,
                          proofPhotos,
                          sellerProofAttachments: form.sellerProofDraft,
                        };
                        deliveryAction(
                          () => saleService.updateTicketHolderInfo(sale._id, i, updateData),
                          `holder-save-${i}`,
                          `Bilet ${i + 1} bilgileri güncellendi.`
                        );
                      }}
                    >
                      Bilet bilgisini kaydet
                    </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {canConfirmDelivery && hasUndelivered && (
              <div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<PackageCheck size={14} />}
                  loading={loading === 'deliverAll'}
                  onClick={() =>
                    deliveryAction(
                      () => saleService.approveAllTickets(sale._id),
                      'deliverAll',
                      'Tüm biletler teslim onaylandı; satış tamamlandı.'
                    )
                  }
                >
                  Tüm biletleri teslim onayla (satışı tamamla)
                </Button>
              </div>
            )}
          </div>
        )}

        {canConfirmDelivery && (sale.ticketHolders?.length ?? 0) === 0 && (sale.ticketQuantity ?? 0) > 0 && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Bu satışta bilet sahibi satırı yok; teslim onayı için önce bilet bilgilerini kaydedin.
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {sale.status === 'pending_approval' && (
            <Button
              size="sm"
              variant="primary"
              icon={<CheckCircle size={14} />}
              disabled={confirmBusy}
              onClick={() => setConfirmDialog({ kind: 'approve' })}
              title="Para hesaba geldi kabulü: ödeme completed, durum approved"
            >
              Satışı onayla
            </Button>
          )}
          {!['cancelled'].includes(sale.status) && (
            <Button
              size="sm"
              variant="danger"
              icon={<XCircle size={14} />}
              disabled={confirmBusy}
              onClick={() => setConfirmDialog({ kind: 'cancel' })}
            >
              İptal Et
            </Button>
          )}
          {sale.paymentStatus === 'completed' && (
            <Button
              size="sm"
              variant="secondary"
              icon={<RotateCcw size={14} />}
              disabled={confirmBusy}
              onClick={() => setConfirmDialog({ kind: 'refund' })}
            >
              İade Et
            </Button>
          )}
        </div>
      </div>
    </Modal>

    <ConfirmDialog
      open={confirmDialog !== null}
      onClose={() => {
        if (confirmBusy) return;
        setConfirmDialog(null);
      }}
      onConfirm={handleConfirmDialog}
      title={confirmCopy?.title ?? ''}
      description={confirmCopy?.description}
      confirmLabel={confirmCopy?.confirmLabel}
      confirmVariant={confirmCopy?.confirmVariant ?? 'primary'}
      loading={confirmBusy}
    />
    </>
  );
}
