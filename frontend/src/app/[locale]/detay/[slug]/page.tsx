import type { Locale } from "@/i18n";
import { fetchEventDetail } from "@/lib/public-fetch";
import { notFound } from "next/navigation";
import { DetailEventPanel, type DetailTag } from "@/components/detay/DetailEventPanel";
import { DetailTicketList, type TicketOption } from "@/components/detay/DetailTicketList";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string; slug: string }> };

function stripHtml(html: string): string {
  return html ? html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const { success, event } = await fetchEventDetail(slug);
  if (!success || !event) {
    return { title: "Etkinlik bulunamadı | UpBilet" };
  }
  const ev = event as {
    metaTitle?: string;
    metaDescription?: string;
    name?: string;
    description?: string;
    location?: string;
  };
  const title = ev.metaTitle || (ev.name ? `${ev.name} Biletleri - UpBilet` : "Etkinlik Detayı - UpBilet");
  let description = "";
  if (ev.metaDescription) description = stripHtml(ev.metaDescription);
  else if (ev.description) description = stripHtml(ev.description);
  else {
    const eventName = ev.name || "Etkinlik";
    const location = ev.location || "";
    description = `${eventName} biletleri için UpBilet'i ziyaret edin.`;
    if (location) description += ` ${location}'da gerçekleşecek etkinliğe biletinizi satın alın.`;
    description += " Güvenli ödeme ve anında bilet teslimatı ile biletinizi satın alın.";
  }
  return { title, description };
}

export default async function DetayPage({ params }: Props) {
  const { locale: raw, slug: rawSlug } = await params;
  const locale = raw as Locale;
  const slug = decodeURIComponent(rawSlug);
  const { success, event, listings } = await fetchEventDetail(slug);

  if (!success || !event) notFound();

  const ev = event as {
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

  return (
    <div className="match-detail pb-5 pt-[50px]">
      <div className="relative">
        <div className="detail-container mx-auto grid max-w-[1200px] grid-cols-1 gap-5 md:gap-5 lg:grid-cols-[1fr_1.5fr]">
          <div className="left-section">
            <DetailEventPanel
              locale={locale}
              name={ev.name}
              date={ev.date}
              location={ev.location}
              tags={ev.tags}
            />
          </div>
          <div className="right-section">
            <DetailTicketList locale={locale} eventName={ev.name} tickets={tickets} />
          </div>
        </div>
      </div>

      {ev.description ? (
        <div className="mt-20 flex w-full flex-col px-4">
          <div
            className="seo-content mt-6 w-full max-w-none space-y-3 text-left text-[12px] font-normal text-[#18181B] [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:opacity-80"
            dangerouslySetInnerHTML={{ __html: ev.description }}
          />
        </div>
      ) : null}
    </div>
  );
}
