import Link from "next/link";
import type { Locale } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";

export type BannerItem = { image?: string; title?: string; link?: string };

function resolveLink(locale: Locale, link?: string) {
  if (!link || link === "#") return "#";
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return localizedPath(locale, link);
}

const defaults: BannerItem[] = [
  { image: "/event.png", title: "F1 Yarışı", link: "/kategori/galatasaray" },
  { image: "/event2.png", title: "Konser", link: "/kategori/fenerbahce" },
];

export function MainMoreCategory({ items, locale }: { items: BannerItem[]; locale: Locale }) {
  const list = items?.length ? items : defaults;
  return (
    <div className="w-full py-10 md:py-2">
      <div className="mx-auto w-full sm:px-0">
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
          {list.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="group relative h-[200px] w-full overflow-hidden rounded-xl sm:h-[220px] lg:h-[280px]"
            >
              <img
                src={item.image || "/event.png"}
                alt={item.title || ""}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-black/20 to-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Link
                  href={resolveLink(locale, item.link)}
                  className="rounded-md bg-white px-6 py-2.5 font-medium transition-colors hover:bg-gray-100"
                >
                  İncele
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
