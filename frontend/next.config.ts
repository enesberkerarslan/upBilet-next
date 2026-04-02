import type { NextConfig } from "next";

const profileSlugRedirects: { from: string; to: string }[] = [
  { from: "tickets", to: "biletlerim" },
  { from: "listings", to: "ilanlarim" },
  { from: "sold", to: "sattigim-biletler" },
  { from: "payments", to: "odemelerim" },
  { from: "bank", to: "banka-hesaplarim" },
  { from: "address", to: "adreslerim" },
  { from: "personal", to: "kisisel-bilgilerim" },
  { from: "support", to: "destek" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    const locales = ["tr", "en"] as const;
    const prefixed = profileSlugRedirects.flatMap(({ from, to }) =>
      locales.map((locale) => ({
        source: `/${locale}/profil/${from}`,
        destination: `/${locale}/profil/${to}`,
        permanent: true,
      }))
    );
    /** Varsayılan TR: tarayıcıda /profil/... (locale öneki yok) */
    const prefixless = profileSlugRedirects.map(({ from, to }) => ({
      source: `/profil/${from}`,
      destination: `/profil/${to}`,
      permanent: true,
    }));
    return [...prefixless, ...prefixed];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "d6j5di8d46w7x.cloudfront.net", pathname: "/**" },
      { protocol: "https", hostname: "d118zx96cghsvi.cloudfront.net", pathname: "/**" },
      { protocol: "https", hostname: "www.upbilet.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
