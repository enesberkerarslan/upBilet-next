'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { memberService } from '@/services/member.service';
import { listingService } from '@/services/listing.service';
import { saleService } from '@/services/sale.service';
import { Address, BankAccount, Event, Listing, Member, MemberFavoriteTag, PaymentPeriod, Sale } from '@/types';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import SaleDetailModal from '@/app/(dashboard)/sales/SaleDetailModal';
import { formatDate, formatDateTime, formatCurrency, cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge, { statusVariant } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import {
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  MapPin,
  Building2,
  Ticket,
  Clock,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  Tag as TagIcon,
  Wallet,
  MessageCircle,
} from 'lucide-react';
import AdminNewSupportTopicModal from '@/app/(dashboard)/support/AdminNewSupportTopicModal';

interface Props {
  member: Member;
}

function eventLabel(ev: Listing['eventId']): string {
  if (ev && typeof ev === 'object' && 'name' in ev) {
    return (ev as Event).name;
  }
  return typeof ev === 'string' ? ev : '—';
}

function eventIdStr(ev: Listing['eventId']): string | null {
  if (ev && typeof ev === 'object' && '_id' in ev) {
    return (ev as Event)._id;
  }
  return typeof ev === 'string' ? ev : null;
}

const TR_MONTHS_SHORT = [
  'OCA',
  'ŞUB',
  'MAR',
  'NİS',
  'MAY',
  'HAZ',
  'TEM',
  'AĞU',
  'EYL',
  'EKİ',
  'KAS',
  'ARA',
] as const;

function formatEventStrip(iso?: string): { top: string; bottom: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const m = TR_MONTHS_SHORT[d.getMonth()];
  return { top: `${m} ${d.getDate()}`, bottom: String(d.getFullYear()) };
}

function formatEventTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

type EventGroup = { eventId: string; event: Event | null; rows: Listing[] };

function otherMemberLabel(m: Member | string | undefined | null): string {
  if (m && typeof m === 'object' && 'name' in m) {
    return `${m.name} ${m.surname}`.trim();
  }
  if (typeof m === 'string' && m) return m;
  return '—';
}

function saleEventId(s: Sale): string | null {
  const e = s.eventId;
  if (e && typeof e === 'object' && '_id' in e) {
    return (e as Event)._id;
  }
  return typeof e === 'string' ? e : null;
}

function saleRefInPeriodSales(s: string | { _id: string }): string {
  return typeof s === 'object' && s && '_id' in s ? s._id : String(s);
}

/** Her satış id → hangi ödeme döneminde (en fazla bir dönemde olmalı) */
function buildPeriodBySaleId(periodsList: PaymentPeriod[]): Map<string, PaymentPeriod> {
  const m = new Map<string, PaymentPeriod>();
  for (const p of periodsList) {
    for (const s of p.sales ?? []) {
      const id = saleRefInPeriodSales(s);
      if (id && !m.has(id)) m.set(id, p);
    }
  }
  return m;
}

function groupListingsByEvent(listings: Listing[]): EventGroup[] {
  const map = new Map<string, { event: Event | null; rows: Listing[] }>();
  for (const row of listings) {
    const id = eventIdStr(row.eventId);
    if (!id) continue;
    const ev =
      row.eventId && typeof row.eventId === 'object' && 'name' in row.eventId
        ? (row.eventId as Event)
        : null;
    const cur = map.get(id);
    if (!cur) {
      map.set(id, { event: ev, rows: [row] });
    } else {
      cur.rows.push(row);
      if (!cur.event && ev) cur.event = ev;
    }
  }
  return Array.from(map.entries())
    .map(([eventId, v]) => ({ eventId, event: v.event, rows: v.rows }))
    .sort((a, b) => {
      const ta = a.event?.date ? new Date(a.event.date).getTime() : 0;
      const tb = b.event?.date ? new Date(b.event.date).getTime() : 0;
      return tb - ta;
    });
}

function normalizeFavoriteTags(raw: Member['favorites']): MemberFavoriteTag[] {
  const list = raw?.tags;
  if (!Array.isArray(list)) return [];
  return list.filter((t): t is MemberFavoriteTag => t != null && typeof t === 'object' && 'name' in t && '_id' in t);
}

function apiErrMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object' || !('response' in err)) return fallback;
  const d = (err as { response?: { data?: { message?: string; error?: string } } }).response?.data;
  const m = d?.message || d?.error;
  return typeof m === 'string' && m.trim() ? m : fallback;
}

