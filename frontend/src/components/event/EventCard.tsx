import Link from "next/link";
import type { Locale } from "@/i18n";
import { formatDateTR, formatTimeTR } from "@/lib/date";
import { localizedPath } from "@/lib/locale-path";
import type { PublicEvent } from "@/types/event";

function tagLabel(event: PublicEvent) {
  const t = event.tags?.find((x) => x.tag === "GenelTag");
  return t?.name ?? "Etkinlik";
}

function validImage(url?: string) {
  if (!url?.trim() || url.includes(" ")) return null;
  return url;
}

export function EventCard({ event, locale }: { event: PublicEvent; locale: Locale }) {
  const img = validImage(event.image);
  return (
    <div className="group w-full">
      <Link href={localizedPath(locale, `/detay/${event.slug}`)}>
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="relative h-40 overflow-hidden md:h-48">
            <div className="absolute left-2 top-2 z-10 rounded-full bg-white px-3 py-1 text-xs font-medium md:left-4 md:top-4 md:px-4 md:text-sm">
              {tagLabel(event)}
            </div>
            {img ? (
              <img
                src={img}
                alt={event.metaTitle || event.name}
                className="h-full w-full object-cover transition group-hover:scale-125"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 text-gray-500">
                <span className="text-sm font-medium">Resim Bulunamadı</span>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col p-3 md:p-4">
            <h3 className="mb-2 line-clamp-2 h-12 text-base font-semibold leading-tight md:h-14 md:text-lg">
              {event.name}
            </h3>
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                {formatDateTR(event.date)} {formatTimeTR(event.date)}
              </span>
            </div>
            <div className="flex-1" />
            <div className="my-4 h-px w-full bg-[#F4F4F5]" />
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="flex h-7 w-20 items-center justify-center rounded-[33px] bg-[#F4F4F5] text-xs font-medium text-gray-600 group-hover:bg-[#615FFF] group-hover:text-white md:h-[30px] md:w-[90px] md:text-sm"
              >
                Göz at
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
