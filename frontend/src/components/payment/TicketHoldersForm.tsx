"use client";

import { countries } from "countries-list";
import { useEffect, useRef, useState } from "react";

export type TicketHolderDraft = {
  enterNow: boolean;
  name: string;
  surname: string;
  nationality: string;
  identityNumber: string;
  passoligEmail: string;
  passoligPassword: string;
};

type EventTag = { name?: string; tag?: string };

type Props = {
  quantity: number;
  eventTags?: EventTag[];
  onChange: (holders: TicketHolderDraft[]) => void;
};

const countryOptions = Object.entries(countries).map(([code, info]) => ({
  code,
  name: code === "TR" ? "Türkiye" : info.name,
}));

const softFieldClass =
  "w-full rounded-xl border border-gray-200/70 bg-stone-50/50 px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-indigo-200/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100/70";

function emptyHolder(): TicketHolderDraft {
  return {
    enterNow: true,
    name: "",
    surname: "",
    nationality: "",
    identityNumber: "",
    passoligEmail: "",
    passoligPassword: "",
  };
}

function hasPassoligTag(tags: EventTag[] | undefined): boolean {
  if (!tags?.length) return false;
  return tags.some((t) => {
    const n = (t.name ?? "").toLowerCase();
    return n.includes("passo") || n.includes("passolig");
  });
}

