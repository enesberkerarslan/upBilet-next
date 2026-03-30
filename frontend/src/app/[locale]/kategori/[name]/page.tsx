import type { Metadata } from "next";
import { CategoryFeaturedIcon, categoryIconForSlug } from "@/components/category/CategoryFeaturedIcon";
import { CategoryHero } from "@/components/category/CategoryHero";
import { EventCard } from "@/components/event/EventCard";
import { EventTable } from "@/components/event/EventTable";
import type { Locale } from "@/i18n";
import { fetchCategoryBundle } from "@/lib/public-fetch";
import { notFound } from "next/navigation";
import type { PublicEvent } from "@/types/event";

type Props = { params: Promise<{ locale: string; name: string }> };

function categoryTitle(slug: string) {
  const map: Record<string, string> = {
    futbol: "Futbol Etkinlikleri",
    basketbol: "Basketbol Etkinlikleri",
    konser: "Konser Etkinlikleri",
    tiyatro: "Tiyatro Etkinlikleri",
    standup: "Standup Etkinlikleri",
  };
  return map[slug] ?? `${slug.charAt(0).toUpperCase() + slug.slice(1)} Etkinlikleri`;
}

function toTurkishUpperCase(text: string) {
  if (!text) return "";
  const turkishMap: Record<string, string> = {
    ç: "Ç",
    ğ: "Ğ",
    ı: "I",
    ö: "Ö",
    ş: "Ş",
    ü: "Ü",
    i: "İ",
  };
  return text
    .replace(/[çğıöşüi]/g, (ch) => turkishMap[ch] ?? ch.toUpperCase())
    .replace(/[a-z]/g, (ch) => ch.toUpperCase());
}

function stripHtml(html: string) {
  return html ? html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name: rawName } = await params;
  const slug = decodeURIComponent(rawName);
  const apiTag = slug.charAt(0).toUpperCase() + slug.slice(1);
  const bundle = await fetchCategoryBundle(apiTag);
  if (!bundle.success) return { title: "Kategori - UpBilet" };

  const mainTag = bundle.mainPage?.tag ?? bundle.latest?.tag;
  const title =
    mainTag?.metaTitle ??
    `${mainTag?.name ?? categoryTitle(slug)} Biletleri - UpBilet`;
  const description = stripHtml(mainTag?.metaDescription ?? "");

  return {
    title,
    description,
    openGraph: { title, description, url: `https://upbilet.com/kategori/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale: raw, name: rawName } = await params;
  const locale = raw as Locale;
  const slug = decodeURIComponent(rawName);
  const apiTag = slug.charAt(0).toUpperCase() + slug.slice(1);

  const bundle = await fetchCategoryBundle(apiTag);
  if (!bundle.success) {
    notFound();
  }

  const latestEvents = (bundle.latest?.events ?? []) as PublicEvent[];
  const mainPageEvents = (bundle.mainPage?.events ?? []) as PublicEvent[];
  const mainPageTag = bundle.mainPage?.tag;
  const latestTag = bundle.latest?.tag;

  if (!latestEvents.length && !mainPageEvents.length) {
    notFound();
  }

  const fullDescription = mainPageTag?.description || latestTag?.description || "";
  const heroTitle = toTurkishUpperCase(mainPageTag?.name ?? slug);
  const iconKind = categoryIconForSlug(slug);
  const headingName = mainPageTag?.name ?? categoryTitle(slug);

  return (
    <div className="flex w-full flex-col">
      <div className="mt-6 md:mt-10">
        <CategoryHero title={heroTitle} />
      </div>

      {mainPageEvents.length > 0 ? (
        <section className="mt-12 flex w-full flex-col md:mt-20">
          <div className="flex w-full items-center justify-between text-lg font-semibold">
            <div className="flex items-center gap-2">
              <h2 className="text-[#71717B]">Öne Çıkan</h2>
              <CategoryFeaturedIcon kind={iconKind} />
              <span className="text-[#09090B]">{headingName} Etkinlikleri</span>
            </div>
            <span className="hidden cursor-pointer text-[13px] font-normal text-[#52525C] hover:opacity-70 sm:block">
              Daha fazlasını göster
            </span>
          </div>
          <div className="mt-4 hidden grid-cols-2 gap-4 md:grid lg:grid-cols-4">
            {mainPageEvents.slice(0, 4).map((e) => (
              <EventCard key={e._id} event={e} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {latestEvents.length > 0 ? (
        <section className="mt-12 flex w-full flex-col md:mt-20">
          <div className="hidden md:block">
            <EventTable events={latestEvents} locale={locale} />
          </div>
          <div className="md:hidden">
            <div className="mb-6 flex items-center gap-2">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 2.23607C0 0.749304 1.56463 -0.217687 2.89443 0.447214L8.42229 3.21115C9.89639 3.94819 9.89639 6.05181 8.42229 6.78886L2.89443 9.55279C1.56462 10.2177 0 9.2507 0 7.76393V2.23607Z"
                  fill="#9F9FA9"
                />
              </svg>
              <h2 className="text-lg font-medium text-gray-900">Etkinlik Takvimi</h2>
            </div>
            <div className="grid w-full grid-cols-2 gap-4">
              {latestEvents.map((e) => (
                <EventCard key={e._id} event={e} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {fullDescription ? (
        <div
          className="seo-content mt-16 max-w-none space-y-3 px-1 text-left text-[12px] font-normal text-[#18181B] [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:opacity-80"
          dangerouslySetInnerHTML={{ __html: fullDescription }}
        />
      ) : null}
    </div>
  );
}
