"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n";
import { PHONE_COUNTRIES, countryLabel, getPhoneCountry, type PhoneCountry } from "@/lib/phone-countries";
import { PhoneGlyph } from "./auth-form-primitives";

type Props = {
  id: string;
  label: string;
  locale: Locale;
  countryIso: string;
  onCountryIsoChange: (iso: string) => void;
  nationalValue: string;
  onNationalChange: (value: string) => void;
  placeholder?: string;
};

export function AuthPhoneField({
  id,
  label,
  locale,
  countryIso,
  onCountryIsoChange,
  nationalValue,
  onNationalChange,
  placeholder = "5XX XXX XX XX",
}: Props) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = getPhoneCountry(countryIso) ?? PHONE_COUNTRIES[0]!;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[15px] font-medium text-[#18181B]">
        {label}
      </label>
      <div className="flex rounded-xl border border-[#D1D5DB] bg-white transition-shadow focus-within:border-[#615FFF]/50 focus-within:ring-2 focus-within:ring-[#615FFF]/20">
        <div ref={containerRef} className="relative h-14 w-[min(32%,7.25rem)] shrink-0 sm:w-28">
          <div className="h-full overflow-hidden rounded-l-xl">
            <button
              type="button"
              id={`${id}-country`}
              aria-label={locale === "en" ? "Country code" : "Ülke kodu"}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => setOpen((v) => !v)}
              className="flex h-full w-full cursor-pointer items-center justify-center gap-1 rounded-l-xl border-0 bg-[#FAFAFA] px-2 text-[14px] font-medium text-[#18181B] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#615FFF]/40 sm:px-3 sm:text-[15px]"
            >
            <span className="shrink-0" aria-hidden>
              {selected.flag}
            </span>
            <span className="tabular-nums">{selected.dial}</span>
            </button>
          </div>
          {open ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute left-0 top-full z-50 mt-1 max-h-60 w-max min-w-full max-w-[min(calc(100vw-2rem),22rem)] overflow-auto rounded-xl border border-[#E4E4E7] bg-white py-1 shadow-lg"
            >
              {PHONE_COUNTRIES.map((c: PhoneCountry) => {
                const isSel = c.iso === countryIso;
                return (
                  <li key={c.iso} role="presentation">
                    <button
                      type="button"
                      id={`${id}-country-opt-${c.iso}`}
                      role="option"
                      aria-selected={isSel}
                      onClick={() => {
                        onCountryIsoChange(c.iso);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] sm:text-[15px] ${
                        isSel ? "bg-[#F4F4F5] font-medium" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <span className="shrink-0" aria-hidden>
                        {c.flag}
                      </span>
                      <span className="min-w-0 flex-1 text-[#18181B]">{countryLabel(c, locale)}</span>
                      <span className="shrink-0 tabular-nums text-[#71717A]">{c.dial}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        <span className="w-px shrink-0 self-stretch bg-[#E4E4E7]" aria-hidden />
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" aria-hidden>
            <PhoneGlyph />
          </span>
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={placeholder}
            value={nationalValue}
            onChange={(e) => onNationalChange(e.target.value.replace(/\D/g, ""))}
            className="h-14 w-full rounded-r-xl border-0 bg-transparent pl-11 pr-3 text-[15px] text-[#18181B] placeholder:text-[#9CA3AF] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
