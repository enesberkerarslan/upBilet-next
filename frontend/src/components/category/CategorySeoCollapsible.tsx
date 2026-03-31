"use client";

import { useLayoutEffect, useRef, useState } from "react";

const COLLAPSED_MAX_PX = 280;

type Props = {
  html: string;
  className?: string;
};

export function CategorySeoCollapsible({ html, className }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    setOverflows(el.scrollHeight > COLLAPSED_MAX_PX + 8);
  }, [html]);

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={innerRef}
          className={
            expanded || !overflows
              ? "seo-content max-w-none space-y-3 text-left text-[12px] font-normal text-[#18181B] [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:opacity-80"
              : "seo-content max-h-[280px] max-w-none space-y-3 overflow-hidden text-left text-[12px] font-normal text-[#18181B] [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:opacity-80"
          }
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {!expanded && overflows ? (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-[#F4F4F5] to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
      {overflows ? (
        <div className="mt-3 flex w-full justify-end">
          <button
            type="button"
            className="text-[13px] font-medium text-[#52525C] underline decoration-[#52525C]/40 underline-offset-2 hover:text-[#18181B] hover:decoration-[#18181B]/40"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "Daha az göster" : "Daha fazlasını göster"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
