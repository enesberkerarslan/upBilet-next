'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, ToggleLeft } from 'lucide-react';
import { memberService } from '@/services/member.service';
import { Member } from '@/types';
import { formatDateTime } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge, { statusVariant } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

export default function MembersClient({ initialMembers }: { initialMembers: Member[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleToggle = async (member: Member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    try {
      await memberService.toggleStatus(member._id, newStatus);
      toast.success('Durum güncellendi.');
      router.refresh();
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const filtered = initialMembers.filter((m) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.surname.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m._id.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: '_id',
      header: 'Üye ID',
      className: 'max-w-[200px]',
      render: (row: Member) => (
        <span className="font-mono text-[11px] text-gray-600 break-all" title={row._id}>
          {row._id}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Üye',
      render: (row: Member) => (
        <Link
          href={`/members/${row._id}`}
          className="group block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <p className="font-medium text-gray-900 group-hover:text-indigo-600">
            {row.name} {row.surname}
          </p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </Link>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      render: (row: Member) => (
        <Badge label={row.role === 'broker' ? 'Broker' : 'Kullanıcı'} variant={statusVariant[row.role]} />
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: (row: Member) => <Badge label={row.status} variant={statusVariant[row.status]} />,
    },
    { key: 'phone', header: 'Telefon', render: (row: Member) => row.phone ?? '-' },
    {
      key: 'createdAt',
      header: 'Kayıt tarihi',
      render: (row: Member) => (
        <span className="whitespace-nowrap text-gray-700">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Son giriş',
      render: (row: Member) => (
        <span className="whitespace-nowrap text-gray-700">
          {row.lastLogin ? formatDateTime(row.lastLogin) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (row: Member) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/members/${row._id}`}
            className="inline-flex h-8 min-w-[88px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            <Eye size={14} />
            Detay
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="h-8 min-w-[88px] justify-center"
            icon={<ToggleLeft size={14} />}
            onClick={() => handleToggle(row)}
          >
            Durum
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Üyeler" description={`Toplam ${initialMembers.length} üye`} />
      <div className="mb-4">
        <Input
          placeholder="Ad, soyad veya email ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <Table columns={columns} data={filtered} keyExtractor={(r) => r._id} emptyText="Üye bulunamadı." />
    </div>
  );
}
