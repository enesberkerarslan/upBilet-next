import type { Metadata } from "next";
import Link from "next/link";
import { BlogCard, blogCardDate, blogFirstImage, blogPlainExcerpt } from "@/components/blog/BlogCard";
import type { Locale } from "@/i18n";
import { fetchBlogBySlug, fetchBlogsPage } from "@/lib/public-fetch";
import { localizedPath } from "@/lib/locale-path";
import { notFound } from "next/navigation";
import type { PublicBlog } from "@/types/blog";

type Props = { params: Promise<{ locale: string; slug: string }> };

function stripHtml(html: string) {
  return html ? html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";
}

function suggestedFromList(all: PublicBlog[], currentSlug: string, count: number) {
  return all.filter((b) => b.slug !== currentSlug).slice(0, count);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const blog = await fetchBlogBySlug(slug);
  if (!blog) return { title: "Blog - UpBilet" };

  const title = blog.metaTitle || `${blog.title} - UpBilet Blog`;
  let description = stripHtml(blog.metaDescription);
  if (!description && blog.content) {
    const firstText = blog.content.find((block) => block.text)?.text || "";
    const clean = stripHtml(firstText);
    description = clean.length > 160 ? `${clean.slice(0, 157)}...` : clean;
  }
  if (!description) description = "UpBilet blog sayfasında etkinlik haberleri ve güncel içerikler.";

  return {
    title,
    description,
    openGraph: { title, description, type: "article", url: `https://upbilet.com/blog-detay/${slug}` },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { locale: raw, slug: rawSlug } = await params;
  const locale = raw as Locale;
  const slug = decodeURIComponent(rawSlug);

  const blog = await fetchBlogBySlug(slug);
  if (!blog) notFound();

  const list = await fetchBlogsPage(1, 24);
  const suggested = suggestedFromList(list?.blogs ?? [], slug, 4);

  const dateStr = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString("tr-TR", { timeZone: "UTC" })
    : "";

  return (
    <div className="mx-auto mt-6 w-full max-w-5xl p-4 md:mt-10 md:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold leading-tight">{blog.title}</h1>
        <div className="flex items-center gap-2 pt-2 text-base text-gray-500">
          <span>{dateStr}</span>
        </div>
      </div>

      <div className="blog-content text-lg text-gray-800">
        {(blog.content ?? []).map((block, i) => (
          <div key={`block-${i}`} className="mb-8">
            {block.text ? (
              <div className="mb-4" dangerouslySetInnerHTML={{ __html: block.text }} />
            ) : null}
            {block.imageUrl ? (
              <img
                src={block.imageUrl}
                alt=""
                className="h-80 w-full rounded-2xl object-cover shadow-md"
              />
            ) : null}
          </div>
        ))}
      </div>

      {suggested.length > 0 ? (
        <>
          <div className="mb-3 mt-10 flex w-full items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-2">
              <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 2.73607C0 1.2493 1.56463 0.282313 2.89443 0.947214L8.42229 3.71115C9.89639 4.44819 9.89639 6.55181 8.42229 7.28886L2.89443 10.0528C1.56462 10.7177 0 9.7507 0 8.26393V2.73607Z"
                  fill="#9F9FA9"
                />
              </svg>
              <span className="text-sm font-semibold">Daha fazlası</span>
            </div>
            <Link href={localizedPath(locale, "/blog")} className="font-medium text-[#9F9FA9] hover:underline">
              Daha fazlasını gör
            </Link>
          </div>
          <div className="mt-5 grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {suggested.map((b) => (
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
        </>
      ) : null}

      <style>{`
        .blog-content a {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-weight: 600;
        }
        .blog-content a:hover { color: #1d4ed8; text-decoration-thickness: 2px; }
      `}</style>
    </div>
  );
}
