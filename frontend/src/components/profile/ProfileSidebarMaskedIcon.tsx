"use client";

/** Profil sidebar ile aynı mor */
export const PROFILE_BRAND_PURPLE = "#615FFF";

export const profileSidebarIconSrc = {
  tickets: "/profile/sidebaricon/ticket.svg",
  sold: "/profile/sidebaricon/soldtickets.svg",
  payments: "/profile/sidebaricon/payments.svg",
  listings: "/profile/sidebaricon/listings.svg",
  bank: "/profile/sidebaricon/banks.svg",
  address: "/profile/sidebaricon/adress.svg",
  support: "/profile/sidebaricon/support.svg",
} as const;

/** Profil boş ekran karesi içi ikon (ProfileEmptyPanel, adres/banka ile aynı ölçü) */
export const profileEmptyMaskedIconClass = "h-9 w-9 shrink-0 md:h-10 md:w-10";

/** Sidebar SVG’yi dosyayı değiştirmeden site moruna boyar (mask) */
export function ProfileSidebarMaskedIcon({
  src,
  className = "h-6 w-6 shrink-0 md:h-7 md:w-7",
}: {
  src: string;
  className?: string;
}) {
  const mask = `url("${src}")`;
  return (
    <span
      aria-hidden
      className={`inline-block ${className}`}
      style={{
        backgroundColor: PROFILE_BRAND_PURPLE,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

const rowIconWrapClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] md:h-10 md:w-10";
const rowIconMaskClass = "h-5 w-5 shrink-0 md:h-6 md:w-6";

/** Adres / banka liste satırı: sidebar ikonu, boş ekranla uyumlu mor + lavanta kutu */
export function ProfileAddressBankRowIcon({ type }: { type: "address" | "bank" }) {
  const src = profileSidebarIconSrc[type === "address" ? "address" : "bank"];
  return (
    <div className={rowIconWrapClass} aria-hidden>
      <ProfileSidebarMaskedIcon src={src} className={rowIconMaskClass} />
    </div>
  );
}
