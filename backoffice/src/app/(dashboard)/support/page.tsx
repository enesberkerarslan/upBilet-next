import { serverFetch } from '@/lib/server-fetch';
import type { SupportTopicListItem } from '@/types';
import SupportClient from './SupportClient';

export default async function SupportPage() {
  let items: SupportTopicListItem[] = [];
  let pagination = { page: 1, limit: 50, total: 0, totalPages: 1 };
  try {
    const res = await serverFetch<{
      success: boolean;
      data?: {
        items: SupportTopicListItem[];
        pagination: typeof pagination;
      };
    }>('/support/topics?limit=50');
    if (res.success && res.data) {
      items = res.data.items ?? [];
      pagination = res.data.pagination ?? pagination;
    }
  } catch {
    items = [];
  }

  return <SupportClient initialItems={items} initialPagination={pagination} />;
}
