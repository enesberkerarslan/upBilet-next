'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { memberService } from '@/services/member.service';
import { Member, PaymentPeriod } from '@/types';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge, { statusVariant } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

interface Props {
  member: Member;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function MemberDetailModal({ member, open, onClose, onRefresh }: Props) {
  const [periods, setPeriods] = useState<PaymentPeriod[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [addForm, setAddForm] = useState({ startDate: '', endDate: '', totalAmount: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadPeriods = async () => {
    setLoadingPeriods(true);
    try {
      const res = await memberService.getPaymentPeriods(member._id);
      setPeriods(res.data ?? []);
    } catch {
      toast.error('Dönemler yüklenemedi.');
    } finally {
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    if (open) loadPeriods();
  }, [open, member._id]);

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.startDate || !addForm.endDate || !addForm.totalAmount) {
      toast.error('Tüm alanlar zorunludur.');
      return;
    }
    setAddLoading(true);
    try {
      await memberService.addPaymentPeriod(member._id, {
        startDate: addForm.startDate,
        endDate: addForm.endDate,
        totalAmount: Number(addForm.totalAmount),
      });
      toast.success('Dönem eklendi.');
      setAddForm({ startDate: '', endDate: '', totalAmount: '' });
      loadPeriods();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Eklenemedi.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleMarkPaid = async (periodId: string) => {
    setActionLoading(periodId);
    try {
      await memberService.markPeriodAsPaid(member._id, periodId);
      toast.success('Ödendi olarak işaretlendi.');
      loadPeriods();
      onRefresh();
    } catch {
      toast.error('İşlem başarısız.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    setActionLoading('del_' + periodId);
    try {
      await memberService.deletePaymentPeriod(member._id, periodId);
      toast.success('Dönem silindi.');
      loadPeriods();
    } catch {
      toast.error('Silinemedi.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`${member.name} ${member.surname}`} size="xl">
      <div className="space-y-6">
        {/* Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Email</p><p className="font-medium mt-0.5">{member.email}</p></div>
          <div><p className="text-gray-500">Telefon</p><p className="font-medium mt-0.5">{member.phone ?? '-'}</p></div>
          <div>
            <p className="text-gray-500">Rol</p>
            <div className="mt-0.5"><Badge label={member.role === 'broker' ? 'Broker' : 'Kullanıcı'} variant={statusVariant[member.role]} /></div>
          </div>
          <div>
            <p className="text-gray-500">Durum</p>
            <div className="mt-0.5"><Badge label={member.status} variant={statusVariant[member.status]} /></div>
          </div>
          <div>
            <p className="text-gray-500">Kayıt tarihi</p>
            <p className="font-medium mt-0.5">{formatDateTime(member.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-500">Son giriş</p>
            <p className="font-medium mt-0.5">{member.lastLogin ? formatDateTime(member.lastLogin) : '—'}</p>
          </div>
          <div><p className="text-gray-500">Banka Hesabı</p><p className="font-medium mt-0.5">{member.bankAccounts?.length ?? 0} adet</p></div>
        </div>

        {/* Payment Periods */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Ödeme Dönemleri</h3>

          {loadingPeriods ? (
            <p className="text-sm text-gray-400">Yükleniyor...</p>
          ) : periods.length === 0 ? (
            <p className="text-sm text-gray-400">Henüz dönem eklenmemiş.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {periods.map((p) => (
                <div key={p._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(p.startDate)} — {formatDate(p.endDate)}
                    </p>
                    <p className="text-xs text-gray-500">{formatCurrency(p.totalAmount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={p.status === 'paid' ? 'Ödendi' : 'Bekliyor'} variant={p.status === 'paid' ? 'green' : 'yellow'} />
                    {p.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<CheckCircle size={13} />}
                        loading={actionLoading === p._id}
                        onClick={() => handleMarkPaid(p._id)}
                      >
                        Ödendi
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      icon={<Trash2 size={13} />}
                      loading={actionLoading === 'del_' + p._id}
                      onClick={() => handleDeletePeriod(p._id)}
                    >
                      Sil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddPeriod} className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border-t pt-4">
            <Input
              label="Başlangıç"
              type="date"
              value={addForm.startDate}
              onChange={(e) => setAddForm((p) => ({ ...p, startDate: e.target.value }))}
            />
            <Input
              label="Bitiş"
              type="date"
              value={addForm.endDate}
              onChange={(e) => setAddForm((p) => ({ ...p, endDate: e.target.value }))}
            />
            <Input
              label="Tutar (₺)"
              type="number"
              value={addForm.totalAmount}
              onChange={(e) => setAddForm((p) => ({ ...p, totalAmount: e.target.value }))}
              placeholder="0"
            />
            <Button type="submit" size="sm" loading={addLoading} icon={<Plus size={14} />}>
              Dönem Ekle
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
