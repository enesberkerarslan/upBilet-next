import Link from "next/link";
import type { Locale } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";

const categories = [
  { id: 1, name: "Futbol", icon: "/icons/football.svg", slug: "futbol" },
  { id: 2, name: "Basketbol", icon: "/icons/basketball.svg", slug: "basketbol" },
  { id: 3, name: "Şampiyonlar Ligi", icon: "/icons/champions-league.png", slug: "uefa-sampiyonlar-ligi" },
  { id: 4, name: "UEFA Avrupa Ligi", icon: "/icons/uefa-league.png", slug: "uefa-avrupa-ligi" },
  { id: 5, name: "Konserler", icon: "/icons/concert.svg", slug: "konser" },
];

export function MainCategoryBox({ locale }: { locale: Locale }) {
  return (
    <>
      <div className="hidden w-full gap-4 overflow-x-auto md:flex">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={localizedPath(locale, `/kategori/${c.slug}`)}
            className="flex w-1/5 flex-col items-center justify-center rounded-xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="mb-2 h-8 w-8">
              <img src={c.icon} alt={c.name} className="h-full w-full object-contain" />
            </div>
            <span className="text-sm font-medium text-gray-800">{c.name}</span>
          </Link>
        ))}
      </div>

      <div className="w-full md:hidden">
        <div className="mb-3">
          <Link
            href={localizedPath(locale, `/kategori/${categories[0].slug}`)}
            className="flex h-36 w-full flex-col items-center justify-center rounded-xl bg-white p-6 shadow-sm"
          >
            <div className="mb-2 h-8 w-8">
              <img src={categories[0].icon} alt={categories[0].name} className="h-full w-full object-contain" />
            </div>
            <span className="text-sm font-medium text-gray-800">{categories[0].name}</span>
          </Link>
        </div>
        <div className="mb-3 flex gap-3">
          {categories.slice(1, 3).map((c) => (
            <Link
              key={c.id}
              href={localizedPath(locale, `/kategori/${c.slug}`)}
              className="flex h-36 w-1/2 flex-col items-center justify-center rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="mb-2 h-8 w-8">
                <img src={c.icon} alt={c.name} className="h-full w-full object-contain" />
              </div>
              <span className="text-sm font-medium text-gray-800">{c.name}</span>
            </Link>
          ))}
        </div>
        <div className="flex gap-3">
          {categories.slice(3, 5).map((c) => (
            <Link
              key={c.id}
              href={localizedPath(locale, `/kategori/${c.slug}`)}
              className="flex h-36 w-1/2 flex-col items-center justify-center rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="mb-2 h-8 w-8">
                <img src={c.icon} alt={c.name} className="h-full w-full object-contain" />
              </div>
              <span className="text-sm font-medium text-gray-800">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