export function TicketHoldersForm({ quantity, eventTags, onChange }: Props) {
  const passo = hasPassoligTag(eventTags);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [tickets, setTickets] = useState<TicketHolderDraft[]>(() =>
    Array.from({ length: Math.max(1, quantity) }, () => emptyHolder())
  );

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setTickets(Array.from({ length: Math.max(1, quantity) }, () => emptyHolder()));
    setActiveIndex(0);
  }, [quantity]);

  useEffect(() => {
    const ticketHolders = tickets.map((ticket) =>
      ticket.enterNow
        ? {
            enterNow: true,
            name: ticket.name,
            surname: ticket.surname,
            nationality: ticket.nationality,
            identityNumber: ticket.identityNumber,
            passoligEmail: ticket.passoligEmail,
            passoligPassword: ticket.passoligPassword,
          }
        : {
            enterNow: false,
            name: "",
            surname: "",
            nationality: "",
            identityNumber: "",
            passoligEmail: "",
            passoligPassword: "",
          }
    );
    onChangeRef.current(ticketHolders);
  }, [tickets]);

  const setIdx = (i: number, patch: Partial<TicketHolderDraft>) => {
    setTickets((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  };

  const idx = activeIndex;
  const ticket = tickets[idx] ?? tickets[0];

  function tabLooksComplete(t: TicketHolderDraft): boolean {
    if (!t.enterNow) return true;
    const core = Boolean(
      t.name?.trim() && t.surname?.trim() && t.nationality?.trim() && t.identityNumber?.trim()
    );
    if (!core) return false;
    if (passo) return Boolean(t.passoligEmail?.trim() && t.passoligPassword?.trim());
    return true;
  }

  return (
    <div className="rounded-2xl bg-white p-5 text-left shadow md:p-6">
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">Katılımcı Bilgileri</h2>
        <p className="mt-1.5 text-sm text-gray-500">Katılımcı numarasına tıklayarak her bilet için bilgi girin</p>
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-2 md:mb-6 md:gap-3">
        {tickets.map((t, i) => {
          const active = i === idx;
          const done = tabLooksComplete(t);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative flex h-11 min-w-[2.75rem] items-center justify-center rounded-xl px-3 text-sm font-semibold transition-all ${
                active
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                  : "border border-gray-200/80 bg-stone-50/50 text-gray-800 hover:border-indigo-200 hover:bg-white"
              } ${!active && done ? "ring-1 ring-emerald-200/80" : ""}`}
            >
              {i + 1}
              {done ? (
                <span
                  className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white ${
                    active ? "bg-emerald-400" : "bg-emerald-500"
                  }`}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-100 pt-5 md:pt-6">
        <div className="mb-4 text-sm">
          <span className="font-semibold text-gray-900">Katılımcı {idx + 1}</span>
          <span className="ml-2 text-xs text-gray-500">
            {passo ? "• Kişisel Bilgiler ve Passolig " : "• Kişisel bilgiler"}
          </span>
        </div>

        <div className="mb-4 flex items-center justify-center rounded-xl bg-gray-100/90 px-4 py-2.5">
          <span className={`mr-2 text-sm ${ticket.enterNow ? "text-gray-400" : "text-gray-700"}`}>
            Bilgileri daha sonra girin
          </span>
          <label className="relative mx-2 flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="sr-only"
              checked={ticket.enterNow}
              onChange={(e) => setIdx(idx, { enterNow: e.target.checked })}
            />
            <div
              className={`relative h-6 w-12 rounded-full transition ${ticket.enterNow ? "bg-indigo-600" : "bg-gray-300"}`}
            >
              <div
                className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  ticket.enterNow ? "translate-x-6" : ""
                }`}
              />
            </div>
          </label>
          <span className={`ml-2 text-sm ${ticket.enterNow ? "text-gray-800" : "text-gray-400"}`}>
            Bilgileri şimdi girin
          </span>
        </div>
        <hr className="my-4 border-gray-200" />

        {ticket.enterNow ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 ml-0.5 block text-left text-xs text-gray-600">Ad </label>
              <input
                type="text"
                value={ticket.name}
                onChange={(e) => setIdx(idx, { name: e.target.value })}
                className={`text-sm ${softFieldClass}`}
              />
            </div>
            <div>
              <label className="mb-1 ml-0.5 block text-left text-xs text-gray-600">Soyad</label>
              <input
                type="text"
                value={ticket.surname}
                onChange={(e) => setIdx(idx, { surname: e.target.value })}
                className={`text-sm ${softFieldClass}`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`country-${idx}`} className="mb-1 ml-0.5 block text-left text-xs font-medium text-gray-700">
                Uyruk
              </label>
              <select
                id={`country-${idx}`}
                value={ticket.nationality}
                onChange={(e) => setIdx(idx, { nationality: e.target.value })}
                className={`mt-1 block h-11 w-full text-xs ${softFieldClass} shadow-sm shadow-gray-200/20`}
              >
                <option value="" disabled>
                  Bir ülke seçin
                </option>
                {countryOptions.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 ml-0.5 block text-left text-xs text-gray-600">TCKN / Pasaport No</label>
              <input
                type="text"
                value={ticket.identityNumber}
                onChange={(e) => setIdx(idx, { identityNumber: e.target.value })}
                className={`text-sm ${softFieldClass}`}
              />
            </div>
            {passo ? (
              <>
                <div className="col-span-full my-1 h-px bg-gray-200" />
                <div>
                  <label className="mb-1 ml-0.5 block text-left text-xs text-gray-600">Passolig E-Posta</label>
                  <input
                    type="email"
                    value={ticket.passoligEmail}
                    onChange={(e) => setIdx(idx, { passoligEmail: e.target.value })}
                    className={`text-sm ${softFieldClass}`}
                  />
                </div>
                <div>
                  <label className="mb-1 ml-0.5 block text-left text-xs text-gray-600">Passolig Şifre</label>
                  <input
                    type="password"
                    value={ticket.passoligPassword}
                    onChange={(e) => setIdx(idx, { passoligPassword: e.target.value })}
                    className={`text-sm ${softFieldClass}`}
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center pl-0.5 text-sm text-gray-500">
            <InfoIcon className="mr-2 shrink-0" />
            <span className="text-xs text-gray-500">Bilgilerinizi daha sonra girmeyi unutmayın.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
      <g clipPath="url(#clip_info)">
        <path
          d="M1.68645 9.59598C1.54468 10.498 2.1785 11.1241 2.95454 11.4361C5.92971 12.6324 10.07 12.6324 13.0451 11.4361C13.8212 11.1241 14.455 10.498 14.3132 9.59598C14.2261 9.04165 13.7953 8.58005 13.4761 8.12931C13.058 7.53165 13.0165 6.87978 13.0164 6.18625C13.0164 3.50605 10.7704 1.33331 7.99984 1.33331C5.22926 1.33331 2.98326 3.50605 2.98326 6.18625C2.98319 6.87978 2.94165 7.53165 2.52358 8.12931C2.2044 8.58005 1.77358 9.04165 1.68645 9.59598Z"
          stroke="#141B34"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 14C6.53075 14.4146 7.23167 14.6667 8 14.6667C8.76833 14.6667 9.46927 14.4146 10 14"
          stroke="#141B34"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip_info">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
