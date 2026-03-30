"use client";

import type { ReactNode } from "react";

const BRAND = "#615FFF";

export type ProfileEmptyVariant =
  | "tickets"
  | "sold"
  | "payments"
  | "listings"
  | "bank"
  | "address"
  | "support";

type Props = {
  variant: ProfileEmptyVariant;
  title: string;
  description: string;
  action?: ReactNode;
};

const SIDEBAR_ICON: Record<ProfileEmptyVariant, string> = {
  tickets: "/profile/sidebaricon/ticket.svg",
  sold: "/profile/sidebaricon/soldtickets.svg",
  payments: "/profile/sidebaricon/payments.svg",
  listings: "/profile/sidebaricon/listings.svg",
  bank: "/profile/sidebaricon/banks.svg",
  address: "/profile/sidebaricon/adress.svg",
  support: "/profile/sidebaricon/support.svg",
};

/** Sidebar SVG’yi dosyayı değiştirmeden site moruna boyar (mask) */
function EmptySidebarIcon({ src }: { src: string }) {
  const mask = `url("${src}")`;
  return (
    <span
      aria-hidden
      className="inline-block h-6 w-6 shrink-0 md:h-7 md:w-7"
      style={{
        backgroundColor: BRAND,
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

const SQUARE_BOX =
  "mb-6 flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-2xl border border-[#615FFF]/15 bg-white md:mb-7 md:h-[112px] md:w-[112px]";

export function ProfileEmptyPanel({ variant, title, description, action }: Props) {
  const src = SIDEBAR_ICON[variant];

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-white py-16 md:py-20">
      <div className={SQUARE_BOX}>
        <EmptySidebarIcon src={src} />
      </div>
      <h2 className="mb-2 text-center text-lg font-semibold text-gray-800">{title}</h2>
      <p className="mb-6 max-w-md text-center text-sm text-gray-500">{description}</p>
      {action ? <div className="flex flex-wrap justify-center">{action}</div> : null}
    </div>
  );
}
