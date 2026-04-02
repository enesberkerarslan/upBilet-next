'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { listingService } from '@/services/listing.service';
import { venueService } from '@/services/venue.service';
import { Listing, Member } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { listingMemberId } from '@/lib/listing-member';
import { sellerNetFromListPrice } from '@/lib/listing-duplicate';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const TICKET_TYPES = [
  { value: 'e-ticket', label: 'E-bilet' },
  { value: 'paper', label: 'Basılı (paper)' },
  { value: 'pdf', label: 'PDF' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'pending', label: 'Onay bekliyor' },
  { value: 'inactive', label: 'Pasif' },
];

type VenueBlock = { _id?: string; name: string };
type VenueCategory = { _id: string; name: string; blocks?: VenueBlock[] };
type VenueStructureDoc = { _id?: string; venueId?: string; categories?: VenueCategory[] };

interface Props {
  open: boolean;
  onClose: () => void;
  eventId: string;
  members: Member[];
  /** Etkinlik satıcı komisyon (%) */
  sellerCommissionPercent: number;
  onSuccess: () => void;
  listingToEdit?: Listing | null;
  /** EtkinlikAlanı etiketi _id — tanımlıysa kategori/blok açılır listeden */
  venueTagId?: string | null;
}

export default function EventListingFormModal({
  open,
  onClose,
  eventId,
  members,
  sellerCommissionPercent,
  onSuccess,
  listingToEdit = null,
  venueTagId = null,
}: Props) {
  const isEdit = !!listingToEdit;
  const commissionPct = Number.isFinite(sellerCommissionPercent) ? sellerCommissionPercent : 20;
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [price, setPrice] = useState('');
  const [ticketType, setTicketType] = useState('e-ticket');
  const [quantity, setQuantity] = useState('1');
  const [row, setRow] = useState('');
  const [seat, setSeat] = useState('');
  const [status, setStatus] = useState('active');

  const [structure, setStructure] = useState<VenueStructureDoc | null>(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const [structureError, setStructureError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedBlockName, setSelectedBlockName] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualBlock, setManualBlock] = useState('');
  const [editUseManual, setEditUseManual] = useState(false);

  const categories = structure?.categories ?? [];
  const pickerBase = Boolean(venueTagId && categories.length > 0);
  const showPicker = pickerBase && !editUseManual;

  const blockOptions = useMemo(() => {
    if (!selectedCategoryId || !categories.length) return [];
    const cat = categories.find((c) => c._id === selectedCategoryId);
    const blocks = cat?.blocks ?? [];
    return blocks.map((b) => ({ value: b.name, label: b.name }));
  }, [selectedCategoryId, categories]);

  const categorySelectOptions = useMemo(
    () => categories.map((c) => ({ value: c._id, label: c.name })),
    [categories]
  );

  useEffect(() => {
    if (!open || !venueTagId) {
      setStructure(null);
      setStructureError('');
      setStructureLoading(false);
      return;
    }
    let cancelled = false;
    setStructureLoading(true);
    setStructureError('');
    (async () => {
      try {
        const doc = (await venueService.getByVenueTagId(venueTagId)) as VenueStructureDoc;
        if (!cancelled) {
          setStructure(doc?.categories ? doc : null);
        }
      } catch {
        if (!cancelled) {
          setStructure(null);
          setStructureError('Mekan yapısı yüklenemedi. Kategori ve blok metin olarak girilebilir.');
        }
      } finally {
        if (!cancelled) setStructureLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, venueTagId]);

  useEffect(() => {
    if (!open) return;
    if (listingToEdit) {
      setMemberId(listingMemberId(listingToEdit));
      setPrice(listingToEdit.price != null ? String(listingToEdit.price) : '');
      setTicketType(listingToEdit.ticketType || 'e-ticket');
      setQuantity(String(listingToEdit.quantity ?? 1));
      setRow(listingToEdit.row ?? '');
      setSeat(listingToEdit.seat ?? '');
      setStatus(listingToEdit.status || 'active');
    } else {
      setMemberId('');
      setPrice('');
      setTicketType('e-ticket');
      setQuantity('1');
      setRow('');
      setSeat('');
      setStatus('active');
    }
  }, [open, listingToEdit]);

  useEffect(() => {
    if (!open) return;
    if (listingToEdit && categories.length > 0) {
      const matched = categories.some((c) => c.name === listingToEdit.category);
      setEditUseManual(!matched);
    } else {
      setEditUseManual(false);
    }
  }, [open, listingToEdit, categories]);

  useEffect(() => {
    if (!open) return;
    if (listingToEdit) {
      if (categories.length > 0) {
        const cat = categories.find((c) => c.name === listingToEdit.category);
        if (cat) {
          setSelectedCategoryId(cat._id);
          const b = listingToEdit.block?.trim();
          setSelectedBlockName(
            b && cat.blocks?.some((x) => x.name === b) ? b : ''
          );
          setManualCategory('');
          setManualBlock('');
        } else {
          setSelectedCategoryId('');
          setSelectedBlockName('');
          setManualCategory(listingToEdit.category ?? '');
          setManualBlock(listingToEdit.block ?? '');
        }
      } else {
        setSelectedCategoryId('');
        setSelectedBlockName('');
        setManualCategory(listingToEdit.category ?? '');
        setManualBlock(listingToEdit.block ?? '');
      }
    } else {
      setSelectedCategoryId('');
      setSelectedBlockName('');
      setManualCategory('');
      setManualBlock('');
    }
  }, [open, listingToEdit, categories]);

  const memberOptions = members.filter((m) => {
    if (m.status === 'active') return true;
    if (!listingToEdit) return false;
    return m._id === listingMemberId(listingToEdit);
  }).map((m) => ({
    value: m._id,
    label: `${m.name} ${m.surname} — ${m.email}`,
  }));

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

    let categoryOut = '';
    let blockOut: string | undefined;
    if (showPicker) {
      const cat = categories.find((c) => c._id === selectedCategoryId);
      categoryOut = (cat?.name ?? '').trim();
      if (!categoryOut) {
        toast.error('Bilet kategorisi seçin.');
        return;
      }
      blockOut = selectedBlockName.trim() || undefined;
    } else {
      categoryOut = manualCategory.trim();
      if (!categoryOut) {
        toast.error('Kategori zorunludur.');
        return;
      }
      blockOut = manualBlock.trim() || undefined;
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
          category: categoryOut,
          block: blockOut,
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
          category: categoryOut,
          block: blockOut,
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

        {venueTagId && structureLoading ? (
          <p className="text-sm text-gray-500">Mekan kategorileri yükleniyor…</p>
        ) : null}
        {structureError ? <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">{structureError}</p> : null}

        {showPicker ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Bilet kategorisi *"
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedBlockName('');
              }}
              options={categorySelectOptions}
              placeholder="Kategori seçin"
              required
            />
            <Select
              label="Blok"
              value={selectedBlockName}
              onChange={(e) => setSelectedBlockName(e.target.value)}
              options={blockOptions}
              placeholder={blockOptions.length ? 'Blok seçin (opsiyonel)' : 'Bu kategoride blok tanımlı değil'}
              disabled={!selectedCategoryId || blockOptions.length === 0}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kategori *"
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              placeholder="Örn. Üst Kat, VIP"
              required
            />
            <Input label="Blok" value={manualBlock} onChange={(e) => setManualBlock(e.target.value)} placeholder="Opsiyonel" />
          </div>
        )}

        {editUseManual && pickerBase && listingToEdit ? (
          <p className="text-xs text-gray-500">
            İlandaki kategori mevcut mekan listesinde yok; metin alanları kullanılıyor.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
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
