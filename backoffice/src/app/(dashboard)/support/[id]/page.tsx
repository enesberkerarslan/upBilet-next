import { serverFetch } from '@/lib/server-fetch';
import type { SupportTopicDetailPayload } from '@/types';
import SupportDetailClient from './SupportDetailClient';

type Props = { params: Promise<{ id: string }> };

export default async function SupportDetailPage({ params }: Props) {
  const { id } = await params;
  let initial: SupportTopicDetailPayload | null = null;
  try {
    const res = await serverFetch<{
      success: boolean;
      data?: SupportTopicDetailPayload;
    }>(`/support/topics/${id}`);
    if (res.success && res.data) initial = res.data;
  } catch {
    initial = null;
  }

  return <SupportDetailClient topicId={id} initial={initial} />;
}
