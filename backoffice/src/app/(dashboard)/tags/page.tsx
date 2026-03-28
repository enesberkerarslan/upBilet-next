import { serverFetch } from '@/lib/server-fetch';
import { Tag } from '@/types';
import TagsClient from './TagsClient';

export default async function TagsPage() {
  let tags: Tag[] = [];
  try {
    const res = await serverFetch<{ data: Tag[] }>('/tags/get-all-tags');
    tags = res.data ?? [];
  } catch {
    tags = [];
  }
  return <TagsClient initialTags={tags} />;
}
