import { formatDateTR, formatTimeTR } from "@/lib/date";
import type { Locale } from "@/i18n";
import { getMessages, translate } from "@/i18n";
import Link from "next/link";
import { localizedPath } from "@/lib/locale-path";
import {
  STADIUM_NO_LISTINGS_AVAILABILITY,
  stadiumListingAvailabilityFromListings,
  stadiumListingSummariesFromListings,
} from "@/lib/stadium-listing-availability";
import { resolveStadiumPlanPath } from "@/lib/stadium-svg";
import { StadiumPlanInteractive } from "@/components/detay/StadiumPlanInteractive";

export type DetailTag = { name?: string; tag?: string; slug?: string };

type ListingForStadium = {
  block?: string | null;
  category?: string | null;
  quantity?: number | null;
  price?: number | null;
};

type Props = {
  locale: Locale;
  name: string;
  date?: string | null;
  location?: string | null;
  tags?: DetailTag[];
  /** Blok bazlı stok — SVG ile eşleşen `block` alanları */
  listingsForStadium?: ListingForStadium[];
};

function formatDateOnly(iso: string): string {
  try {
    const full = formatDateTR(iso);
    const parts = full.split(" ");
    if (parts.length < 3) return full;
    const [day, month, year] = parts;
    return `${day} ${month} ${year}`;
  } catch {
    return "";
  }
}

function hasPassoTag(tags: DetailTag[] | undefined): boolean {
  if (!tags?.length) return false;
  return tags.some((t) => {
    const n = (t.name ?? "").toLowerCase();
    return n.includes("passo") || n.includes("passolig");
  });
}

/** `DetailTicketList` ile aynı satırlar — eksik fiyat/kategori kayıtları stok modunu kapatıp haritayı hep sarı boyuyordu */
function listingsEligibleForTicketGrid(rows: ListingForStadium[]) {
  return rows.filter(
    (l) =>
      l.price != null &&
      l.quantity != null &&
      (l.category ?? "").trim() !== ""
  );
}

