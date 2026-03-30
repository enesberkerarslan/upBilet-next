"use client";

import { useLocale } from "@/contexts/locale-context";
import { locales, type Locale } from "@/i18n";
import { switchLocaleInPath } from "@/lib/locale-path";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NATIVE_LABEL: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
};

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const qs = searchParams.toString();
  const withQuery = (path: string) => (qs ? `${path}?${qs}` : path);

  function select(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    router.push(withQuery(switchLocaleInPath(pathname, next)));
    router.refresh();
  }

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl border border-[#E4E4E7] bg-white px-3 py-2 text-sm font-medium text-[#18181B] transition hover:bg-gray-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{NATIVE_LABEL[locale]}</span>
        <svg
          className={`h-4 w-4 text-[#71717B] transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-60 mt-1 min-w-[140px] rounded-xl border border-[#E4E4E7] bg-white py-1 shadow-lg"
        >
          {locales.map((code) => (
            <li key={code} role="option" aria-selected={code === locale}>
              <button
                type="button"
                onClick={() => select(code)}
                className={`flex w-full px-4 py-2.5 text-left text-sm ${
                  code === locale ? "bg-[#615FFF]/10 font-semibold text-[#615FFF]" : "text-[#3F3F46] hover:bg-gray-50"
                }`}
              >
                {NATIVE_LABEL[code]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
