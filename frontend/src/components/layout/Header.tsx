"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EventImageFallback,
  EventSearchRowArrow,
  SearchLoadingPanel,
  SearchNoResultsPanel,
} from "@/components/layout/search-event-dropdown-primitives";
import { useLocale } from "@/contexts/locale-context";
import { formatDateTR, formatTimeTR } from "@/lib/date";
import type { InitialAuthFromCookies } from "@/components/layout/AppShell";
import { navigationItems } from "@/lib/nav-items";
import { PROFILE_DEFAULT_SECTION, profileSectionPath, type ProfileSection } from "@/lib/profile-path";
import { searchEventsClient } from "@/lib/search-events";
import { useAuthStore } from "@/stores/auth-store";
import type { PublicEvent } from "@/types/event";

const PROFILE_LISTINGS_SECTION: ProfileSection = "ilanlarim";

/** Bilet gövdesi: sol kısım (kesik çizgi) + sağda satır çizgileri — küçük boyutta okunaklı. */
function TicketSellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect
        x="3"
        y="5.25"
        width="18"
        height="13.5"
        rx="2.75"
        fill="currentColor"
        fillOpacity={0.1}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <line
        x1="10.25"
        y1="5.25"
        x2="10.25"
        y2="18.75"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeDasharray="2.2 2.8"
        strokeLinecap="round"
      />
      <line x1="13.25" y1="9.25" x2="19.25" y2="9.25" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" opacity={0.9} />
      <line x1="13.25" y1="12" x2="18.5" y2="12" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" opacity={0.75} />
      <line x1="13.25" y1="14.75" x2="17" y2="14.75" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" opacity={0.6} />
    </svg>
  );
}

type HeaderProps = { initialAuth?: InitialAuthFromCookies };

