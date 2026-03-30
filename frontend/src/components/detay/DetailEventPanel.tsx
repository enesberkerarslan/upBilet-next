import { formatDateTR, formatTimeTR } from "@/lib/date";
import type { Locale } from "@/i18n";
import Link from "next/link";
import { localizedPath } from "@/lib/locale-path";

export type DetailTag = { name?: string; tag?: string };

type Props = {
  locale: Locale;
  name: string;
  date?: string | null;
  location?: string | null;
  tags?: DetailTag[];
};

function formatDateOnly(iso: string): string {
  try {
    const full = formatDateTR(iso);
    const parts = full.split(" ");
    if (parts.length < 3) return full;
    const [day, month, year] = parts;
    return `${day} ${String(month).toUpperCase()} ${year}`;
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

export function DetailEventPanel({ locale, name, date, location, tags }: Props) {
  const passo = hasPassoTag(tags);
  const sssHref = localizedPath(locale, "/bilgi/sikca-sorulan-sorular");

  return (
    <div className="rounded-3xl bg-white p-6">
      <h2 className="mb-6 text-center text-lg font-medium">Maç Detayları</h2>

      <div className="match-info">
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
        <div className="pb-5 pt-2 text-center text-gray-800">{name}</div>
        {location ? (
          <div className="border-y border-gray-100 py-5 text-center text-sm text-gray-800">{location}</div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
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
    <svg width="30" height="30" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <g clipPath="url(#clip_passo)">
        <path
          d="M1.6867 9.59598C1.54493 10.498 2.17875 11.1241 2.95478 11.4361C5.92996 12.6324 10.0702 12.6324 13.0453 11.4361C13.8214 11.1241 14.4552 10.498 14.3135 9.59598C14.2263 9.04165 13.7955 8.58005 13.4763 8.12931C13.0583 7.53165 13.0167 6.87978 13.0167 6.18625C13.0167 3.50605 10.7707 1.33331 8.00008 1.33331C5.2295 1.33331 2.9835 3.50605 2.9835 6.18625C2.98344 6.87978 2.9419 7.53165 2.52382 8.12931C2.20464 8.58005 1.77382 9.04165 1.6867 9.59598Z"
          stroke="#141B34"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 14C6.53075 14.4146 7.23167 14.6667 8 14.6667C8.76833 14.6667 9.46927 14.4146 10 14"
          stroke="#141B34"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip_passo">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
