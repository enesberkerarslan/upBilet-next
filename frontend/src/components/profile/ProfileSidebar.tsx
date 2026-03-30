"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocale } from "@/contexts/locale-context";
import { PROFILE_SECTIONS, profileSectionPath, type ProfileSection } from "@/lib/profile-path";
import { useAuthStore } from "@/stores/auth-store";

const SECTION_ICON: Record<ProfileSection, string> = {
  biletlerim: "/profile/sidebaricon/ticket.svg",
  ilanlarim: "/profile/sidebaricon/listings.svg",
  "sattigim-biletler": "/profile/sidebaricon/soldtickets.svg",
  odemelerim: "/profile/sidebaricon/payments.svg",
  "banka-hesaplarim": "/profile/sidebaricon/banks.svg",
  adreslerim: "/profile/sidebaricon/adress.svg",
  "kisisel-bilgilerim": "/profile/sidebaricon/person.svg",
  destek: "/profile/sidebaricon/support.svg",
};

export type ProfileMenuKey = ProfileSection;

export type ProfileHeader = {
  name: string;
  surname: string;
  phone: string;
  email: string;
  isLoading: boolean;
};

type Props = {
  profile: ProfileHeader;
};

function initials(name: string, surname: string) {
  const a = name?.charAt(0)?.toUpperCase() ?? "";
  const b = surname?.charAt(0)?.toUpperCase() ?? "";
  return (a + b || "U").slice(0, 2);
}

function fullName(name: string, surname: string, t: (p: string) => string) {
  if (!name && !surname) return t("profile.userFallback");
  return `${name} ${surname}`.trim();
}

function normalizePath(p: string) {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

export function ProfileSidebar({ profile }: Props) {
  const { t, href } = useLocale();
  const pathname = normalizePath(usePathname() ?? "");
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = useMemo(
    () =>
      PROFILE_SECTIONS.map((key) => ({
        key,
        label: t(`profile.sectionMetaTitle.${key}`),
        icon: SECTION_ICON[key],
      })),
    [t]
  );

  function itemHref(key: ProfileMenuKey) {
    return href(profileSectionPath(key));
  }

  function isActive(key: ProfileMenuKey) {
    const target = normalizePath(itemHref(key));
    return pathname === target;
  }

  const activeItem = menuItems.find((i) => isActive(i.key)) ?? menuItems[0];

  function handleLogout() {
    logout();
    router.push(href("/"));
  }

  const rowClass = (key: ProfileMenuKey) =>
    [
      "flex w-full items-center gap-3 rounded-lg px-2 py-4 text-sm transition",
      isActive(key)
        ? "border-l-4 border-[#615FFF] bg-[#615FFF] font-semibold text-white"
        : "border-l-4 border-transparent text-gray-800 hover:bg-gray-50",
    ].join(" ");

  return (
    <>
      <div className="hidden w-80 flex-col rounded-2xl bg-white pt-6 lg:flex">
        <div className="flex items-center gap-4 border-b border-gray-100 px-6 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            {profile.isLoading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-500" />
            ) : profile.name ? (
              <span className="text-lg font-semibold text-gray-600">{initials(profile.name, profile.surname)}</span>
            ) : (
              <svg width={28} height={28} fill="none" aria-hidden>
                <circle cx={14} cy={14} r={14} fill="#E5E7EB" />
              </svg>
            )}
          </div>
          <div>
            {profile.isLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            ) : (
              <>
                <div className="text-base font-semibold">{fullName(profile.name, profile.surname, t)}</div>
                <div className="text-xs text-gray-500">{profile.phone || t("profile.noPhone")}</div>
              </>
            )}
          </div>
        </div>
        <ul className="my-6 list-none p-4 pb-5">
          {menuItems.map((item) => (
            <li key={item.key}>
              <Link href={itemHref(item.key)} className={rowClass(item.key)}>
                <Image
                  src={item.icon}
                  alt=""
                  width={20}
                  height={20}
                  className={`block shrink-0 ${isActive(item.key) ? "invert" : ""}`}
                />
                <span className="inline-block translate-y-0.5">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mx-8 border-t border-gray-100" />
        <button
          type="button"
          onClick={handleLogout}
          className="mt-0 flex cursor-pointer items-center gap-2 px-8 py-4 font-medium text-red-600 transition hover:bg-red-50"
        >
          <Image src="/profile/sidebaricon/logout.svg" alt="" width={20} height={20} />
          {t("profile.logout")}
        </button>
      </div>

      <div className="mb-2 w-full rounded-2xl bg-white lg:hidden">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <Image src={activeItem.icon} alt="" width={20} height={20} />
              <span className="font-medium">{activeItem.label}</span>
            </div>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {mobileOpen ? (
            <button
              type="button"
              aria-label={t("header.close")}
              className="fixed inset-0 z-10 bg-black/20"
              onClick={() => setMobileOpen(false)}
            />
          ) : null}
          {mobileOpen ? (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="py-3">
                {menuItems.map((item) => (
                  <Link
                    key={item.key}
                    href={itemHref(item.key)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-50 ${
                      isActive(item.key) ? "bg-blue-50 font-semibold text-[#615FFF]" : "text-gray-700"
                    }`}
                  >
                    <Image
                      src={item.icon}
                      alt=""
                      width={20}
                      height={20}
                      className={isActive(item.key) ? "brightness-75" : ""}
                    />
                    {item.label}
                  </Link>
                ))}
                <div className="mx-4 my-3 border-t border-gray-100" />
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left text-red-600 hover:bg-red-50"
                >
                  <Image src="/profile/sidebaricon/logout.svg" alt="" width={20} height={20} />
                  {t("profile.logout")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
