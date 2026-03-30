import type { Metadata } from "next";
import Link from "next/link";
import { BlogCard, blogCardDate, blogFirstImage, blogPlainExcerpt } from "@/components/blog/BlogCard";
import type { Locale } from "@/i18n";
import { fetchBlogsPage } from "@/lib/public-fetch";
import { localizedPath } from "@/lib/locale-path";
import type { PublicBlog } from "@/types/blog";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export const metadata: Metadata = {
  title: "Blog - UpBilet",
  description:
    "UpBilet blog sayfasında etkinlik haberleri, bilet satışı ipuçları ve sektör güncellemeleri hakkında güncel içerikler.",
  openGraph: {
    title: "Blog - UpBilet",
    description:
      "UpBilet blog sayfasında etkinlik haberleri, bilet satışı ipuçları ve sektör güncellemeleri hakkında güncel içerikler.",
    url: "https://upbilet.com/blog",
  },
};

const LIMIT = 13;

function featuredExcerpt(b: PublicBlog) {
  const raw = b.content?.find((x) => x.text)?.text ?? "";
  return raw;
}

function pagesToShow(current: number, total: number) {
  const start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const sp = await searchParams;
  const currentPage = Math.max(1, Number(sp.page) || 1);

  const data = await fetchBlogsPage(currentPage, LIMIT);
  const blogs = data?.blogs ?? [];
  const totalPages = data?.totalPages ?? 1;

  const featured = blogs[0] ?? null;
  const grid = blogs.slice(1, LIMIT);

  const base = localizedPath(locale, "/blog");

  return (
    <div className="flex flex-col gap-4 pb-12 font-sans">
      {featured ? (
        <div className="flex min-h-[250px] w-full items-center bg-[#f7f7f7] py-8">
          <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm md:flex-row">
            <div className="min-h-[200px] w-full md:w-1/2 md:min-h-[260px]">
              <img
                src={blogFirstImage(featured)}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex w-full flex-col justify-center p-6 md:w-1/2 md:p-8">
              <h2 className="mb-3 text-xl font-bold">{featured.title}</h2>
              <div
                className="blog-excerpt mb-6 line-clamp-3 pt-2 text-sm text-gray-600 md:pt-5 md:pb-12"
                dangerouslySetInnerHTML={{ __html: featuredExcerpt(featured) }}
              />
              <Link
                href={localizedPath(locale, `/blog-detay/${featured.slug}`)}
                className="w-fit rounded-full bg-[#4F46E5] px-6 py-2 text-sm font-medium text-white"
              >
                Devamını Oku
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <p className="py-12 text-center text-gray-600">Henüz blog yazısı yok.</p>
      )}

      {grid.length > 0 ? (
        <div className="mt-5 grid w-full grid-cols-2 gap-6 lg:grid-cols-4">
          {grid.map((b) => (
            <Link key={b._id} href={localizedPath(locale, `/blog-detay/${b.slug}`)}>
              <BlogCard
                image={blogFirstImage(b)}
                title={b.title}
                excerpt={blogPlainExcerpt(b)}
                date={blogCardDate(b.createdAt)}
              />
            </Link>
          ))}
        </div>
      ) : null}

      {totalPages > 1 ? (
        <nav className="mt-8 flex justify-center" aria-label="Sayfalama">
          <div className="flex items-center space-x-2">
            {currentPage <= 1 ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg opacity-40">‹</span>
            ) : (
              <Link
                href={`${base}?page=${currentPage - 1}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-200"
              >
                ‹
              </Link>
            )}
            {pagesToShow(currentPage, totalPages).map((p) => (
              <Link
                key={p}
                href={`${base}?page=${p}`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${p === currentPage ? "bg-[#6366F1] font-bold text-white" : "hover:bg-gray-200"}`}
              >
                {p}
              </Link>
            ))}
            {currentPage >= totalPages ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg opacity-40">›</span>
            ) : (
              <Link
                href={`${base}?page=${currentPage + 1}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-200"
              >
                ›
              </Link>
            )}
          </div>
        </nav>
      ) : null}

      <style>{`
        .blog-excerpt a {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-weight: 600;
        }
        .blog-excerpt a:hover { color: #1d4ed8; text-decoration-thickness: 2px; }
      `}</style>
    </div>
  );
}
