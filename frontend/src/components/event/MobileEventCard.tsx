import Link from "next/link";
import type { Locale } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";
import type { PublicEvent } from "@/types/event";

function validImage(url?: string) {
  if (!url?.trim() || url.includes(" ")) return null;
  return url;
}

function shortDateParts(dateInput: string) {
  const raw = String(dateInput || "").replace("Z", "");
  const [datePart] = raw.split("T");
  const [yearStr, monthStr, dayStr] = (datePart || "").split("-");
  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];
  const mi = Number(monthStr) - 1;
  return {
    day: Number(dayStr),
    month: months[mi] || "",
    year: Number(yearStr),
  };
}

export function MobileEventCard({ event, locale }: { event: PublicEvent; locale: Locale }) {
  const img = validImage(event.image);
  const d = shortDateParts(event.date);
  return (
    <div className="group w-full">
      <Link href={localizedPath(locale, `/detay/${event.slug}`)}>
        <div className="relative h-full overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="relative h-64 overflow-hidden">
            <div className="absolute right-4 top-4 z-10 min-w-[60px] rounded-xl bg-yellow-400 px-3 py-2 text-center font-bold text-black">
              <div className="text-2xl leading-none">{d.day}</div>
              <div className="text-xs">{d.month}</div>
              <div className="text-xs">{d.year}</div>
            </div>
            {img ? (
              <img
                src={img}
                alt={event.metaTitle || event.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-gray-800 to-gray-900 text-white">
                <span className="text-sm font-medium">{event.name}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 text-white">
              <h3 className="text-lg font-semibold leading-tight">{event.name}</h3>
              {event.location ? <p className="mt-1 text-sm opacity-90">{event.location}</p> : null}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
