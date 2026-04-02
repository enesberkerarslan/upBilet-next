import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import {
  fetchAllBlogSlugsForSitemap,
  fetchAllPublicEventsForSitemap,
  fetchAllPublicTagsForSitemap,
} from "@/lib/public-fetch";

/** Sitemap önbelleği (API yükünü sınırlar). */
export const revalidate = 3600;

type SitemapRow = MetadataRoute.Sitemap[number];

const STATIC_PATHS: { path: string; changeFrequency: SitemapRow["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/blog", changeFrequency: "daily", priority: 0.85 },
  { path: "/bilgi/kullanim-sozlesmesi", changeFrequency: "monthly", priority: 0.35 },
  { path: "/bilgi/sikca-sorulan-sorular", changeFrequency: "monthly", priority: 0.45 },
  { path: "/bilgi/cerez-politikasi", changeFrequency: "monthly", priority: 0.35 },
];

function trEnUrls(
  path: string,
  extra?: Pick<SitemapRow, "lastModified" | "changeFrequency" | "priority">,
): SitemapRow[] {
  if (path === "/") {
    return [
      { url: `${SITE_URL}/`, ...extra },
      { url: `${SITE_URL}/en`, ...extra },
    ];
  }
  return [
    { url: `${SITE_URL}${path}`, ...extra },
    { url: `${SITE_URL}/en${path}`, ...extra },
  ];
}

function encodePathSegments(pathWithLeadingSlash: string): string {
  const [leading, ...rest] = pathWithLeadingSlash.split("/").filter(Boolean);
  if (!leading) return "/";
  const encoded = rest.map((s) => encodeURIComponent(s)).join("/");
  return `/${leading}${encoded ? `/${encoded}` : ""}`;
}

function dedupeByUrl(rows: SitemapRow[]): SitemapRow[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, tags, blogSlugs] = await Promise.all([
    fetchAllPublicEventsForSitemap(),
    fetchAllPublicTagsForSitemap(),
    fetchAllBlogSlugsForSitemap(),
  ]);

  const rows: SitemapRow[] = [];

  for (const s of STATIC_PATHS) {
    rows.push(...trEnUrls(s.path, { changeFrequency: s.changeFrequency, priority: s.priority }));
  }

  for (const { slug } of tags) {
    const path = encodePathSegments(`/kategori/${slug}`);
    rows.push(
      ...trEnUrls(path, { changeFrequency: "weekly", priority: 0.75 }),
    );
  }

  for (const { slug, date } of events) {
    const path = encodePathSegments(`/detay/${slug}`);
    const lastModified = date ? new Date(date) : undefined;
    rows.push(
      ...trEnUrls(path, {
        lastModified: Number.isNaN(lastModified?.getTime()) ? undefined : lastModified,
        changeFrequency: "weekly",
        priority: 0.65,
      }),
    );
  }

  for (const { slug } of blogSlugs) {
    const path = encodePathSegments(`/blog-detay/${slug}`);
    rows.push(...trEnUrls(path, { changeFrequency: "weekly", priority: 0.55 }));
  }

  return dedupeByUrl(rows);
}
