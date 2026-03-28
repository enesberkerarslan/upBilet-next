import { serverFetch } from '@/lib/server-fetch';
import { Member } from '@/types';
import MembersClient from './MembersClient';

export default async function MembersPage() {
  let members: Member[] = [];
  try {
    const res = await serverFetch<{ data: Member[] }>('/members/get-all-members');
    members = res.data ?? [];
  } catch {
    members = [];
  }
  return <MembersClient initialMembers={members} />;
}
