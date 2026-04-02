import Image from "next/image";
import type { PublicBlog } from "@/types/blog";

export function blogFirstImage(b: PublicBlog | null | undefined, fallback = "/img/logo.svg") {
  const cover = b?.coverImageUrl?.trim();
  if (cover && !cover.includes(" ")) return cover;
  const url = b?.content?.find((i) => i.imageUrl)?.imageUrl?.trim();
  if (url && !url.includes(" ")) return url;
  return fallback;
}

export function blogPlainExcerpt(b: PublicBlog | null | undefined, max = 100) {
  const raw = b?.content?.find((i) => i.text)?.text ?? "";
  const plain = raw.replace(/<[^>]*>/g, "");
  return plain.slice(0, max);
}

export function blogCardDate(createdAt?: string) {
  if (!createdAt) return "";
  return String(createdAt).slice(0, 10);
}

export function BlogCard({
  image,
  title,
  excerpt,
  date,
}: {
  image: string;
  title: string;
  excerpt: string;
  date: string;
}) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[18px] bg-white font-sans shadow-sm">
      <img className="h-[140px] w-full object-cover" src={image} alt="" />
      <div className="flex flex-1 flex-col justify-between p-4">
        <p className="mb-2 text-sm font-medium text-[#222]">{title}</p>
        {excerpt ? <p className="mb-3 line-clamp-2 text-xs text-[#666]">{excerpt}</p> : null}
        <div className="mb-3 border-b border-gray-200" />
        <div className="flex items-center text-xs text-[#888]">
          <Image src="/generalicon/calender.svg" alt="" width={20} height={20} className="mr-2 h-5 w-5" />
          <span className="pl-1">{date}</span>
        </div>
      </div>
    </div>
  );
}
