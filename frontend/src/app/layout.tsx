import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { GoogleOAuthHandler } from "@/components/auth/GoogleOAuthHandler";
import { SITE_URL } from "@/lib/site-url";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm-sans",
  display: "swap",
  adjustFontFallback: true,
});

/** SSR / Data Cache: API verisi her istekte taze */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "UpBilet - Etkinlik Biletleri",
  description:
    "UpBilet ile güvenli bilet alım satımı yapın. Futbol, basketbol ve tüm etkinlik biletleri.",
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${dmSans.className} min-h-screen bg-[#F4F4F5] font-sans text-[#18181B] antialiased`}
      >
        <GoogleOAuthHandler />
        {children}
      </body>
    </html>
  );
}
