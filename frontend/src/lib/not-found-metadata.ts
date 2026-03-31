import type { Metadata } from "next";

/** 404 sayfası ve geçersiz kategori gibi durumlarda tutarlı <title> / SEO */
export const notFoundMetadata: Metadata = {
  title: "Hata 404 - UpBilet",
  description: "Aradığınız sayfa bulunamadı.",
  robots: { index: false, follow: false },
};
