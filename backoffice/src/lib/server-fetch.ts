import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

/**
 * Backend response formatları (controller bazında farklılık var):
 *
 * GET /events/get-all-events   → Event[]            (direkt array)
 * GET /listings/get-all-listings → Listing[]        (direkt array)
 * GET /tags/get-all-tags       → { success, data: Tag[] }
 * GET /sales                   → { success, data: Sale[] }
 * GET /sales/filter/event?eventId= → { success, data: Sale[] }
 * GET /members/get-all-members → { success, data: Member[] }
 * GET /blogs                   → { blogs, currentPage, totalPages, totalBlogs }
 */
export async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
