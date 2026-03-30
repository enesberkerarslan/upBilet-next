"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";
import { getZoneColor } from "@/lib/detay-zone-colors";
import { TicketPurchaseModal, type ModalTicket } from "@/components/detay/TicketPurchaseModal";

export type TicketOption = {
  id: string;
  price: number;
  quantity: number;
  category: string;
  block?: string;
  row?: string;
  ticketType?: string;
};

type Props = {
  locale: Locale;
  eventName: string;
  tickets: TicketOption[];
};

const filterLabels = ["Tümü", "Ucuzdan Pahalıya", "Pahalıdan Ucuza"] as const;

export function DetailTicketList({ locale, eventName, tickets }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);
  const [modalTicket, setModalTicket] = useState<ModalTicket | null>(null);
  const personRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const filterOptions = useMemo(() => {
    const cats = [...new Set(tickets.map((t) => t.category).filter(Boolean))];
    return [...filterLabels, ...cats];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let list = [...tickets];
    if (selectedPerson !== null) {
      list = list.filter((t) => t.quantity >= selectedPerson);
    }
    if (selectedFilter === null || selectedFilter === 0) return list;
    if (selectedFilter === 1) return list.sort((a, b) => a.price - b.price);
    if (selectedFilter === 2) return list.sort((a, b) => b.price - a.price);
    const cat = filterOptions[selectedFilter];
    return list.filter((t) => t.category === cat);
  }, [tickets, selectedPerson, selectedFilter, filterOptions]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const t = e.target as Node;
    if (dropdownOpen && personRef.current && !personRef.current.contains(t)) setDropdownOpen(false);
    if (filterOpen && filterRef.current && !filterRef.current.contains(t)) setFilterOpen(false);
  }, [dropdownOpen, filterOpen]);

  useEffect(() => {
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const homeHref = localizedPath(locale, "/");

  return (
    <div>
      <div className="rounded-3xl bg-white p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <TicketSectionIcon />
              <h2 className="ml-2 text-lg font-semibold">Biletler</h2>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Etkinlik için mevcut biletleri görüntüleyebilir, filtreleyebilir ve satın alabilirsiniz.
            </p>
          </div>

          <div className="hidden h-6 w-px bg-slate-200 md:mr-10 md:block" />

          <div className="flex items-center gap-4 md:gap-3">
            <div className="relative" ref={personRef}>
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen((v) => !v);
                  setFilterOpen(false);
                }}
                className="relative flex items-center gap-1 rounded-3xl border border-slate-200 bg-zinc-100 px-3 py-2 text-xs md:gap-2 md:px-4 md:py-3"
              >
                <PersonIcon />
                <span className="whitespace-nowrap font-[family-name:var(--font-dm-sans)] text-[13px]">
                  {selectedPerson === null ? "Kaç kişisiniz?" : `${selectedPerson} Kişi`}
                </span>
                <ChevronDownIcon />
              </button>
              {dropdownOpen ? (
                <div className="absolute left-0 top-full z-10 mt-2 w-36 rounded-xl bg-white p-2 shadow-lg md:w-40">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setSelectedPerson(n);
                        setDropdownOpen(false);
                      }}
                      className="flex w-full cursor-pointer items-center rounded px-3 py-2"
                    >
                      <span className="relative flex h-5 w-5 items-center justify-center">
                        <span
                          className={`h-5 w-5 rounded-full border-2 ${
                            selectedPerson === n ? "border-black" : "border-gray-300"
                          }`}
                        />
                        {selectedPerson === n ? (
                          <span className="absolute h-2.5 w-2.5 rounded-full bg-black" />
                        ) : null}
                      </span>
                      <span
                        className={`ml-2 font-[family-name:var(--font-dm-sans)] text-[13px] ${
                          selectedPerson === n ? "text-black" : "text-gray-700"
                        }`}
                      >
                        {n} Kişi
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => {
                  setFilterOpen((v) => !v);
                  setDropdownOpen(false);
                }}
                className="relative flex items-center gap-1 rounded-3xl border border-slate-200 bg-zinc-100 px-3 py-2 text-xs md:gap-2 md:px-4 md:py-3"
              >
                <FilterIcon />
                <span className="font-[family-name:var(--font-dm-sans)] text-[13px]">
                  {selectedFilter === null ? "Sırala" : filterOptions[selectedFilter]}
                </span>
                <ChevronDownIcon />
              </button>
              {filterOpen ? (
                <div className="absolute left-0 top-full z-10 mt-2 w-36 rounded-xl bg-white p-2 shadow-lg md:w-40">
                  {filterOptions.map((label, idx) => (
                    <button
                      key={`${label}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedFilter(idx);
                        setFilterOpen(false);
                      }}
                      className="flex w-full cursor-pointer items-center rounded px-3 py-2"
                    >
                      <span className="relative flex h-5 w-5 items-center justify-center">
                        <span
                          className={`h-5 w-5 rounded-full border-2 ${
                            selectedFilter === idx ? "border-black" : "border-gray-300"
                          }`}
                        />
                        {selectedFilter === idx ? (
                          <span className="absolute h-2.5 w-2.5 rounded-full bg-black" />
                        ) : null}
                      </span>
                      <span
                        className={`ml-2 font-[family-name:var(--font-dm-sans)] text-[13px] ${
                          selectedFilter === idx ? "text-black" : "text-gray-700"
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <NoTicketsMessage
          title="Etkinliğe ait bilet bulunamadı"
          description="Bu etkinlik için şu anda satışta bilet bulunmamaktadır."
          action={
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] px-6 py-3 text-sm font-medium text-white shadow-[0_4px_12px_rgba(102,126,234,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)]"
            >
              <ArrowLeftIcon />
              Anasayfaya Geri Dön
            </Link>
          }
        />
      ) : filteredTickets.length === 0 ? (
        <NoTicketsMessage
          title="Seçtiğiniz kriterlere uygun bilet bulunamadı"
          description="Lütfen farklı filtre seçeneklerini deneyin veya tüm biletleri görüntüleyin."
          action={
            <button
              type="button"
              onClick={() => setSelectedFilter(0)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] px-6 py-3 text-sm font-medium text-white shadow-[0_4px_12px_rgba(102,126,234,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)]"
            >
              <ArrowRightIcon />
              Tüm Biletleri Göster
            </button>
          }
        />
      ) : (
        <div className="mt-2.5 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="relative rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-4"
            >
              <div className="mb-2 flex items-center gap-2 text-sm">
                <svg width="8" height="9" viewBox="0 0 8 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0 2.73607C0 1.2493 1.56462 0.282312 2.89443 0.947213L6.42229 2.71114C7.89639 3.44819 7.89639 5.55181 6.42229 6.28885L2.89443 8.05278C1.56463 8.71769 0 7.7507 0 6.26393V2.73607Z"
                    fill={getZoneColor(ticket.category)}
                  />
                </svg>
                <p className="text-sm font-medium" style={{ color: getZoneColor(ticket.category) }}>
                  {ticket.category}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {ticket.block || ticket.row ? (
                    <>
                      {ticket.block ? (
                        <>
                          Blok: <span className="mr-2 font-semibold">{ticket.block}</span>
                        </>
                      ) : null}
                      {ticket.row ? (
                        <>
                          Sıra: <span className="font-semibold">{ticket.row}</span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <span className="invisible">—</span>
                  )}
                </span>
                <span>{ticket.quantity > 1 ? `1-${ticket.quantity} Bilet` : "1 Bilet"}</span>
              </div>
              <span className="my-3 block w-full border-b border-gray-200" />
              <div className="flex items-center justify-between">
                <div className="flex items-baseline">
                  <span className="text-lg font-semibold md:text-xl">
                    {ticket.price.toLocaleString("tr-TR")}
                  </span>
                  <span className="ml-1 text-sm text-slate-500">TL</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalTicket(ticket)}
                  className="flex items-center gap-1 rounded-3xl bg-zinc-100 px-3 py-2 text-xs text-zinc-900 transition-colors duration-200 hover:bg-indigo-500 hover:text-white md:gap-2 md:px-4"
                >
                  Bilet Al
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1.00003 1L5 5L1 9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TicketPurchaseModal
        locale={locale}
        open={modalTicket !== null}
        ticket={modalTicket}
        matchName={eventName}
        onClose={() => setModalTicket(null)}
      />
    </div>
  );
}

function NoTicketsMessage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="no-tickets-message mt-4 rounded-xl bg-white px-5 py-8 text-center md:px-8 md:py-12">
      <div className="no-tickets-icon mb-5 flex justify-center opacity-60">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ticketGradientNt" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#667eea", stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: "#764ba2", stopOpacity: 0.6 }} />
            </linearGradient>
          </defs>
          <rect x="8" y="16" width="48" height="32" rx="4" fill="url(#ticketGradientNt)" stroke="#e5e7eb" strokeWidth="0.5" />
          <circle cx="8" cy="32" r="4" fill="#f5f5f5" />
          <circle cx="56" cy="32" r="4" fill="#f5f5f5" />
        </svg>
      </div>
      <h3 className="mb-3 text-xl font-semibold text-gray-700 md:text-2xl">{title}</h3>
      <p className="mb-6 text-sm leading-relaxed text-gray-500 md:text-base">{description}</p>
      {action}
    </div>
  );
}

function TicketSectionIcon() {
  return (
    <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.96231 2.89308C6.04171 2.96721 6.04171 3.09018 6.04171 3.33613V6.33334C6.04171 6.67851 6.32154 6.95834 6.66671 6.95834C7.01189 6.95834 7.29171 6.67851 7.29171 6.33334V3.29067C7.29171 3.05602 7.29171 2.9387 7.36483 2.8655C7.43794 2.79229 7.55496 2.79215 7.789 2.79186C7.94972 2.79167 8.11482 2.79167 8.28444 2.79167H8.28932H11.7114C13.0503 2.79166 14.1077 2.79166 14.9496 2.8856C15.8127 2.98191 16.5217 3.18303 17.1316 3.63514C17.5508 3.94594 17.9137 4.33067 18.2049 4.77091C18.7427 5.58387 18.9012 6.56945 18.9578 7.87203C18.9582 7.88106 18.9584 7.8901 18.9584 7.89913V13.1009C18.9584 13.1099 18.9582 13.1189 18.9578 13.128C18.9012 14.4306 18.7427 15.4162 18.2049 16.2291C17.9137 16.6693 17.5508 17.0541 17.1316 17.3648C16.5217 17.817 15.8127 18.0181 14.9496 18.1144C14.1077 18.2083 13.0504 18.2083 11.7115 18.2083H8.28936H8.28518C8.11529 18.2083 7.94994 18.2083 7.78899 18.2082C7.55497 18.2078 7.43794 18.2078 7.36483 18.1345C7.29171 18.0613 7.29171 17.944 7.29171 17.7093V14.6667C7.29171 14.3215 7.01189 14.0417 6.66671 14.0417C6.32154 14.0417 6.04171 14.3215 6.04171 14.6667V17.6639C6.04171 17.9098 6.04171 18.0328 5.96231 18.1069C5.88291 18.1811 5.76288 18.1728 5.52282 18.1563C5.3585 18.1449 5.20142 18.1312 5.0512 18.1144C4.18811 18.0181 3.47914 17.817 2.86922 17.3648C2.44993 17.0541 2.08701 16.6693 1.79582 16.2291C1.25815 15.4163 1.09953 14.4308 1.04299 13.1284C1.01598 12.5063 1.54014 12.0885 2.05447 12.0885C2.83104 12.0885 3.52045 11.4113 3.52045 10.5C3.52045 9.58867 2.83104 8.91151 2.05447 8.91151C1.54014 8.91151 1.01598 8.49375 1.04299 7.87159C1.09953 6.56923 1.25815 5.58378 1.79582 4.77091C2.08701 4.33067 2.44993 3.94594 2.86922 3.63514C3.47914 3.18303 4.18811 2.98191 5.0512 2.8856C5.20142 2.86884 5.3585 2.85506 5.52281 2.84376C5.76288 2.82722 5.88291 2.81896 5.96231 2.89308ZM13.075 8.08378C12.9122 7.75424 12.5895 7.37501 12.0822 7.37501C11.5755 7.37501 11.2521 7.75342 11.0882 8.08221L11.0876 8.08338L10.6782 8.90876L9.9544 9.03001C9.58857 9.09151 9.1514 9.29509 9.00249 9.76526C8.8544 10.2329 9.09124 10.6509 9.3514 10.9133L9.91957 11.4861L9.75849 12.1883C9.67599 12.5478 9.6534 13.1133 10.1042 13.4449C10.5579 13.7788 11.0916 13.5833 11.4082 13.3939L12.0824 12.9914L12.757 13.3941C13.0718 13.5816 13.6069 13.7803 14.0615 13.4461C14.5135 13.1138 14.4882 12.5463 14.4066 12.1888L14.2453 11.4861L14.8119 10.9148L14.8127 10.9139C15.0746 10.6513 15.3124 10.2328 15.163 9.76409C15.0132 9.29451 14.576 9.09142 14.2108 9.03009L13.4839 8.90834L13.0754 8.08455L13.075 8.08378Z"
        fill="#18181B"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.40349 2.90657C5.36868 3.47231 4.66683 4.57086 4.66683 5.83334C4.66683 6.50941 4.8681 7.13847 5.21399 7.66387C3.88877 7.60147 2.8335 6.50732 2.8335 5.16667C2.8335 3.78596 3.95278 2.66667 5.3335 2.66667C5.71636 2.66667 6.07912 2.75274 6.40349 2.90657ZM5.68335 8.66667C3.94042 9.17434 2.66683 10.7837 2.66683 12.6905C2.66683 13.0371 2.73806 13.3671 2.86668 13.6667H2.47636C1.56903 13.6667 0.833496 12.9311 0.833496 12.0238C0.833496 10.1697 2.33654 8.66667 4.19064 8.66667H5.68335ZM8.00016 3.33334C6.61945 3.33334 5.50016 4.45263 5.50016 5.83334C5.50016 7.21407 6.61945 8.33334 8.00016 8.33334C9.3809 8.33334 10.5002 7.21407 10.5002 5.83334C10.5002 4.45263 9.3809 3.33334 8.00016 3.33334ZM6.8573 9.33334C5.00321 9.33334 3.50016 10.8364 3.50016 12.6905C3.50016 13.5978 4.2357 14.3333 5.14302 14.3333H10.8573C11.7646 14.3333 12.5002 13.5978 12.5002 12.6905C12.5002 10.8364 10.9971 9.33334 9.14303 9.33334H6.8573ZM11.3335 5.83334C11.3335 6.50941 11.1322 7.13847 10.7864 7.66387C12.1116 7.60147 13.1668 6.50732 13.1668 5.16667C13.1668 3.78596 12.0476 2.66667 10.6668 2.66667C10.284 2.66667 9.92123 2.75274 9.59683 2.90657C10.6316 3.47231 11.3335 4.57086 11.3335 5.83334ZM13.3335 12.6905C13.3335 13.0371 13.2623 13.3671 13.1336 13.6667H13.524C14.4313 13.6667 15.1668 12.9311 15.1668 12.0238C15.1668 10.1697 13.6638 8.66667 11.8097 8.66667H10.317C12.0599 9.17434 13.3335 10.7837 13.3335 12.6905Z"
        fill="#18181B"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.3335 5.16667C1.3335 4.79848 1.63198 4.5 2.00016 4.5H4.00016C4.36835 4.5 4.66683 4.79848 4.66683 5.16667C4.66683 5.53485 4.36835 5.83333 4.00016 5.83333H2.00016C1.63198 5.83333 1.3335 5.53485 1.3335 5.16667Z"
        fill="#18181B"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.3335 11.8333C1.3335 11.4651 1.63198 11.1667 2.00016 11.1667H6.00016C6.36835 11.1667 6.66683 11.4651 6.66683 11.8333C6.66683 12.2015 6.36835 12.5 6.00016 12.5H2.00016C1.63198 12.5 1.3335 12.2015 1.3335 11.8333Z"
        fill="#18181B"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.3335 11.8333C11.3335 11.4651 11.632 11.1667 12.0002 11.1667H14.0002C14.3684 11.1667 14.6668 11.4651 14.6668 11.8333C14.6668 12.2015 14.3684 12.5 14.0002 12.5H12.0002C11.632 12.5 11.3335 12.2015 11.3335 11.8333Z"
        fill="#18181B"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.3335 5.16667C9.3335 4.79848 9.63196 4.5 10.0002 4.5H14.0002C14.3684 4.5 14.6668 4.79848 14.6668 5.16667C14.6668 5.53486 14.3684 5.83333 14.0002 5.83333H10.0002C9.63196 5.83333 9.3335 5.53485 9.3335 5.16667Z"
        fill="#18181B"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.98317 2.66667H6.01683C6.31314 2.66667 6.5605 2.66667 6.7636 2.68052C6.975 2.69495 7.17467 2.72604 7.36827 2.80623C7.81747 2.9923 8.1744 3.3492 8.36047 3.79842C8.44067 3.99201 8.47173 4.1917 8.48613 4.4031C8.5 4.60617 8.5 4.85353 8.5 5.14983V5.18351C8.5 5.47982 8.5 5.72717 8.48613 5.93025C8.47173 6.14165 8.44067 6.34133 8.36047 6.53493C8.1744 6.98415 7.81747 7.34107 7.36827 7.52714C7.17467 7.60734 6.975 7.63841 6.7636 7.65281C6.5605 7.66667 6.31315 7.66667 6.01684 7.66667H5.98316C5.68685 7.66667 5.4395 7.66667 5.23643 7.65281C5.02503 7.63841 4.82534 7.60734 4.63175 7.52714C4.18253 7.34107 3.82563 6.98415 3.63955 6.53493C3.55937 6.34133 3.52827 6.14165 3.51385 5.93025C3.49999 5.72717 3.49999 5.47981 3.5 5.18351V5.14984C3.49999 4.85353 3.49999 4.60617 3.51385 4.4031C3.52827 4.1917 3.55937 3.99201 3.63955 3.79842C3.82563 3.3492 4.18253 2.9923 4.63175 2.80623C4.82534 2.72604 5.02503 2.69495 5.23643 2.68052C5.4395 2.66667 5.68686 2.66667 5.98317 2.66667Z"
        fill="#18181B"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.98313 9.33333H10.0169C10.3131 9.33333 10.5605 9.33333 10.7636 9.34719C10.975 9.36159 11.1747 9.39266 11.3683 9.47286C11.8175 9.65893 12.1744 10.0159 12.3605 10.4651C12.4407 10.6587 12.4717 10.8583 12.4861 11.0697C12.5 11.2728 12.5 11.5202 12.5 11.8165V11.8502C12.5 12.1465 12.5 12.3939 12.4861 12.5969C12.4717 12.8083 12.4407 13.008 12.3605 13.2016C12.1744 13.6508 11.8175 14.0077 11.3683 14.1938C11.1747 14.274 10.975 14.3051 10.7636 14.3195C10.5605 14.3333 10.3131 14.3333 10.0169 14.3333H9.98313C9.68687 14.3333 9.43947 14.3333 9.2364 14.3195C9.025 14.3051 8.82533 14.274 8.63173 14.1938C8.18253 14.0077 7.8256 13.6508 7.63953 13.2016C7.55933 13.008 7.52827 12.8083 7.51387 12.5969C7.5 12.3939 7.5 12.1465 7.5 11.8502V11.8165C7.5 11.5202 7.5 11.2728 7.51387 11.0697C7.52827 10.8583 7.55933 10.6587 7.63953 10.4651C7.8256 10.0159 8.18253 9.65893 8.63173 9.47286C8.82533 9.39266 9.025 9.36159 9.2364 9.34719C9.43947 9.33333 9.68687 9.33333 9.98313 9.33333Z"
        fill="#18181B"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="5" viewBox="0 0 10 5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 0.500033L5.00002 4.5L9.00002 0.5"
        stroke="#52525C"
        strokeMiterlimit="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.5 3L2 7.5L6.5 12M2.5 7.5H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 8h12M8 2l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
