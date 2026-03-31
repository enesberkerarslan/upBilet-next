import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";
import type { PublicEvent } from "@/types/event";

function tableDateParts(dateInput: string) {
  const date = new Date(String(dateInput || "").replace("Z", ""));
  if (Number.isNaN(date.getTime())) return { day: "", monthYear: "" };
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
  const day = String(date.getUTCDate()).padStart(2, "0");
  const monthYear = `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  return { day, monthYear };
}

function tableTime(dateInput: string) {
  const date = new Date(String(dateInput || "").replace("Z", ""));
  if (Number.isNaN(date.getTime())) return "";
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function EventTable({ events, locale }: { events: PublicEvent[]; locale: Locale }) {
  return (
    <div className="w-full rounded-lg bg-white shadow-sm">
      <div className="mb-2 flex items-center justify-between p-4 pb-0 md:mb-3 md:p-8">
        <div className="flex items-center gap-2">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 2.23607C0 0.749304 1.56463 -0.217687 2.89443 0.447214L8.42229 3.21115C9.89639 3.94819 9.89639 6.05181 8.42229 6.78886L2.89443 9.55279C1.56462 10.2177 0 9.2507 0 7.76393V2.23607Z"
              fill="#9F9FA9"
            />
          </svg>
          <h2 className="text-lg font-medium text-gray-900 md:text-xl">Yaklaşan Etkinlikler</h2>
        </div>
        <Image src="/img/logo.svg" alt="UpBilet" width={120} height={32} className="h-6 w-auto md:h-8" />
      </div>

      <div className="hidden w-full divide-y divide-gray-100 px-4 md:block md:px-8">
        {events.map((event) => {
          const { day, monthYear } = tableDateParts(event.date);
          return (
            <div key={event._id} className="relative grid grid-cols-12 items-center gap-4 py-5 first:pt-2">
              <div className="col-span-3 flex items-center gap-3">
                <span className="truncate text-base font-medium text-black" title={event.name}>
                  {event.name}
                </span>
              </div>
              <div className="col-span-2 flex flex-col items-center justify-center">
                <div className="text-lg font-medium">{day}</div>
                <div className="text-sm text-gray-500">{monthYear}</div>
              </div>
              <div className="col-span-1 mr-10 flex flex-col items-center justify-center">
                <div className="text-base font-medium">{tableTime(event.date)}</div>
              </div>
              <div className="col-span-4 flex min-w-0 items-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 shrink-0"
                >
                  <path
                    d="M9.07847 14.2446C8.7894 14.5153 8.40293 14.6666 8.00073 14.6666C7.59853 14.6666 7.21213 14.5153 6.923 14.2446C4.27535 11.7506 0.727174 8.96452 2.45751 4.91969C3.39309 2.73269 5.63889 1.33325 8.00073 1.33325C10.3626 1.33325 12.6084 2.73269 13.544 4.91969C15.2721 8.95945 11.7327 11.7592 9.07847 14.2446Z"
                    stroke="#52525C"
                    strokeWidth="1.25"
                  />
                  <path
                    d="M10.3334 7.33333C10.3334 8.622 9.28869 9.66667 8.00002 9.66667C6.71135 9.66667 5.66669 8.622 5.66669 7.33333C5.66669 6.04467 6.71135 5 8.00002 5C9.28869 5 10.3334 6.04467 10.3334 7.33333Z"
                    stroke="#52525C"
                    strokeWidth="1.25"
                  />
                </svg>
                <span className="truncate text-sm text-gray-600" title={event.location}>
                  {event.location}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-3">
                {event.isMainPage ? (
                  <span className="inline-block whitespace-nowrap rounded-full bg-orange-50 px-3 py-1.5 text-sm text-orange-600">
                    Öne Çıkan
                  </span>
                ) : null}
                <Link
                  href={localizedPath(locale, `/detay/${event.slug}`)}
                  className="inline-block whitespace-nowrap rounded-full bg-[#6366F1] px-5 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Bilet Al
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 px-4 md:hidden md:px-8">
        {events.map((event) => {
          const { day, monthYear } = tableDateParts(event.date);
          return (
            <div key={event._id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-center gap-4">
                <span className="text-base font-medium text-black">{event.name}</span>
              </div>
              <hr className="mb-4 border-gray-200" />
              <div className="mb-4 flex items-center justify-between">
                <div className="text-left">
                  <div className="text-[13px] font-bold text-gray-900">
                    {day} {monthYear}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">{tableTime(event.date)}</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path
                    d="M9.07847 14.2446C8.7894 14.5153 8.40293 14.6666 8.00073 14.6666C7.59853 14.6666 7.21213 14.5153 6.923 14.2446C4.27535 11.7506 0.727174 8.96452 2.45751 4.91969C3.39309 2.73269 5.63889 1.33325 8.00073 1.33325C10.3626 1.33325 12.6084 2.73269 13.544 4.91969C15.2721 8.95945 11.7327 11.7592 9.07847 14.2446Z"
                    stroke="#52525C"
                    strokeWidth="1.25"
                  />
                  <path
                    d="M10.3334 7.33333C10.3334 8.622 9.28869 9.66667 8.00002 9.66667C6.71135 9.66667 5.66669 8.622 5.66669 7.33333C5.66669 6.04467 6.71135 5 8.00002 5C9.28869 5 10.3334 6.04467 10.3334 7.33333Z"
                    stroke="#52525C"
                    strokeWidth="1.25"
                  />
                </svg>
                <span className="text-sm text-gray-600">{event.location}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                {event.isMainPage ? (
                  <span className="inline-block rounded-full bg-orange-50 px-4 py-2 text-sm text-orange-600">
                    Öne Çıkan
                  </span>
                ) : (
                  <span />
                )}
                <Link
                  href={localizedPath(locale, `/detay/${event.slug}`)}
                  className="inline-block h-[42px] rounded-full bg-[#6366F1] px-5 text-center text-[13px] font-medium leading-[42px] text-white hover:bg-indigo-700"
                >
                  Bilet Al
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
