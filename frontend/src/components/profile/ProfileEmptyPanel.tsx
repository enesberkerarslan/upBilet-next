"use client";

import type { ReactNode } from "react";
import {
  ProfileSidebarMaskedIcon,
  profileEmptyMaskedIconClass,
  profileSidebarIconSrc,
} from "@/components/profile/ProfileSidebarMaskedIcon";

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

const SQUARE_BOX =
  "mb-6 flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-2xl border border-[#615FFF]/15 bg-white md:mb-7 md:h-[112px] md:w-[112px]";

export function ProfileEmptyPanel({ variant, title, description, action }: Props) {
  const src = profileSidebarIconSrc[variant];

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-white py-16 md:py-20">
      <div className={SQUARE_BOX}>
        <ProfileSidebarMaskedIcon src={src} className={profileEmptyMaskedIconClass} />
      </div>
      <h2 className="mb-2 text-center text-lg font-semibold text-gray-800">{title}</h2>
      <p className="mb-6 max-w-md text-center text-sm text-gray-500">{description}</p>
      {action ? <div className="flex flex-wrap justify-center">{action}</div> : null}
    </div>
  );
}
