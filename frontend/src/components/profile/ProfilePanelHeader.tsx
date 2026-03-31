"use client";

import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  /** Sağdaki buton(lar); yoksa satır yüksekliği yine aynı kalır */
  actions?: ReactNode;
};

export function ProfilePanelHeader({ title, actions }: Props) {
  return (
    <header className="flex min-h-20 shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-6">
      <h1 className="min-w-0 flex-1 text-lg font-semibold leading-tight text-gray-800">{title}</h1>
      <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
        {actions}
      </div>
    </header>
  );
}
