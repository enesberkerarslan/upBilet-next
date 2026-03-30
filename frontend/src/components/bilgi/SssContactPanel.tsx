"use client";

import { useState } from "react";

export function SssContactPanel() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const email = "destek@upbilet.com";

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-6 rounded-lg bg-blue-50 p-4 sm:mt-8 sm:p-6">
      <h3 className="mb-2 text-center text-lg font-semibold text-blue-900 sm:text-xl lg:text-left">
        Sorunuz burada yok mu?
      </h3>
      <p className="mb-4 text-center text-sm text-blue-700 sm:text-base lg:text-left">
        Size yardımcı olmak için buradayız. Herhangi bir sorunuz varsa bizimle iletişime geçin.
      </p>
      <div className="flex justify-center lg:justify-start">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 sm:text-base"
        >
          {open ? "Gizle" : "Bize Ulaşın"}
          <svg
            className={`ml-2 h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
          <div className="rounded-lg border-l-4 border-blue-500 bg-white p-3 pl-4 sm:p-4">
            <h4 className="mb-1 text-sm font-semibold text-gray-800 sm:text-base">Email Adresi</h4>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <p className="text-sm font-medium text-gray-600 sm:text-base">{email}</p>
              <button
                type="button"
                onClick={copyEmail}
                title={copied ? "Kopyalandı!" : "Email adresini kopyala"}
                className="rounded-lg p-1 transition-colors hover:bg-gray-100 sm:p-2"
              >
                {copied ? (
                  <svg className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 text-gray-500 group-hover:text-blue-600 sm:h-5 sm:w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">Bu adrese mail atarak bizimle iletişime geçebilirsiniz.</p>
          </div>
          <div className="rounded-lg border-l-4 border-green-500 bg-white p-3 pl-4 sm:p-4">
            <h4 className="mb-1 text-sm font-semibold text-gray-800 sm:text-base">Çalışma Saatleri</h4>
            <p className="text-sm font-medium text-gray-600 sm:text-base">7/24 Destek</p>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">Size en kısa sürede geri dönüş yapacağız.</p>
          </div>
          <div className="rounded-lg border-l-4 border-purple-500 bg-white p-3 pl-4 sm:p-4">
            <h4 className="mb-1 text-sm font-semibold text-gray-800 sm:text-base">Yanıt Süresi</h4>
            <p className="text-sm font-medium text-gray-600 sm:text-base">24 saat içinde</p>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">Sorularınız en geç 24 saat içinde yanıtlanır.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