export function Header({ initialAuth = { hasSession: false, userType: null } }: HeaderProps) {
  const { t, href } = useLocale();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const userType = useAuthStore((s) => s.userType);
  const logout = useAuthStore((s) => s.logout);
  const [persistReady, setPersistReady] = useState(false);

  useEffect(() => {
    const done = useAuthStore.persist.onFinishHydration(() => setPersistReady(true));
    if (useAuthStore.persist.hasHydrated()) setPersistReady(true);
    return done;
  }, []);

  /** Çerez (SSR) + persist sonrası store — girişte anında doğru rol. */
  const isLoggedIn = persistReady ? Boolean(token) : initialAuth.hasSession;
  const effectiveUserType = persistReady ? userType : initialAuth.userType;
  const isAdmin = isLoggedIn && effectiveUserType === "Admin";
  /** Çıkış yapmış kullanıcıda persist beklerken boşluk yerine hemen Giriş / Biletini sat göster. */
  const sellTicketHref = href(isLoggedIn ? profileSectionPath(PROFILE_LISTINGS_SECTION) : "/giris");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicEvent[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const performSearchFor = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    setShowResults(true);
    setSearchResults([]);
    try {
      const evs = await searchEventsClient(q);
      setSearchResults(evs);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const scheduleSearch = useCallback(
    (value: string) => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (!value.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      searchTimeout.current = setTimeout(() => void performSearchFor(value), 300);
    },
    [performSearchFor]
  );

  const selectEvent = (event: PublicEvent) => {
    setShowResults(false);
    setSearchQuery("");
    router.push(href(`/detay/${event.slug}`));
  };

  const formatDate = (d: string) => `${formatDateTR(d)} ${formatTimeTR(d)}`;

  function goProfile() {
    setShowMobileMenu(false);
    router.push(href(profileSectionPath(PROFILE_DEFAULT_SECTION)));
  }

  function handleLogout() {
    logout();
    setShowMobileMenu(false);
    router.push(href("/"));
  }

  return (
    <div className="flex h-[80px] w-full items-center justify-between border-b border-[#E4E4E7]">
      <div className="container mx-auto flex max-w-[1280px] justify-between px-4 md:px-6">
        <div className="relative flex w-full items-center justify-between md:hidden">
          <button
            type="button"
            onClick={() => setShowMobileMenu((v) => !v)}
            className="relative z-10 -ml-2 p-2"
            aria-label={t("header.menu")}
          >
            <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            href={href("/")}
            prefetch={false}
            className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center"
          >
            <Image src="/img/logo.svg" alt="UpBilet" width={120} height={32} className="h-8 w-auto" />
          </Link>
          <Link
            href={sellTicketHref}
            className="relative z-10 ml-auto flex max-w-[min(100%,10.5rem)] shrink-0 items-center gap-1 rounded-full border border-[#615FFF]/40 bg-[#615FFF]/8 px-2.5 py-2 text-[10px] font-semibold leading-tight text-[#615FFF] hover:bg-[#615FFF]/12"
          >
            <TicketSellIcon className="h-3.5 w-3.5 shrink-0 text-[#615FFF]" />
            <span className="line-clamp-2 text-left">{t("header.sellTicket")}</span>
          </Link>
        </div>

        <div className="hidden w-full items-center justify-between md:flex">
          <div className="flex items-center">
            <div className="mr-8 flex max-w-[130px] items-center">
              <Link href={href("/")} prefetch={false}>
                <Image src="/img/logo.svg" alt="UpBilet" width={130} height={40} className="h-10 w-auto" />
              </Link>
            </div>

            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchQuery(v);
                  scheduleSearch(v);
                }}
                onFocus={() => searchQuery.trim() && searchResults.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                type="text"
                autoComplete="off"
                placeholder={t("header.searchPlaceholder")}
                aria-label={t("header.searchPlaceholder")}
                className="h-[40px] w-[200px] rounded-full border border-white/20 bg-white pl-10 pr-4 focus:border-white/40 focus:outline-none"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {isSearching && showResults && searchQuery.trim() ? (
                <div className="absolute left-0 top-full z-50 mt-1 w-[560px] rounded-lg border border-gray-200 bg-white shadow-xl">
                  <SearchLoadingPanel title={t("header.searching")} subtitle={t("header.searchingHint")} />
                </div>
              ) : showResults && searchResults.length > 0 ? (
                <div className="custom-scrollbar absolute left-0 top-full z-50 mt-1 max-h-96 w-[560px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                  {searchResults.map((event) => (
                    <button
                      key={event._id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectEvent(event)}
                      aria-label={`${event.name} — ${t("header.openEvent")}`}
                      className="w-full cursor-pointer border-b border-gray-100 p-4 text-left transition-colors last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="shrink-0">
                          <div className="h-12 w-12 overflow-hidden rounded-lg">
                            {event.image?.trim() && !event.image.includes(" ") ? (
                              <img
                                src={event.image}
                                alt={event.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <EventImageFallback />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-semibold leading-tight text-gray-900">{event.name}</h4>
                          <p className="mt-1 text-xs text-gray-600">{formatDate(event.date)}</p>
                        </div>
                        <EventSearchRowArrow />
                      </div>
                    </button>
                  ))}
                </div>
              ) : showResults && searchQuery.trim() && searchResults.length === 0 ? (
                <div className="absolute left-0 top-full z-50 mt-1 w-[560px] rounded-lg border border-gray-200 bg-white shadow-xl">
                  <SearchNoResultsPanel title={t("header.noResults")} subtitle={t("header.noResultsHint")} />
                </div>
              ) : null}
            </div>

            <div className="mx-8 h-6 w-px bg-[#D4D4D8]" />

            <nav className="menu relative flex items-center gap-6 text-sm font-medium text-[#18181B]">
              {navigationItems.map((item) =>
                item.hasDropdown ? (
                  <div key={item.id} className="relative">
                    <button
                      type="button"
                      className="flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === item.id ? null : item.id);
                      }}
                    >
                      {item.name}
                      <svg
                        className={`h-4 w-4 transition ${activeDropdown === item.id ? "rotate-180" : ""}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {activeDropdown === item.id ? (
                      <div
                        className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-gray-100 bg-white py-2 shadow-lg"
                        onMouseLeave={() => setActiveDropdown(null)}
                      >
                        {item.subItems?.map((sub) => (
                          <Link
                            key={sub.link}
                            href={href(sub.link)}
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link key={item.id} href={href(item.link)} className="hover:opacity-80">
                    {item.name}
                  </Link>
                )
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded-[32px] border border-[#615FFF] bg-[#615FFF] px-8 py-3 text-sm font-semibold text-white hover:opacity-80"
              >
                {t("header.admin")}
              </Link>
            ) : null}
              <Link
                href={sellTicketHref}
                className="inline-flex items-center gap-2 rounded-[32px] border border-[#615FFF]/40 bg-linear-to-r from-[#615FFF]/10 to-[#615FFF]/5 px-6 py-3 text-sm font-semibold text-[#4F46E5] shadow-sm transition hover:border-[#615FFF]/60 hover:from-[#615FFF]/14 hover:to-[#615FFF]/8"
              >
                <TicketSellIcon className="h-5 w-5 text-[#615FFF]" />
                {t("header.sellTicket")}
              </Link>
              {!isLoggedIn ? (
                <Link
                  href={href("/giris")}
                  className="rounded-[32px] border border-[#E4E4E7] bg-transparent px-8 py-3 text-sm font-semibold text-[#18181B] hover:border-[#D4D4D8] hover:bg-[#FAFAFA]"
                >
                  {t("header.login")}
                </Link>
              ) : (
                <Link
                  href={href(profileSectionPath(PROFILE_DEFAULT_SECTION))}
                  className="rounded-[32px] border border-[#615FFF] bg-[#615FFF] px-8 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  {t("header.profile")}
                </Link>
              )}
          </div>
        </div>
      </div>

      {showMobileMenu ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t("header.close")}
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 overflow-y-auto bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between gap-2">
                <Image src="/img/logo.svg" alt="UpBilet" width={120} height={32} className="h-8 w-auto" />
                <button type="button" onClick={() => setShowMobileMenu(false)} className="p-2" aria-label={t("header.close")}>
                  <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.id} className="border-b border-gray-100">
                    {item.hasDropdown ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMobileDropdown(activeMobileDropdown === item.id ? null : item.id)
                          }
                          className="flex w-full items-center justify-between rounded-xl px-4 py-4 font-medium text-gray-900 hover:bg-gray-50"
                        >
                          <span>{item.name}</span>
                          <svg
                            className={`h-5 w-5 transition ${activeMobileDropdown === item.id ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {activeMobileDropdown === item.id ? (
                          <div className="space-y-1 pb-2 pl-4">
                            {item.subItems?.map((sub) => (
                              <Link
                                key={sub.link}
                                href={href(sub.link)}
                                className="block rounded-xl px-4 py-2 text-gray-600 hover:bg-gray-50"
                                onClick={() => setShowMobileMenu(false)}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <Link
                        href={href(item.link)}
                        className="block w-full rounded-xl px-4 py-4 font-medium text-gray-900 hover:bg-gray-50"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
              <div className="mt-8 space-y-3">
                <Link
                  href={sellTicketHref}
                  onClick={() => setShowMobileMenu(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#615FFF]/40 bg-[#615FFF]/8 py-3 text-center font-semibold text-[#615FFF]"
                >
                  <TicketSellIcon className="h-5 w-5 shrink-0 text-[#615FFF]" />
                  {t("header.sellTicket")}
                </Link>
                {!isLoggedIn ? (
                  <Link
                    href={href("/giris")}
                    onClick={() => setShowMobileMenu(false)}
                    className="block w-full rounded-2xl bg-[#615FFF] py-3 text-center font-medium text-white"
                  >
                    {t("header.login")}
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={goProfile}
                      className="w-full rounded-2xl bg-[#615FFF] py-3 font-medium text-white"
                    >
                      {t("header.profile")}
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl border border-red-100 bg-red-50/50 py-4 font-medium text-red-600"
                    >
                      {t("header.logout")}
                    </button>
                  </>
                )}
              </div>
              <div className="mt-8 border-t border-gray-100 pt-6">
                <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#71717B]">
                  {t("header.sidebarLegalTitle")}
                </p>
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={href("/bilgi/sikca-sorulan-sorular")}
                    onClick={() => setShowMobileMenu(false)}
                    className="rounded-xl px-4 py-3 text-sm text-[#3F3F46] hover:bg-gray-50"
                  >
                    {t("header.sidebarFaq")}
                  </Link>
                  <Link
                    href={href("/bilgi/kullanim-sozlesmesi")}
                    onClick={() => setShowMobileMenu(false)}
                    className="rounded-xl px-4 py-3 text-sm text-[#3F3F46] hover:bg-gray-50"
                  >
                    {t("header.sidebarTerms")}
                  </Link>
                  <Link
                    href={href("/bilgi/cerez-politikasi")}
                    onClick={() => setShowMobileMenu(false)}
                    className="rounded-xl px-4 py-3 text-sm text-[#3F3F46] hover:bg-gray-50"
                  >
                    {t("header.sidebarCookies")}
                  </Link>

                  {!isLoggedIn ? (
                    <Link
                      href={href("/kayit")}
                      onClick={() => setShowMobileMenu(false)}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-[#615FFF] hover:bg-[#615FFF]/8"
                    >
                      {t("header.sidebarRegister")}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
