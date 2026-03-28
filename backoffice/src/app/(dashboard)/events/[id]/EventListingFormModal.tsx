'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listingService } from '@/services/listing.service';
import { Listing, Member } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { listingMemberId } from '@/lib/listing-member';
import { sellerNetFromListPrice } from '@/lib/listing-duplicate';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const TICKET_TYPES = [
  { value: 'paper', label: 'Basılı (paper)' },
  { value: 'pdf', label: 'PDF' },
  { value: 'e-ticket', label: 'E-bilet' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'pending', label: 'Onay bekliyor' },
  { value: 'inactive', label: 'Pasif' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  eventId: string;
  members: Member[];
  /** Etkinlik ayarı: Satıcı komisyon (%) — liste fiyatından satıcı tutarı türetilir */
  sellerCommissionPercent: number;
  onSuccess: () => void;
  /** Doluysa düzenleme modu */
  listingToEdit?: Listing | null;
}

export default function EventListingFormModal({
  open,
  onClose,
  eventId,
  members,
  sellerCommissionPercent,
  onSuccess,
  listingToEdit = null,
}: Props) {
  const isEdit = !!listingToEdit;
  const commissionPct = Number.isFinite(sellerCommissionPercent) ? sellerCommissionPercent : 20;
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [price, setPrice] = useState('');
  const [ticketType, setTicketType] = useState('e-ticket');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [block, setBlock] = useState('');
  const [row, setRow] = useState('');
  const [seat, setSeat] = useState('');
  const [status, setStatus] = useState('active');

  const memberOptions = members.filter((m) => {
    if (m.status === 'active') return true;
    if (!listingToEdit) return false;
    return m._id === listingMemberId(listingToEdit);
  }).map((m) => ({
    value: m._id,
    label: `${m.name} ${m.surname} — ${m.email}`,
  }));

  useEffect(() => {
    if (!open) return;
    if (listingToEdit) {
      setMemberId(listingMemberId(listingToEdit));
      setPrice(listingToEdit.price != null ? String(listingToEdit.price) : '');
      setTicketType(listingToEdit.ticketType || 'e-ticket');
      setQuantity(String(listingToEdit.quantity ?? 1));
      setCategory(listingToEdit.category ?? '');
      setBlock(listingToEdit.block ?? '');
      setRow(listingToEdit.row ?? '');
      setSeat(listingToEdit.seat ?? '');
      setStatus(listingToEdit.status || 'active');
    } else {
      setMemberId('');
      setPrice('');
      setTicketType('e-ticket');
      setQuantity('1');
      setCategory('');
      setBlock('');
      setRow('');
      setSeat('');
      setStatus('active');
    }
  }, [open, listingToEdit]);

  const parsedListPrice = parseFloat(price.replace(',', '.'));
  const listPriceOk = price.trim() !== '' && !Number.isNaN(parsedListPrice) && parsedListPrice >= 0;
  const sellerAmountComputed = listPriceOk ? sellerNetFromListPrice(parsedListPrice, commissionPct) : NaN;
  const sellerDisplay =
    listPriceOk && Number.isFinite(sellerAmountComputed) ? formatCurrency(sellerAmountComputed) : '—';

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      toast.error('Satıcı üye seçin.');
      return;
    }
    const p = parseFloat(price.replace(',', '.'));
    const q = parseInt(quantity, 10);
    if (Number.isNaN(p) || p < 0) {
      toast.error('Geçerli bir liste fiyatı girin.');
      return;
    }
    const s = sellerNetFromListPrice(p, commissionPct);
    if (!Number.isFinite(s) || s < 0) {
      toast.error('Satıcı tutarı hesaplanamadı; fiyat ve komisyonu kontrol edin.');
      return;
    }
    if (Number.isNaN(q) || q < 1) {
      toast.error('Adet en az 1 olmalı.');
      return;
    }
    const soldMin = listingToEdit?.soldQuantity ?? 0;
    if (q < soldMin) {
      toast.error(`Adet, satılan adetten (${soldMin}) küçük olamaz.`);
      return;
    }
    if (!category.trim()) {
      toast.error('Kategori zorunlu (ör. Tribün, VIP).');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && listingToEdit) {
        await listingService.update(listingToEdit._id, {
          memberId,
          price: p,
          sellerAmount: s,
          ticketType,
          quantity: q,
          category: category.trim(),
          block: block.trim() || undefined,
          row: row.trim() || undefined,
          seat: seat.trim() || undefined,
          status,
        });
        toast.success('İlan güncellendi.');
      } else {
        await listingService.create({
          eventId,
          memberId,
          price: p,
          sellerAmount: s,
          ticketType,
          quantity: q,
          category: category.trim(),
          block: block.trim() || undefined,
          row: row.trim() || undefined,
          seat: seat.trim() || undefined,
          status,
        });
        toast.success('İlan oluşturuldu.');
      }
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg ?? (isEdit ? 'İlan güncellenemedi.' : 'İlan oluşturulamadı.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'İlanı düzenle' : 'Bu etkinlik için ilan ekle'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {memberOptions.length === 0 ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Aktif üye yok. Önce üye kaydı oluşturun veya üyeyi aktifleştirin.
          </p>
        ) : (
          <Select
            label="Satıcı üye *"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            options={memberOptions}
            placeholder="Üye seçin"
            required
          />
        )}

        <p className="text-xs text-gray-500 -mt-1">
          Etkinlik satıcı komisyonu <span className="font-medium text-gray-700">%{commissionPct}</span>. Satıcıya
          kalacak tutar liste fiyatından otomatik hesaplanır.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Liste / satış fiyatı (TRY) *"
            type="number"
            step="0.01"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Satıcıya kalacak tutar</span>
            <div
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900 min-h-[42px] flex items-center"
              aria-live="polite"
            >
              {sellerDisplay}
            </div>
            <span className="text-xs text-gray-400">Komisyon düşülmüş net tutar (salt okunur)</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Bilet türü *"
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value)}
            options={TICKET_TYPES}
          />
          <div>
            <Input
              label="Adet *"
              type="number"
              min={isEdit ? listingToEdit?.soldQuantity || 1 : 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            {isEdit && listingToEdit != null && listingToEdit.soldQuantity > 0 ? (
              <p className="mt-1 text-xs text-gray-500">Satılan: {listingToEdit.soldQuantity} (adet bunun altına inemez)</p>
            ) : null}
          </div>
        </div>

        <Input
          label="Kategori *"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Örn. Maraton Alt, VIP, Mavi tribün"
          required
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Blok" value={block} onChange={(e) => setBlock(e.target.value)} placeholder="Opsiyonel" />
          <Input label="Sıra" value={row} onChange={(e) => setRow(e.target.value)} placeholder="Opsiyonel" />
          <Input label="Koltuk" value={seat} onChange={(e) => setSeat(e.target.value)} placeholder="Opsiyonel" />
        </div>

        <Select
          label="İlan durumu"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={STATUS_OPTIONS}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={handleClose}>
            Vazgeç
          </Button>
          <Button type="submit" loading={loading} disabled={!isEdit && memberOptions.length === 0}>
            {isEdit ? 'Kaydet' : 'İlanı oluştur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
