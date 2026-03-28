'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { saleService } from '@/services/sale.service';
import { listingMemberId } from '@/lib/listing-member';
import { Listing, Member } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { FlaskConical } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  listing: Listing | null;
  members: Member[];
  onSuccess: () => void;
}

/**
 * Üye listesi: İlan ekle modalı ile aynı — sadece `members` prop, `status === 'active'`,
 * satıcı (ilan.memberId) hariç.
 */
export default function TestSaleModal({ open, onClose, listing, members, onSuccess }: Props) {
  const [buyerId, setBuyerId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  const sellerMemberId = listing ? listingMemberId(listing) : '';
  const available = listing
    ? Math.max(0, (listing.quantity ?? 0) - (listing.soldQuantity ?? 0))
    : 0;

  const buyerOptions = members
    .filter((m) => {
      if (m.status !== 'active') return false;
      return m._id !== sellerMemberId;
    })
    .map((m) => ({
      value: m._id,
      label: `${m.name} ${m.surname} — ${m.email}`,
    }));

  useEffect(() => {
    if (!open || !listing) return;
    setBuyerId('');
    setQuantity('1');
  }, [open, listing?._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    if (!buyerId) {
      toast.error('Test alıcısı seçin.');
      return;
    }
    const q = parseInt(quantity, 10);
    if (Number.isNaN(q) || q < 1) {
      toast.error('Adet en az 1 olmalı.');
      return;
    }
    if (q > available) {
      toast.error(`En fazla ${available} bilet (kalan kontenjan).`);
      return;
    }
    setLoading(true);
    try {
      const res = await saleService.createTest({
        listingId: listing._id,
        buyerMemberId: buyerId,
        quantity: q,
      });
      if (res.success === false) {
        toast.error(typeof res.message === 'string' ? res.message : 'İşlem başarısız.');
        return;
      }
      toast.success('Test satışı oluşturuldu. Satışlar listesinde görünür (onay bekliyor).');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg ?? 'Test satışı oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  if (!listing) return null;

  return (
    <Modal open={open} onClose={onClose} title="Test satışı" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
          <FlaskConical className="h-5 w-5 shrink-0 text-amber-700" />
          <p>
            Gerçek ödeme ve Stripe yok. Kayıt <strong>pending_approval</strong> ile oluşur; ödeme ve satış
            onayını panelden sen yönetirsin. İlan <strong>soldQuantity</strong> bu adet kadar artar.
          </p>
        </div>
        <div className="text-sm text-gray-600">
          <p>
            Kategori: <span className="font-medium text-gray-900">{listing.category}</span>
          </p>
          <p className="mt-1">
            Liste fiyatı (birim):{' '}
            <span className="font-medium text-gray-900">{formatCurrency(listing.price)}</span>
          </p>
          <p className="mt-1">
            Kalan kontenjan: <span className="font-medium text-gray-900">{available}</span>
          </p>
        </div>
        <Select
          label="Test alıcısı (üye)"
          value={buyerId}
          onChange={(e) => setBuyerId(e.target.value)}
          options={buyerOptions}
          placeholder="Seçin…"
        />
        {buyerOptions.length === 0 && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
            <strong>Satıcı alıcı olamaz</strong> — bu ilanın sahibi (ör. seed{' '}
            <code className="rounded bg-white/80 px-1 text-xs">seed.seller@example.com</code>) listede
            görünmez. Test için başka bir <strong>aktif</strong> üye gerekir; geliştirme seed’inde{' '}
            <code className="rounded bg-white/80 px-1 text-xs">seed.buyer@example.com</code> oluşturulur
            (backend’i yeniden başlat veya seed’i çalıştır). Pasif üyeler de listelenmez.
          </p>
        )}
        <Input
          label="Bilet adedi"
          type="number"
          min={1}
          max={Math.max(1, available)}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={available < 1}>
            Test satışı oluştur
          </Button>
        </div>
      </form>
    </Modal>
  );
}
