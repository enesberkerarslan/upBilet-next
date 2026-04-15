import type { Locale } from "@/i18n";
import { fetchEventDetail } from "@/lib/public-fetch";
import { SITE_URL } from "@/lib/site-url";
import { notFound } from "next/navigation";
import { CategorySeoCollapsible } from "@/components/category/CategorySeoCollapsible";
import { DetailEventPanel, type DetailTag } from "@/components/detay/DetailEventPanel";
import { DetailTicketList, type TicketOption } from "@/components/detay/DetailTicketList";
import { StadiumSelectionProvider } from "@/components/detay/StadiumSelectionContext";
import { resolveStadiumPlanPath } from "@/lib/stadium-svg";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string; slug: string }> };

type EventSeoFields = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  name?: string;
  description?: string;
  location?: string;
};

function eventSeoFallbackPlainText(
  locale: Locale,
  name: string | undefined,
  location: string | undefined,
): string {
  const eventName = name?.trim() || (locale === "en" ? "Event" : "Etkinlik");
  const loc = location?.trim() || "";
  if (locale === "en") {
    let s = `Visit UpBilet for ${eventName} tickets.`;
    if (loc) s += ` Buy tickets for the event at ${loc}.`;
    s += " Pay securely with instant ticket delivery.";
    return s;
  }
  let s = `${eventName} biletleri için UpBilet'i ziyaret edin.`;
  if (loc) s += ` ${loc}'da gerçekleşecek etkinliğe biletinizi satın alın.`;
  s += " Güvenli ödeme ve anında bilet teslimatı ile biletinizi satın alın.";
  return s;
}

function stripHtml(html: string): string {
  return html ? html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";
}

function keywordsToMetaArray(raw: string): string[] | undefined {
  const parts = raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

function buildDetailFallbackKeywords(displayName: string | undefined): string[] | undefined {
  const n = displayName?.trim();
  if (!n) return undefined;
  return keywordsToMetaArray(
    `${n} biletleri, ${n} etkinlik biletleri, ${n} bilet satışı, UpBilet`,
  );
}

/** `<p></p>` gibi “dolu” ama görünür metni olmayan HTML’i ele */
function hasVisibleHtmlBody(html: string | undefined): boolean {
  return stripHtml(html ?? "").length > 0;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug, locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const slug = decodeURIComponent(rawSlug);
  const { success, event } = await fetchEventDetail(slug);
  if (!success || !event) {
    return { title: "Etkinlik bulunamadı | UpBilet" };
  }

  const ev = event as EventSeoFields;
  const metaTitleTrimmed = ev.metaTitle?.trim() ?? "";
  const metaDescPlain = stripHtml(ev.metaDescription ?? "");
  const metaKeywordsTrimmed = ev.keywords?.trim() ?? "";

  const fallbackTitle = ev.name?.trim()
    ? `${ev.name.trim()} Biletleri - UpBilet`
    : "Etkinlik Detayı - UpBilet";
  const fallbackDescription = eventSeoFallbackPlainText(locale, ev.name, ev.location);

  const title = metaTitleTrimmed ? metaTitleTrimmed : fallbackTitle;
  const description = metaDescPlain ? metaDescPlain : fallbackDescription;

  const parsedApiKeywords = keywordsToMetaArray(metaKeywordsTrimmed);
  const keywords = parsedApiKeywords ?? buildDetailFallbackKeywords(ev.name);

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    openGraph: { title, description, url: `${SITE_URL}/detay/${slug}` },
  };
}

export default async function DetayPage({ params }: Props) {
  const { locale: raw, slug: rawSlug } = await params;
  const locale = raw as Locale;
  const slug = decodeURIComponent(rawSlug);
  const { success, event, listings } = await fetchEventDetail(slug);

  if (!success || !event) notFound();

  const ev = event as EventSeoFields & {
    _id: string;
    name: string;
    image?: string;
    date?: string;
    location?: string;
    description?: string;
    tags?: DetailTag[];
  };

  const rawList = (listings ?? []) as {
    _id: string;
    price?: number;
    quantity?: number;
    category?: string;
    block?: string;
    row?: string;
    ticketType?: string;
  }[];

  const tickets: TicketOption[] = rawList
    .filter((l) => l.price != null && l.quantity != null && l.category)
    .map((l) => ({
      id: l._id,
      price: l.price as number,
      quantity: l.quantity as number,
      category: l.category as string,
      block: l.block,
      row: l.row,
      ticketType: l.ticketType,
    }));

  const venueTag = ev.tags?.find((t) => t.tag === "EtkinlikAlanı");
  const venueTagName = venueTag?.name?.trim() || null;
  const venueTagSlug = venueTag?.slug?.trim() || null;
  const locationTrim = ev.location?.trim() || null;
  const stadiumPlanPath =
    resolveStadiumPlanPath({ venueName: venueTagName, venueSlug: venueTagSlug }) ??
    (locationTrim ? resolveStadiumPlanPath({ venueName: locationTrim, venueSlug: null }) : null);

  const metaDescPlainForBody = stripHtml(ev.metaDescription ?? "").trim();
  const seoFallback = eventSeoFallbackPlainText(locale, ev.name, ev.location);

  return (
    <div className="match-detail pb-5 pt-3 lg:pt-[50px]">
      <div className="relative">
        <StadiumSelectionProvider rawListings={rawList}>
          <div className="detail-container mx-auto grid max-w-[1200px] grid-cols-1 gap-5 md:gap-5 lg:grid-cols-[1fr_1.5fr]">
            <div className="left-section min-w-0 w-full">
              <DetailEventPanel
                locale={locale}
                name={ev.name}
                date={ev.date}
                location={ev.location}
                tags={ev.tags}
                listingsForStadium={rawList}
              />
            </div>
            <div className="right-section">
              <DetailTicketList
                locale={locale}
                eventName={ev.name}
                tickets={tickets}
                stadiumPlanSrc={stadiumPlanPath}
              />
            </div>
          </div>
        </StadiumSelectionProvider>
      </div>

      <div className="mt-20 flex w-full flex-col px-4">
        {hasVisibleHtmlBody(ev.description) && ev.description ? (
          <CategorySeoCollapsible html={ev.description} className="mt-6 w-full" />
        ) : metaDescPlainForBody ? (
          <p className="seo-content mt-6 max-w-none text-left text-[12px] font-normal leading-relaxed text-[#18181B]">
            {metaDescPlainForBody}
          </p>
        ) : (
          <p className="seo-content mt-6 max-w-none text-left text-[12px] font-normal leading-relaxed text-[#18181B]">
            {seoFallback}
          </p>
        )}
      </div>
    </div>
  );
}
