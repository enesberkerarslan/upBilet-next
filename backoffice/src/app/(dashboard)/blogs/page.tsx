import { serverFetch } from '@/lib/server-fetch';
import { Blog } from '@/types';
import BlogsClient from './BlogsClient';

export default async function BlogsPage() {
  let blogs: Blog[] = [];
  try {
    // getAllBlogs → { blogs, currentPage, totalPages, totalBlogs }
    const res = await serverFetch<{ blogs: Blog[] }>('/blogs');
    blogs = res.blogs ?? [];
  } catch {
    blogs = [];
  }
  return <BlogsClient initialBlogs={blogs} />;
}