export function DetailEventPanel({ locale, name, date, location, tags, listingsForStadium }: Props) {
  const passo = hasPassoTag(tags);
  const sssHref = localizedPath(locale, "/bilgi/sikca-sorulan-sorular");
  const messages = getMessages(locale);
  const venueTag = tags?.find((t) => t.tag === "EtkinlikAlanı");
  const venueTagName = venueTag?.name?.trim() || null;
  const venueTagSlug = venueTag?.slug?.trim() || null;
  const locationTrim = location?.trim() || null;
  /** Etiket adı kısa kalırsa (ör. "Antalya Stadyumu") location’daki tam mekan adı hiç okunmuyordu. */
  const stadiumPlanPath =
    resolveStadiumPlanPath({ venueName: venueTagName, venueSlug: venueTagSlug }) ??
    (locationTrim ? resolveStadiumPlanPath({ venueName: locationTrim, venueSlug: null }) : null);
  const showStadiumPlan =
    Boolean(venueTag?.name?.trim() || venueTag?.slug?.trim()) || Boolean(location?.trim());

  const mapListings =
    listingsForStadium == null ? null : listingsEligibleForTicketGrid(listingsForStadium);

  const listingAvailability =
    mapListings == null
      ? undefined
      : mapListings.length === 0
        ? STADIUM_NO_LISTINGS_AVAILABILITY
        : stadiumListingAvailabilityFromListings(mapListings);

  const listingSummaries =
    mapListings != null && mapListings.length > 0
      ? stadiumListingSummariesFromListings(mapListings)
      : { byBlock: {}, byCategory: {} };

  const dateTimeMobile =
    date && formatDateOnly(date)
      ? `${formatDateOnly(date)} ${formatTimeTR(date)}`.trim()
      : date
        ? formatTimeTR(date)
        : null;

  const locationDateMobile = [location?.trim(), dateTimeMobile].filter(Boolean).join(" - ");

  return (
    <div className="overflow-hidden rounded-3xl bg-white p-4 lg:p-6">
      <p className="mb-6 hidden text-center text-lg font-medium text-gray-900 md:block">Maç Detayları</p>

      {/* Mobil: isim → konum - tarih/saat; stadyum hemen altında */}
      <div className="match-info md:hidden">
        <h1 className="m-0 text-lg font-semibold leading-snug text-gray-900 whitespace-pre-line">{name}</h1>
        {locationDateMobile ? (
          <p className="mt-1 text-sm leading-snug text-gray-600 whitespace-pre-line">{locationDateMobile}</p>
        ) : date ? (
          <p className="mt-1 text-sm text-gray-500">Tarih yakında</p>
        ) : null}
      </div>

      <div className="match-info hidden md:block">
        <div className="mb-4 flex items-center justify-evenly gap-8">
          <div className="text-center">
            {date ? (
              <>
                <div className="text-2xl font-semibold">{formatTimeTR(date)}</div>
                <div className="mt-1 text-xs text-gray-500">{formatDateOnly(date)}</div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Tarih yakında</div>
            )}
          </div>
        </div>
        <h1 className="m-0 pb-5 pt-2 text-center text-base font-normal leading-snug text-gray-800 whitespace-pre-line">
          {name}
        </h1>
        {location ? (
          <div className="border-y border-gray-100 py-5 text-center text-sm leading-snug text-gray-800 whitespace-pre-line">
            {location}
          </div>
        ) : null}
      </div>

      {showStadiumPlan ? (
        <div
          className={
            location
              ? "mt-2 -mx-4 lg:mt-6 lg:-mx-6"
              : "mt-2 -mx-4 border-t border-gray-100 pt-2 lg:mt-6 lg:-mx-6 lg:pt-5"
          }
        >
          {stadiumPlanPath ? (
            <StadiumPlanInteractive
              src={stadiumPlanPath}
              alt={translate(messages, "eventDetail.stadiumPlanAlt")}
              locale={locale}
              listingAvailability={listingAvailability}
              listingSummaries={listingSummaries}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              {translate(messages, "eventDetail.stadiumPlanNotFound")}
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3 lg:mt-4 lg:pt-4">
        {passo ? (
          <>
            <div className="flex items-start gap-3 p-2">
              <PassoIcon />
              <p className="text-xs leading-relaxed text-gray-500">
                Etkinliğe katılım için Passolig Kartı zorunludur. Tüm katılımcıların kendi adına düzenlenmiş bir
                Passolig kartına sahip olması gerekmektedir.
              </p>
            </div>
            <div className="flex items-start gap-3 p-2">
              <PassoIcon />
              <p className="text-xs leading-relaxed text-gray-500">
                Yalnızca ev sahibi takım logolu Passolig kartı olan katılımcılar etkinliğe giriş yapabilir. Bu kurala
                dikkat edilmesi gerektiğini önemle hatırlatırız.
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-3 p-2">
            <PassoIcon />
            <p className="text-xs leading-relaxed text-gray-500">
              Bilet satış koşulları ve iade politikaları hakkında detaylı bilgi için lütfen{" "}
              <Link href={sssHref} className="text-blue-500 underline hover:opacity-80">
                S.S.S.
              </Link>{" "}
              sayfamızı ziyaret ediniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PassoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 shrink-0">
      <path
        d="M1.6867 9.59598C1.54493 10.498 2.17875 11.1241 2.95478 11.4361C5.92996 12.6324 10.0702 12.6324 13.0453 11.4361C13.8214 11.1241 14.4552 10.498 14.3135 9.59598C14.2263 9.04165 13.7955 8.58005 13.4763 8.12931C13.0583 7.53165 13.0167 6.87978 13.0167 6.18625C13.0167 3.50605 10.7707 1.33331 8.00008 1.33331C5.2295 1.33331 2.9835 3.50605 2.9835 6.18625C2.98344 6.87978 2.9419 7.53165 2.52382 8.12931C2.20464 8.58005 1.77382 9.04165 1.6867 9.59598Z"
        stroke="#141B34"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 14C6.53075 14.4146 7.23167 14.6667 8 14.6667C8.76833 14.6667 9.46927 14.4146 10 14"
        stroke="#141B34"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
