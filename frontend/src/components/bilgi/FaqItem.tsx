"use client";

import { useState } from "react";

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 sm:px-6 sm:py-4"
      >
        <h3 className="pr-2 text-base font-semibold text-gray-800 sm:text-lg">{question}</h3>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 sm:h-5 sm:w-5 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? (
        <div
          className="px-4 pb-3 text-sm text-gray-600 sm:px-6 sm:pb-4 sm:text-base"
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      ) : null}
    </div>
  );
}
