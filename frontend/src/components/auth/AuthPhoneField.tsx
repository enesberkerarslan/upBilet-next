"use client";

import { PhoneGlyph } from "./auth-form-primitives";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
};

/** Tek kutu telefon (ülke kodu ayrı gösterilmez; kayıtta +90 ile birleştirilir) */
export function AuthPhoneField({ id, label, value, onChange, placeholder = "5XX XXX XX XX" }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[15px] font-medium text-[#18181B]">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" aria-hidden>
          <PhoneGlyph />
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          className="h-14 w-full rounded-xl border border-[#D1D5DB] bg-white pl-11 pr-3 text-[15px] text-[#18181B] placeholder:text-[#9CA3AF] outline-none transition-shadow focus:border-[#615FFF]/50 focus:ring-2 focus:ring-[#615FFF]/20"
        />
      </div>
    </div>
  );
}
