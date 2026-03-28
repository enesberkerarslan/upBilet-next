import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-fetch';
import { Member } from '@/types';
import MemberDetailContent from './MemberDetailContent';

type PageProps = { params: Promise<{ id: string }> };

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;

  let member: Member | null = null;
  try {
    const res = await serverFetch<{ success?: boolean; data: Member }>(`/members/get-member-by-id/${id}`);
    member = res.data ?? null;
  } catch {
    member = null;
  }

  if (!member) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link href="/members" className="font-medium text-indigo-600 hover:underline">
          ← Üyelere dön
        </Link>
      </div>
      <MemberDetailContent member={member} />
    </div>
  );
}
