import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { GoogleOAuthHandler } from "@/components/auth/GoogleOAuthHandler";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm-sans",
  display: "swap",
});

/** SSR / Data Cache: API verisi her istekte taze */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "UpBilet - Etkinlik Biletleri",
  description:
    "UpBilet ile güvenli bilet alım satımı yapın. Futbol, basketbol ve tüm etkinlik biletleri.",
  metadataBase: new URL("https://upbilet.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${dmSans.variable} min-h-screen bg-[#F4F4F5] font-sans text-[#18181B] antialiased`}>
        <GoogleOAuthHandler />
        {children}
      </body>
    </html>
  );
}
