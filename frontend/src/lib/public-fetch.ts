import { getPublicApiBaseServer } from "@/lib/env";
import type { PublicBlog } from "@/types/blog";
import type { PublicEvent } from "@/types/event";

export type CategoryTagInfo = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
};

export type CategoryBundleBody = {
  success?: boolean;
  events?: PublicEvent[];
  tag?: CategoryTagInfo;
};

function isPublicSuccessBody(res: Response, data: unknown): boolean {
  return (
    res.ok &&
    typeof data === "object" &&
    data !== null &&
    (data as { success?: boolean }).success === true
  );
}

async function fetchPublicJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    return { ok: false as const, data: null as null };
  }
  return { ok: isPublicSuccessBody(res, data), data };
}

export async function fetchCategoryBundle(tagNameForApi: string) {
  const base = getPublicApiBaseServer();
  const enc = encodeURIComponent(tagNameForApi);

  try {
    const [latest, mainPage] = await Promise.all([
      fetchPublicJson(`${base}events/latest/${enc}`),
      fetchPublicJson(`${base}events/mainpage/tag/${enc}/mainpage`),
    ]);

    const categoryOk = latest.ok || mainPage.ok;

    return {
      success: categoryOk,
      latest: latest.data as CategoryBundleBody | null,
      mainPage: mainPage.data as CategoryBundleBody | null,
    };
  } catch (e) {
    console.error("Category fetch error:", e);
    return { success: false as const, latest: null, mainPage: null };
  }
}

export async function fetchEventDetail(slug: string) {
  const base = getPublicApiBaseServer();
  const enc = encodeURIComponent(slug);

  try {
    const eventRes = await fetch(`${base}events/slug/${enc}`, { cache: "no-store" }).then((r) => r.json());

    if (!eventRes?.success || !eventRes?.event) {
      return { success: false as const, event: null, listings: [] as unknown[] };
    }

    const event = eventRes.event;
    let listings: unknown[] = [];
    if (event._id) {
      try {
        const listRes = await fetch(`${base}events/getListingByEventId/${event._id}`, {
          cache: "no-store",
        }).then((r) => r.json());
        listings = listRes?.listing || [];
      } catch {
        listings = [];
      }
    }

    return { success: true as const, event, listings };
  } catch (e) {
    console.error("Event detail fetch error:", e);
    return { success: false as const, event: null, listings: [] as unknown[] };
  }
}

export type BlogsListResult = {
  success: boolean;
  blogs: PublicBlog[];
  currentPage: number;
  totalPages: number;
  totalBlogs: number;
};

export async function fetchBlogsPage(page: number, limit: number): Promise<BlogsListResult | null> {
  const base = getPublicApiBaseServer();
  const p = Math.max(1, page);
  const l = Math.min(50, Math.max(1, limit));
  try {
    const r = await fetch(`${base}blogs?page=${p}&limit=${l}`, { cache: "no-store" });
    const data = (await r.json()) as Partial<BlogsListResult> & { success?: boolean };
    if (!r.ok || !data.success || !Array.isArray(data.blogs)) return null;
    return {
      success: true,
      blogs: data.blogs,
      currentPage: data.currentPage ?? p,
      totalPages: data.totalPages ?? 1,
      totalBlogs: data.totalBlogs ?? data.blogs.length,
    };
  } catch (e) {
    console.error("Blogs fetch error:", e);
    return null;
  }
}

export async function fetchBlogBySlug(slug: string): Promise<PublicBlog | null> {
  const base = getPublicApiBaseServer();
  const enc = encodeURIComponent(slug);
  try {
    const r = await fetch(`${base}blogs/slug/${enc}`, { cache: "no-store" });
    const data = (await r.json()) as { success?: boolean; blog?: PublicBlog };
    if (!r.ok || !data.success || !data.blog) return null;
    return data.blog;
  } catch (e) {
    console.error("Blog detail fetch error:", e);
    return null;
  }
}
