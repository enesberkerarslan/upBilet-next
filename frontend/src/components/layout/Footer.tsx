"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/contexts/locale-context";

export function Footer() {
  const { href } = useLocale();
  return (
    <footer className="mt-10 flex w-full justify-center py-8 text-sm text-gray-600 md:mt-20 md:py-10">
      <div className="container mx-auto max-w-[1280px] flex-col px-4 md:px-6">
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6 md:gap-8">
          <div className="col-span-2 flex flex-col gap-2 lg:col-span-1">
            <Link href={href("/")}>
              <Image src="/img/logo.svg" alt="UpBilet" width={128} height={32} className="mb-2 w-24 md:mb-4 md:w-32" />
            </Link>
            <div className="flex items-center gap-2">
              <Image src="/generalicon/mail.svg" alt="" width={20} height={20} className="h-[18px] w-[18px]" />
              <a href="mailto:destek@upbilet.com" className="text-xs md:text-sm">
                destek@upbilet.com
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-sm font-semibold md:text-base">Futbol Biletleri</h3>
            <Link href={href("/kategori/galatasaray")} className="text-xs hover:text-gray-900 md:text-sm">
              Galatasaray Maç Biletleri
            </Link>
            <Link href={href("/kategori/fenerbahce")} className="text-xs hover:text-gray-900 md:text-sm">
              Fenerbahçe Maç Biletleri
            </Link>
            <Link href={href("/kategori/besiktas")} className="text-xs hover:text-gray-900 md:text-sm">
              Beşiktaş Maç Biletleri
            </Link>
            <Link href={href("/kategori/trabzonspor")} className="text-xs hover:text-gray-900 md:text-sm">
              Trabzonspor Maç Biletleri
            </Link>
            <Link href={href("/kategori/basaksehir")} className="text-xs hover:text-gray-900 md:text-sm">
              Başakşehir Maç Biletleri
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-sm font-semibold md:text-base">Spor Biletleri</h3>
            <Link href={href("/kategori/futbol")} className="text-xs hover:text-gray-900 md:text-sm">
              Futbol Biletleri
            </Link>
            <Link href={href("/kategori/basketbol")} className="text-xs hover:text-gray-900 md:text-sm">
              Basketbol Biletleri
            </Link>
            <Link href={href("/kategori/fenerbahce-basketbol")} className="text-xs hover:text-gray-900 md:text-sm">
              Fenerbahçe Basketbol Biletleri
            </Link>
            <Link href={href("/kategori/galatasaray-basketbol")} className="text-xs hover:text-gray-900 md:text-sm">
              Galatasaray Basketbol Biletleri
            </Link>
            <Link href={href("/kategori/anadolu-efes")} className="text-xs hover:text-gray-900 md:text-sm">
              Anadolu Efes Basketbol Biletleri
            </Link>
          </div>
          <div className="col-span-2 flex flex-col gap-2 lg:col-span-1">
            <h3 className="mb-2 text-sm font-semibold md:text-base">Konser Biletleri</h3>
            <Link href={href("/kategori/konser")} className="text-xs hover:text-gray-900 md:text-sm">
              Konser Biletleri
            </Link>
          </div>
        </div>
        <div className="mt-6 flex w-full flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 md:mt-8 md:flex-row md:gap-0 md:pt-8">
          <div className="flex flex-col items-center gap-2 text-center md:flex-row md:items-start md:text-left">
            <span className="text-xs md:text-sm">©2026, Tüm hakları saklıdır</span>
            <div className="flex flex-wrap justify-center gap-2 md:justify-start md:gap-4">
              <Link href={href("/bilgi/cerez-politikasi")} className="text-xs hover:text-gray-900 md:text-sm">
                Çerez Politikası
              </Link>
              <Link href={href("/bilgi/kullanim-sozlesmesi")} className="text-xs hover:text-gray-900 md:text-sm">
                Kullanım Sözleşmesi
              </Link>
              <Link href={href("/bilgi/sikca-sorulan-sorular")} className="text-xs hover:text-gray-900 md:text-sm">
                Sıkça Sorulan Sorular
              </Link>
              <Link href={href("/blog")} className="text-xs hover:text-gray-900 md:text-sm">
                Blog
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/img/mastercard.png" alt="Mastercard" width={40} height={24} className="h-6 w-auto md:h-8" />
            <Image src="/img/visa.png" alt="Visa" width={40} height={24} className="h-6 w-auto md:h-8" />
            <Image src="/img/troy.png" alt="Troy" width={40} height={24} className="h-6 w-auto md:h-8" />
          </div>
        </div>
      </div>
    </footer>
  );
}
