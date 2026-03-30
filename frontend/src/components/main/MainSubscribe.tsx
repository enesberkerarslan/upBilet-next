"use client";

import { useState } from "react";
import { getPublicApiBaseBrowser } from "@/lib/env";

const defaultBg =
  "https://d6j5di8d46w7x.cloudfront.net/uploads/1774872895151-subs.webp";

type FooterState =
  | null
  | { variant: "success" }
  | { variant: "duplicate" }
  | { variant: "problem"; text: string };

export function MainSubscribe({ backgroundImageUrl }: { backgroundImageUrl?: string }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [footer, setFooter] = useState<FooterState>(null);
  const bgSrc = backgroundImageUrl?.trim() || defaultBg;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) {
      setFooter({ variant: "problem", text: "Geçerli bir e-posta adresi girin." });
      return;
    }
    setFooter(null);
    setIsLoading(true);
    try {
      const base = getPublicApiBaseBrowser();
      const res = await fetch(`${base}newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "homepage" }),
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        alreadySubscribed?: boolean;
      };
      if (!res.ok || data.success !== true) {
        setFooter({
          variant: "problem",
          text: data.message || "İşlem başarısız. Lütfen tekrar deneyin.",
        });
        return;
      }
      if (data.alreadySubscribed) {
        setFooter({ variant: "duplicate" });
      } else {
        setFooter({ variant: "success" });
      }
    } catch {
      setFooter({ variant: "problem", text: "Bağlantı hatası. Lütfen tekrar deneyin." });
    } finally {
      setIsLoading(false);
    }
  }

  const showFooter = footer != null;

  return (
    <section className="relative min-h-[280px] w-full overflow-hidden rounded-2xl md:h-[280px]">
      <div className="absolute inset-0 min-h-full">
        <img
          src={bgSrc}
          alt=""
          className="h-full min-h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="relative flex min-h-[280px] flex-col items-start px-4 py-6 md:grid md:h-full md:min-h-0 md:grid-cols-2 md:items-center md:gap-x-8 md:gap-y-0 md:px-8 lg:gap-x-12 lg:px-12 md:py-0">
        <div className="mb-4 flex max-w-md flex-col items-start pt-5 text-left md:mb-0 md:max-w-lg md:pr-4 md:pt-0">
          <h2 className="mb-2 text-xl font-bold text-white md:mb-3 md:text-2xl lg:text-3xl">Aramıza katılın</h2>
          <p className="mb-0 max-w-xs text-xs text-white/90 md:max-w-lg md:text-sm lg:text-base">
            E-posta listemize abone olun, size özel indirimler, erken giriş fırsatları ve en popüler etkinliklerin
            bilgilerini ilk siz öğrenin.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="relative flex w-full max-w-sm flex-col gap-1.5 pb-14 sm:max-w-lg md:max-w-none md:justify-self-end lg:max-w-xl"
        >
          <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
            <div className="relative flex-1">
              <div className="relative h-10 w-full">
                <span
                  className={`pointer-events-none absolute left-3 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#71717A] ${isLoading ? "opacity-50" : ""}`}
                  aria-hidden
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="block shrink-0">
                    <path
                      d="M1.66797 5L7.42882 8.26414C9.55264 9.4675 10.45 9.4675 12.5738 8.26414L18.3346 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M1.68111 11.2295C1.73559 13.7842 1.76283 15.0614 2.70544 16.0077C3.64804 16.9538 4.95991 16.9868 7.58366 17.0527C9.20072 17.0933 10.8019 17.0933 12.419 17.0527C15.0427 16.9868 16.3546 16.9538 17.2972 16.0077C18.2398 15.0614 18.2671 13.7842 18.3215 11.2295C18.3391 10.4081 18.3391 9.59159 18.3215 8.77017C18.2671 6.21555 18.2398 4.93825 17.2972 3.99205C16.3546 3.04586 15.0427 3.0129 12.419 2.94698C10.8019 2.90635 9.20072 2.90635 7.58365 2.94697C4.95991 3.01289 3.64804 3.04585 2.70543 3.99205C1.76282 4.93824 1.73559 6.21555 1.6811 8.77017C1.66359 9.59159 1.66359 10.4081 1.68111 11.2295Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFooter(null);
                  }}
                  placeholder="Mail adresiniz"
                  className={`h-10 w-full rounded-[20px] border border-white/20 bg-white pl-11 pr-4 text-[#52525C] placeholder:text-[#52525C] focus:border-white/40 focus:outline-none disabled:opacity-60 ${footer?.variant === "problem" ? "border-red-300" : ""}`}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="group relative h-[40px] shrink-0 overflow-hidden rounded-[20px] bg-linear-to-br from-[#615FFF] to-[#4F46E5] px-7 font-semibold text-white shadow-lg shadow-[#615FFF]/35 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#615FFF]/45 active:translate-y-0 active:scale-[0.98] active:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-90 sm:mt-0"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-linear-to-r from-transparent via-white/30 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100 group-disabled:opacity-0"
              />
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg
                      className="h-5 w-5 shrink-0 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Gönderiliyor</span>
                  </>
                ) : (
                  <>
                    Abone ol
                    <svg
                      className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
          <p
            className={`absolute bottom-0 left-0 right-0 flex items-center gap-2 text-sm font-medium text-white drop-shadow-md transition-opacity duration-300 ease-out ${
              showFooter ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-live="polite"
            aria-hidden={!showFooter}
          >
            {footer?.variant === "success" ? (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            ) : null}
            {footer?.variant === "duplicate" ? (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/30 backdrop-blur-sm">
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
            ) : null}
            {footer?.variant === "problem" ? (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/35 backdrop-blur-sm">
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
                </svg>
              </span>
            ) : null}
            {footer?.variant === "success"
              ? "Başarıyla kaydoldunuz. Teşekkür ederiz!"
              : footer?.variant === "duplicate"
                ? "Bu mail adresi zaten kayıtlı."
                : footer?.variant === "problem"
                  ? footer.text
                  : ""}
          </p>
        </form>
      </div>
    </section>
  );
}