const ROLE_EDIT_OPTIONS = [
  { value: 'user', label: 'Kullanıcı' },
  { value: 'broker', label: 'Broker' },
] as const;

const STATUS_EDIT_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Pasif' },
  { value: 'suspended', label: 'Askıda' },
] as const;

export default function MemberDetailContent({ member }: Props) {
  const router = useRouter();
  const addresses = member.addresses ?? [];
  const bankAccounts = member.bankAccounts ?? [];
  const favoriteTags = useMemo(() => normalizeFavoriteTags(member.favorites), [member.favorites]);

  const [periods, setPeriods] = useState<PaymentPeriod[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [addForm, setAddForm] = useState({ startDate: '', endDate: '', totalAmount: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [bulkKey, setBulkKey] = useState<string | null>(null);
  const [salesAsSeller, setSalesAsSeller] = useState<Sale[]>([]);
  const [salesAsBuyer, setSalesAsBuyer] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [saleDetail, setSaleDetail] = useState<Sale | null>(null);
  const [attachModalSale, setAttachModalSale] = useState<Sale | null>(null);
  const [attachPeriodId, setAttachPeriodId] = useState('');
  const [attachSubmitting, setAttachSubmitting] = useState(false);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [supportToMemberOpen, setSupportToMemberOpen] = useState(false);
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    role: 'user' as Member['role'],
    status: 'active' as Member['status'],
  });

  const groupedListings = useMemo(() => groupListingsByEvent(listings), [listings]);

  const pendingPeriods = useMemo(() => periods.filter((p) => p.status === 'pending'), [periods]);

  const periodBySaleId = useMemo(() => buildPeriodBySaleId(periods), [periods]);

  const openAttachSaleModal = (row: Sale) => {
    setAttachModalSale(row);
    setAttachPeriodId(pendingPeriods[0]?._id ?? '');
  };

  useEffect(() => {
    if (!editProfileOpen) return;
    setEditProfileForm({
      name: member.name ?? '',
      surname: member.surname ?? '',
      email: member.email ?? '',
      phone: member.phone ?? '',
      role: member.role === 'broker' ? 'broker' : 'user',
      status: member.status,
    });
  }, [editProfileOpen, member]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = editProfileForm.name.trim();
    const surname = editProfileForm.surname.trim();
    const email = editProfileForm.email.trim();
    if (!name) {
      toast.error('Ad zorunludur.');
      return;
    }
    if (!email) {
      toast.error('E-posta zorunludur.');
      return;
    }
    setEditProfileLoading(true);
    try {
      await memberService.update(member._id, {
        name,
        surname,
        email,
        phone: editProfileForm.phone.trim(),
        role: editProfileForm.role,
        status: editProfileForm.status,
      });
      toast.success('Üye bilgileri güncellendi.');
      setEditProfileOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(apiErrMessage(err, 'Güncellenemedi.'));
    } finally {
      setEditProfileLoading(false);
    }
  };

  const handleAttachSaleToPeriod = async () => {
    if (!attachModalSale || !attachPeriodId) {
      toast.error('Ödeme dönemi seçin.');
      return;
    }
    setAttachSubmitting(true);
    try {
      await memberService.addSaleToPaymentPeriod(member._id, attachPeriodId, attachModalSale._id);
      toast.success('Satış seçilen döneme eklendi.');
      setAttachModalSale(null);
      setAttachPeriodId('');
      await loadPeriods();
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(m ?? 'İşlem başarısız.');
    } finally {
      setAttachSubmitting(false);
    }
  };

  const loadPeriods = useCallback(async () => {
    setLoadingPeriods(true);
    try {
      const res = await memberService.getPaymentPeriods(member._id);
      setPeriods(res.data ?? []);
    } catch {
      toast.error('Dönemler yüklenemedi.');
    } finally {
      setLoadingPeriods(false);
    }
  }, [member._id]);

  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const data = await listingService.getAll({ memberId: member._id });
      setListings(Array.isArray(data) ? data : []);
    } catch {
      toast.error('İlanlar yüklenemedi.');
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, [member._id]);

  const loadSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const res = (await saleService.getByMemberId(member._id)) as {
        data?: { asSeller?: Sale[]; asBuyer?: Sale[] };
      };
      const bundle = res?.data;
      setSalesAsSeller(Array.isArray(bundle?.asSeller) ? bundle.asSeller : []);
      setSalesAsBuyer(Array.isArray(bundle?.asBuyer) ? bundle.asBuyer : []);
    } catch {
      toast.error('Satışlar yüklenemedi.');
      setSalesAsSeller([]);
      setSalesAsBuyer([]);
    } finally {
      setLoadingSales(false);
    }
  }, [member._id]);

  const openSaleDetail = useCallback(async (row: Sale) => {
    try {
      const res = (await saleService.getById(row._id)) as { data?: Sale };
      setSaleDetail(res?.data ?? row);
    } catch {
      setSaleDetail(row);
    }
  }, []);

  useEffect(() => {
    loadPeriods();
    loadListings();
    loadSales();
  }, [loadPeriods, loadListings, loadSales]);

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.startDate || !addForm.endDate) {
      toast.error('Başlangıç ve bitiş tarihlerini seçin.');
      return;
    }
    setAddLoading(true);
    try {
      const res = (await memberService.addPaymentPeriod(member._id, {
        startDate: addForm.startDate,
        endDate: addForm.endDate,
        totalAmount:
          addForm.totalAmount.trim() === '' ? 0 : Number(addForm.totalAmount.replace(',', '.')),
      })) as { meta?: { linkedSalesCount?: number }; data?: PaymentPeriod };

      const linked = res?.meta?.linkedSalesCount ?? res?.data?.sales?.length ?? 0;
      const total = res?.data?.totalAmount;
      if (linked > 0) {
        toast.success(
          `${linked} teslim edilmiş satış döneme bağlandı. Toplam tutar: ${formatCurrency(Number(total) || 0)}.`
        );
      } else {
        toast.success('Dönem eklendi.');
      }
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
      router.refresh();
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

  const toggleEventExpand = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const handleBulkMemberEvent = async (eventId: string, status: 'active' | 'inactive') => {
    setBulkKey(`${eventId}_${status}`);
    try {
      await listingService.toggleAllMemberEvent({ memberId: member._id, eventId, status });
      toast.success(status === 'active' ? 'İlanlar yayına alındı.' : 'Aktif ilanlar durduruldu.');
      await loadListings();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'İşlem başarısız.');
    } finally {
      setBulkKey(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {member.name} {member.surname}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{member.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<MessageCircle size={14} />}
              onClick={() => setSupportToMemberOpen(true)}
            >
              Destek mesajı gönder
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Pencil size={14} />}
              onClick={() => setEditProfileOpen(true)}
            >
              Bilgileri düzenle
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-gray-500">Telefon</p>
            <p className="mt-0.5 font-medium text-gray-900">{member.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">Rol</p>
            <div className="mt-0.5">
              <Badge
                label={member.role === 'broker' ? 'Broker' : 'Kullanıcı'}
                variant={statusVariant[member.role]}
              />
            </div>
          </div>
          <div>
            <p className="text-gray-500">Durum</p>
            <div className="mt-0.5">
              <Badge label={member.status} variant={statusVariant[member.status]} />
            </div>
          </div>
          <div>
            <p className="text-gray-500">Kayıt tarihi</p>
            <p className="mt-0.5 font-medium text-gray-900">{formatDateTime(member.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-500">Son giriş</p>
            <p className="mt-0.5 font-medium text-gray-900">
              {member.lastLogin ? formatDateTime(member.lastLogin) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Favori etiketler (Adresler’in üstünde) */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <TagIcon className="h-5 w-5 text-rose-500 shrink-0" />
          Favori etiketler
          {favoriteTags.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({favoriteTags.length})</span>
          )}
        </h2>
        {favoriteTags.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">Favori etiket yok.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {favoriteTags.map((t) => (
              <li
                key={t._id}
                className="rounded-full border border-rose-100 bg-rose-50/80 px-3 py-1.5 text-sm text-rose-950"
              >
                <span className="font-medium">{t.name}</span>
                {t.slug ? (
                  <span className="ml-1.5 font-mono text-xs text-rose-700/80">/{t.slug}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Adresler */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <MapPin className="h-5 w-5 text-indigo-600 shrink-0" />
          Adresler
          {addresses.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({addresses.length})</span>
          )}
        </h2>
        {addresses.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">Kayıtlı adres yok.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {addresses.map((a: Address) => (
              <li key={a._id} className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm">
                <p className="font-medium text-gray-900">{a.title}</p>
                <p className="mt-1 text-gray-700">{a.address}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {a.neighborhood}, {a.district} / {a.city} — {a.postalCode}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Banka hesapları */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Building2 className="h-5 w-5 text-indigo-600 shrink-0" />
          Banka hesapları
          {bankAccounts.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({bankAccounts.length})</span>
          )}
        </h2>
        {bankAccounts.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">Kayıtlı banka hesabı yok.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bankAccounts.map((b: BankAccount) => (
              <li key={b._id} className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm">
                <p className="font-medium text-gray-900">{b.bankName}</p>
                <p className="mt-0.5 text-gray-700">Hesap sahibi: {b.accountHolder}</p>
                <p className="mt-1 font-mono text-xs text-gray-600 break-all">IBAN: {b.iban}</p>
                {b.swiftCode ? (
                  <p className="mt-0.5 text-xs text-gray-500">SWIFT: {b.swiftCode}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Satışlar: satıcı / alıcı */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Bilet satışları</h2>
        <p className="mt-1 text-sm text-gray-500">
          Bu üyenin satıcı veya alıcı olduğu tüm kayıtlar (siparişler).
        </p>

        {loadingSales ? (
          <p className="mt-4 text-sm text-gray-400">Satışlar yükleniyor...</p>
        ) : (
          <div className="mt-6 space-y-8">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <ArrowUpRight className="h-4 w-4 shrink-0" />
                Sattığı biletler
                {salesAsSeller.length > 0 && (
                  <span className="font-normal text-gray-500">({salesAsSeller.length})</span>
                )}
              </h3>
              <Table
                columns={[
                  {
                    key: 'event',
                    header: 'Etkinlik',
                    render: (row: Sale) => {
                      const name =
                        typeof row.eventId === 'object'
                          ? (row.eventId as Event).name
                          : row.eventId;
                      const eid = saleEventId(row);
                      return eid ? (
                        <Link
                          href={`/events/${eid}`}
                          className="text-sm font-medium text-indigo-600 hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium">{name}</span>
                      );
                    },
                  },
                  {
                    key: 'buyer',
                    header: 'Alıcı',
                    render: (row: Sale) => (
                      <span className="text-sm whitespace-nowrap">{otherMemberLabel(row.buyer)}</span>
                    ),
                  },
                  {
                    key: 'qty',
                    header: 'Adet',
                    render: (row: Sale) => row.ticketQuantity,
                  },
                  {
                    key: 'sellerTotal',
                    header: 'Satıcı payı',
                    render: (row: Sale) => formatCurrency(row.sellerTotalAmount ?? row.sellerAmount),
                  },
                  {
                    key: 'payment',
                    header: 'Ödeme',
                    render: (row: Sale) => (
                      <Badge label={row.paymentStatus} variant={statusVariant[row.paymentStatus] ?? 'gray'} />
                    ),
                  },
                  {
                    key: 'delivery',
                    header: 'deliveryStatus',
                    render: (row: Sale) => (
                      <Badge label={row.deliveryStatus} variant={statusVariant[row.deliveryStatus] ?? 'gray'} />
                    ),
                  },
                  {
                    key: 'payoutPeriod',
                    header: 'Ödeme dönemi',
                    render: (row: Sale) => {
                      const p = periodBySaleId.get(row._id);
                      if (!p) {
                        return (
                          <span className="text-xs text-gray-400 whitespace-nowrap" title="Henüz bir döneme eklenmedi">
                            Ekli değil
                          </span>
                        );
                      }
                      return (
                        <div className="flex flex-col gap-1 min-w-0 max-w-44">
                          <span className="text-xs text-gray-800 leading-tight">
                            {formatDate(p.startDate)} — {formatDate(p.endDate)}
                          </span>
                          <span className="w-fit">
                            <Badge
                              label={p.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                              variant={p.status === 'paid' ? 'green' : 'yellow'}
                            />
                          </span>
                        </div>
                      );
                    },
                  },
                  {
                    key: 'date',
                    header: 'Tarih',
                    render: (row: Sale) => (
                      <span className="whitespace-nowrap text-gray-700">{formatDateTime(row.saleDate)}</span>
                    ),
                  },
                  {
                    key: 'act',
                    header: '',
                    render: (row: Sale) => (
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Wallet size={14} />}
                          disabled={pendingPeriods.length === 0}
                          title={
                            pendingPeriods.length === 0
                              ? 'Önce bekleyen bir ödeme dönemi ekleyin'
                              : periodBySaleId.has(row._id)
                                ? 'Başka döneme taşımak için tıklayın'
                                : 'Ödeme dönemine ekle'
                          }
                          onClick={() => openAttachSaleModal(row)}
                        >
                          Döneme
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Eye size={14} />}
                          onClick={() => void openSaleDetail(row)}
                        >
                          Detay
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={salesAsSeller}
                keyExtractor={(r) => r._id}
                emptyText="Satıcı olduğu satış yok."
                maxHeightClass={salesAsSeller.length > 8 ? 'max-h-136' : undefined}
              />
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-800">
                <ArrowDownLeft className="h-4 w-4 shrink-0" />
                Satın aldığı biletler
                {salesAsBuyer.length > 0 && (
                  <span className="font-normal text-gray-500">({salesAsBuyer.length})</span>
                )}
              </h3>
              <Table
                columns={[
                  {
                    key: 'event',
                    header: 'Etkinlik',
                    render: (row: Sale) => {
                      const name =
                        typeof row.eventId === 'object'
                          ? (row.eventId as Event).name
                          : row.eventId;
                      const eid = saleEventId(row);
                      return eid ? (
                        <Link
                          href={`/events/${eid}`}
                          className="text-sm font-medium text-indigo-600 hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium">{name}</span>
                      );
                    },
                  },
                  {
                    key: 'seller',
                    header: 'Satıcı',
                    render: (row: Sale) => (
                      <span className="text-sm whitespace-nowrap">{otherMemberLabel(row.seller)}</span>
                    ),
                  },
                  {
                    key: 'qty',
                    header: 'Adet',
                    render: (row: Sale) => row.ticketQuantity,
                  },
                  {
                    key: 'total',
                    header: 'Ödenen',
                    render: (row: Sale) => formatCurrency(row.totalAmount),
                  },
                  {
                    key: 'payment',
                    header: 'Ödeme',
                    render: (row: Sale) => (
                      <Badge label={row.paymentStatus} variant={statusVariant[row.paymentStatus] ?? 'gray'} />
                    ),
                  },
                  {
                    key: 'delivery',
                    header: 'deliveryStatus',
                    render: (row: Sale) => (
                      <Badge label={row.deliveryStatus} variant={statusVariant[row.deliveryStatus] ?? 'gray'} />
                    ),
                  },
                  {
                    key: 'date',
                    header: 'Tarih',
                    render: (row: Sale) => (
                      <span className="whitespace-nowrap text-gray-700">{formatDateTime(row.saleDate)}</span>
                    ),
                  },
                  {
                    key: 'act',
                    header: '',
                    render: (row: Sale) => (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Eye size={14} />}
                        onClick={() => void openSaleDetail(row)}
                      >
                        Detay
                      </Button>
                    ),
                  },
                ]}
                data={salesAsBuyer}
                keyExtractor={(r) => r._id}
                emptyText="Alıcı olduğu satış yok."
                maxHeightClass={salesAsBuyer.length > 8 ? 'max-h-136' : undefined}
              />
            </div>
          </div>
        )}
      </div>

      {/* İlanlar */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Ticket className="h-5 w-5 text-indigo-600 shrink-0" />
          İlanlar
          {!loadingListings && listings.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({listings.length})</span>
          )}
        </h2>
        {loadingListings ? (
          <p className="mt-4 text-sm text-gray-400">Yükleniyor...</p>
        ) : listings.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">Bu üyeye ait ilan yok.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {groupedListings.map((g) => {
              const open = expandedEvents.has(g.eventId);
              const ev = g.event;
              const strip = formatEventStrip(ev?.date);
              const activeCount = g.rows.filter((r) => r.status === 'active').length;
              const inactiveCount = g.rows.filter((r) => r.status === 'inactive').length;
              const pendingCount = g.rows.filter((r) => r.status === 'pending').length;
              const title = ev?.name ?? eventLabel(g.rows[0]?.eventId);
              const loc = ev?.location ?? '—';
              const timeStr = formatEventTime(ev?.date);
              const tableScroll = g.rows.length > 10;

              return (
                <div
                  key={g.eventId}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleEventExpand(g.eventId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleEventExpand(g.eventId);
                      }
                    }}
                    className="flex min-h-22 w-full cursor-pointer items-stretch text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
                  >
                    <div className="flex w-19 shrink-0 flex-col items-center justify-center bg-emerald-600 px-2 py-3 text-center text-white">
                      {strip ? (
                        <>
                          <span className="text-[11px] font-bold leading-tight tracking-wide">
                            {strip.top}
                          </span>
                          <span className="text-[11px] font-semibold leading-tight">{strip.bottom}</span>
                        </>
                      ) : (
                        <span className="text-[10px] font-semibold">—</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 px-4 py-3">
                      <p className="text-base font-bold text-emerald-700">
                        {g.eventId ? (
                          <Link
                            href={`/events/${g.eventId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline"
                          >
                            {title}
                          </Link>
                        ) : (
                          title
                        )}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{loc}</span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        {timeStr}
                      </p>
                    </div>

                    <div
                      className="flex shrink-0 flex-col justify-center gap-2 border-l border-gray-100 px-3 py-2 sm:flex-row sm:items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-stretch gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 focus:ring-emerald-500"
                          loading={bulkKey === `${g.eventId}_active`}
                          onClick={() => handleBulkMemberEvent(g.eventId, 'active')}
                        >
                          Tüm İlanları Yayınla
                        </Button>
                        <span className="text-center text-[11px] text-gray-500">
                          Aktif: {activeCount} Adet
                        </span>
                      </div>
                      <div className="flex flex-col items-stretch gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 focus:ring-rose-500"
                          loading={bulkKey === `${g.eventId}_inactive`}
                          onClick={() => handleBulkMemberEvent(g.eventId, 'inactive')}
                        >
                          Tüm İlanları Durdur
                        </Button>
                        <span className="text-center text-[11px] text-gray-500">
                          Pasif: {inactiveCount} Adet
                          {pendingCount > 0 ? ` · Bekleyen: ${pendingCount}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-12 shrink-0 items-center justify-center border-l border-gray-100 bg-gray-50/80">
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 text-gray-500 transition-transform duration-200',
                          open && 'rotate-180'
                        )}
                        aria-hidden
                      />
                    </div>
                  </div>

                  {open ? (
                    <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-4">
                      <div
                        className={cn(
                          'rounded-lg border border-gray-200 bg-white',
                          tableScroll && 'max-h-136 overflow-auto'
                        )}
                      >
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="sticky top-0 z-1 bg-gray-50 shadow-sm">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                                Kategori
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                                Fiyat
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                                Satıcıya kalan
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                                Adet
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                                Durum
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {g.rows.map((row) => (
                              <tr key={row._id} className="hover:bg-gray-50">
                                <td className="max-w-[160px] truncate px-3 py-2 text-gray-600">
                                  {row.category}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2">
                                  {formatCurrency(row.price)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2">
                                  {row.sellerAmount != null &&
                                  Number.isFinite(Number(row.sellerAmount))
                                    ? formatCurrency(Number(row.sellerAmount))
                                    : '—'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2">
                                  {row.soldQuantity}/{row.quantity}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2">
                                  <Badge
                                    label={row.status}
                                    variant={statusVariant[row.status] ?? 'gray'}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ödeme dönemleri */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Ödeme dönemleri</h2>

        {loadingPeriods ? (
          <p className="mt-4 text-sm text-gray-400">Yükleniyor...</p>
        ) : periods.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">Henüz dönem eklenmemiş.</p>
        ) : (
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {periods.map((p) => (
              <div
                key={p._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(p.startDate)} — {formatDate(p.endDate)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(p.totalAmount)}
                    {Array.isArray(p.sales) && p.sales.length > 0
                      ? ` · ${p.sales.length} satış`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    label={p.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                    variant={p.status === 'paid' ? 'green' : 'yellow'}
                  />
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

        <p className="mt-4 text-xs text-gray-500">
          Seçilen tarih aralığında <strong>teslim edilmiş</strong> ve ödemesi <strong>tamamlanmış</strong> satışlar
          otomatik olarak döneme eklenir; tutar bu satışların satıcı toplamından hesaplanır. Eşleşen satış yoksa
          tutarı elle girmeniz gerekir.
        </p>

        <form
          onSubmit={handleAddPeriod}
          className="mt-4 grid grid-cols-1 items-end gap-3 border-t border-gray-100 pt-6 sm:grid-cols-4"
        >
          <Input
            label="Başlangıç"
            type="date"
            value={addForm.startDate}
            onChange={(e) => setAddForm((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <Input
            label="Bitiş"
            type="date"
            value={addForm.endDate}
            onChange={(e) => setAddForm((prev) => ({ ...prev, endDate: e.target.value }))}
          />
          <Input
            label="Tutar (₺) — satış yoksa zorunlu"
            type="number"
            value={addForm.totalAmount}
            onChange={(e) => setAddForm((prev) => ({ ...prev, totalAmount: e.target.value }))}
            placeholder="Otomatik veya manuel"
          />
          <Button type="submit" size="sm" loading={addLoading} icon={<Plus size={14} />}>
            Dönem ekle
          </Button>
        </form>
      </div>

      <Modal
        open={editProfileOpen}
        onClose={() => {
          if (editProfileLoading) return;
          setEditProfileOpen(false);
        }}
        title="Üye bilgilerini düzenle"
        size="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Ad *"
              value={editProfileForm.name}
              onChange={(e) => setEditProfileForm((p) => ({ ...p, name: e.target.value }))}
              disabled={editProfileLoading}
            />
            <Input
              label="Soyad"
              value={editProfileForm.surname}
              onChange={(e) => setEditProfileForm((p) => ({ ...p, surname: e.target.value }))}
              disabled={editProfileLoading}
            />
            <Input
              label="E-posta *"
              type="email"
              value={editProfileForm.email}
              onChange={(e) => setEditProfileForm((p) => ({ ...p, email: e.target.value }))}
              disabled={editProfileLoading}
            />
            <Input
              label="Telefon"
              value={editProfileForm.phone}
              onChange={(e) => setEditProfileForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+90 5xx xxx xx xx"
              disabled={editProfileLoading}
            />
            <Select
              label="Rol"
              value={editProfileForm.role}
              onChange={(e) =>
                setEditProfileForm((p) => ({ ...p, role: e.target.value as Member['role'] }))
              }
              options={[...ROLE_EDIT_OPTIONS]}
              disabled={editProfileLoading}
            />
            <Select
              label="Hesap durumu"
              value={editProfileForm.status}
              onChange={(e) =>
                setEditProfileForm((p) => ({ ...p, status: e.target.value as Member['status'] }))
              }
              options={[...STATUS_EDIT_OPTIONS]}
              disabled={editProfileLoading}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              disabled={editProfileLoading}
              onClick={() => setEditProfileOpen(false)}
            >
              İptal
            </Button>
            <Button type="submit" loading={editProfileLoading}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      <AdminNewSupportTopicModal
        open={supportToMemberOpen}
        onClose={() => setSupportToMemberOpen(false)}
        fixedMemberId={member._id}
        onCreated={(topicId) => {
          setSupportToMemberOpen(false);
          router.push(`/support/${topicId}`);
        }}
      />

      <Modal
        open={!!attachModalSale}
        onClose={() => {
          if (attachSubmitting) return;
          setAttachModalSale(null);
          setAttachPeriodId('');
        }}
        title="Satışı ödeme dönemine ekle"
        size="md"
      >
        <p className="text-sm text-gray-600 mb-4">
          Bu satışı hangi <strong>bekleyen</strong> ödeme dönemine dahil etmek istiyorsunuz? Satış zaten başka bir
          dönemdeyse oradan çıkarılıp seçtiğiniz döneme taşınır; dönem tutarları yeniden hesaplanır.
        </p>
        {pendingPeriods.length === 0 ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
            Bekleyen dönem yok. Önce aşağıdan tarih aralığı ile dönem oluşturun.
          </p>
        ) : (
          <Select
            label="Ödeme dönemi"
            value={attachPeriodId}
            onChange={(e) => setAttachPeriodId(e.target.value)}
            options={pendingPeriods.map((p) => ({
              value: p._id,
              label: `${formatDate(p.startDate)} — ${formatDate(p.endDate)} · ${formatCurrency(p.totalAmount)} · ${p.sales?.length ?? 0} satış`,
            }))}
          />
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            type="button"
            disabled={attachSubmitting}
            onClick={() => {
              setAttachModalSale(null);
              setAttachPeriodId('');
            }}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={attachSubmitting}
            disabled={pendingPeriods.length === 0 || !attachPeriodId}
            onClick={handleAttachSaleToPeriod}
          >
            Döneme ekle
          </Button>
        </div>
      </Modal>

      {saleDetail ? (
        <SaleDetailModal
          sale={saleDetail}
          open={!!saleDetail}
          onClose={() => setSaleDetail(null)}
          onRefresh={async () => {
            await loadSales();
            await loadPeriods();
            router.refresh();
            try {
              const res = (await saleService.getById(saleDetail._id)) as { data?: Sale };
              if (res?.data) setSaleDetail(res.data);
            } catch {
              /* */
            }
          }}
        />
      ) : null}
    </div>
  );
}
