/** Shared markup matching legacy Vue header / MobileSearchBar search dropdowns */

export function EventImageFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 text-gray-500">
      <svg className="mb-1 h-4 w-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}

export function EventSearchRowArrow() {
  return (
    <div className="shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

export function SearchNoResultsPanel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center space-x-4 p-4">
      <div className="shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-gray-400 to-gray-500">
          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function SearchLoadingPanel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center space-x-4 p-4">
      <div className="shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-500">
          <svg
            className="h-5 w-5 animate-spin text-white"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}
