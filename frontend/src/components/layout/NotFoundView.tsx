import Link from "next/link";
import { defaultLocale, type Locale } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";

export function NotFoundView({ locale = defaultLocale }: { locale?: Locale }) {
  return (
    <div className="flex flex-col items-center justify-center text-[#18181B]">
      <div className="flex min-h-[60vh] w-full items-center justify-center py-5">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <div
            role="img"
            aria-hidden
            className="mx-auto mb-8 aspect-350/210 w-full max-w-[350px] bg-[url('/404-illustration-mobile.svg')] bg-contain bg-center bg-no-repeat md:mb-2 md:aspect-872/521 md:max-w-[872px] md:bg-[url('/404-illustration-desktop.svg')]"
          />

          <h2 className="mb-8 hidden text-center text-2xl text-zinc-600 md:block">
            Üzgünüz, bu sayfa bulunamadı
          </h2>

          <Link
            href={localizedPath(locale, "/")}
            className="inline-flex items-center rounded-full bg-zinc-200 px-10 py-3 text-zinc-900 transition-colors duration-200 hover:bg-zinc-300"
          >
            Ana Sayfaya Geri Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
