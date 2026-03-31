import Link from "next/link";
import type { Locale } from "@/i18n";
import { EventCard } from "@/components/event/EventCard";
import { MobileEventCard } from "@/components/event/MobileEventCard";
import { MobileSearchBar } from "@/components/layout/MobileSearchBar";
import { HomeHeroSkeleton } from "@/components/main/HomeHeroSkeleton";
import { MainCategoryBox } from "@/components/main/MainCategoryBox";
import { MainInfoBox } from "@/components/main/MainInfoBox";
import { CategoryFeaturedIcon } from "@/components/category/CategoryFeaturedIcon";
import { FeaturedStarIcon } from "@/components/main/FeaturedStarIcon";
import { MainMoreCategory } from "@/components/main/MainMoreCategory";
import { MainSlider } from "@/components/main/MainSlider";
import { MainSubscribe } from "@/components/main/MainSubscribe";
import { fetchHomepageData } from "@/lib/homepage-data";
import { hasBothTeamNames, isHeroRenderable, type HeroFields } from "@/lib/hero-utils";
import { localizedPath } from "@/lib/locale-path";
import type { PublicEvent } from "@/types/event";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;

  const data = await fetchHomepageData();

  const footballEvents = (data.football?.events ?? []) as PublicEvent[];
  const concertEvents = (data.concert?.events ?? []) as PublicEvent[];
  const footballResponseEvents = (data.footballResponse?.events ?? []) as PublicEvent[];
  const hero = data.homepage?.hero as HeroFields | undefined;

  const banners =
    data.homepage?.banners?.map((b) => ({
      image: b.imageUrl,
      title: b.label,
      link: b.link,
    })) ?? [];

  const showFootball = footballEvents.length > 0;
  const showConcert = concertEvents.length > 0;
  const showFootballGrid = footballResponseEvents.length > 0;

  const heroReady = data.success && isHeroRenderable(hero);
  const showTeamColumns = hasBothTeamNames(hero);

  const rawTicket = hero?.ticketLink || "/odeme";
  const normalizedTicket = rawTicket === "/payment" ? "/odeme" : rawTicket;
  const ticketHref =
    normalizedTicket.startsWith("http://") || normalizedTicket.startsWith("https://")
      ? normalizedTicket
      : localizedPath(locale, normalizedTicket);

  return (
    <div className="flex w-full flex-col">
      <h1 className="sr-only">Futbol Biletleri ve Etkinlik Biletleri - UpBilet</h1>
      <MobileSearchBar />
      <div className="mt-6 w-full rounded-xl">
        {heroReady ? (
          <MainSlider
            backgroundImageUrl={hero?.backgroundImageUrl?.trim() || "/event.png"}
            homeTeamName={hero?.homeTeamName?.trim()}
            awayTeamName={hero?.awayTeamName?.trim()}
            dateTime={hero?.dateText || ""}
            time={hero?.timeText || ""}
            venue={hero?.venue || ""}
            description={hero?.description || ""}
            ticketHref={ticketHref}
            showTeamColumns={showTeamColumns}
          />
        ) : (
          <HomeHeroSkeleton />
        )}
      </div>
      <div className="mt-6 w-full">
        <MainCategoryBox locale={locale} />
      </div>

      {showFootball ? (
        <section className="mt-10 w-full">
          <div className="mb-4 flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center gap-2">
              <span className="hidden text-[#71717B] sm:inline">Öne Çıkan</span>
              <FeaturedStarIcon />
              <span className="text-[#09090B]">Etkinlikler</span>
            </div>
            <Link
              href={localizedPath(locale, "/kategori/futbol")}
              className="text-[13px] font-normal text-[#52525C] hover:opacity-70"
            >
              Daha fazlasını göster
            </Link>
          </div>
          <div className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-4">
            {footballEvents.map((e) => (
              <EventCard key={e._id} event={e} locale={locale} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {footballEvents.map((e) => (
              <MobileEventCard key={e._id} event={e} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {showConcert ? (
        <section className="mt-20 w-full">
          <div className="mb-4 flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center gap-2">
              <span className="hidden text-[#71717B] sm:inline">Öne Çıkan</span>
              <span className="flex shrink-0 items-center [&_svg]:h-[18px] [&_svg]:w-[18px]">
                <CategoryFeaturedIcon kind="concert" />
              </span>
              <span className="text-[#09090B]">Konser Etkinlikleri</span>
            </div>
            <Link
              href={localizedPath(locale, "/kategori/konser")}
              className="text-[13px] font-normal text-[#52525C] hover:opacity-70"
            >
              Daha fazlasını göster
            </Link>
          </div>
          <div className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-4">
            {concertEvents.map((e) => (
              <EventCard key={e._id} event={e} locale={locale} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {concertEvents.map((e) => (
              <MobileEventCard key={e._id} event={e} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <MainMoreCategory items={banners} locale={locale} />

      {showFootballGrid ? (
        <section className="mt-10 w-full">
          <div className="mb-4 flex items-center justify-between text-lg font-semibold">
            <span className="text-[#09090B]">Futbol Etkinlikleri</span>
            <Link
              href={localizedPath(locale, "/kategori/futbol")}
              className="text-[13px] font-normal text-[#52525C] hover:opacity-70"
            >
              Daha fazlasını göster
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {footballResponseEvents.map((e) => (
              <EventCard key={e._id} event={e} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-20 w-full">
        <MainSubscribe />
      </div>
      <div className="mt-20 w-full">
        <MainInfoBox />
      </div>
    </div>
  );
}
