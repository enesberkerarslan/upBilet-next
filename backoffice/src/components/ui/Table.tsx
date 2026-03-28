import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  keyExtractor: (row: T) => string;
  /** Örn. max-h-[34rem] — dikey taşınca kaydırma; başlık satırı sabit kalır */
  maxHeightClass?: string;
}

export default function Table<T>({
  columns,
  data,
  loading,
  emptyText = 'Kayıt bulunamadı.',
  keyExtractor,
  maxHeightClass,
}: TableProps<T>) {
  const scrollVertical = Boolean(maxHeightClass);

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200',
        scrollVertical ? cn('overflow-auto', maxHeightClass) : 'overflow-x-auto'
      )}
    >
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead
          className={cn(
            'bg-gray-50',
            scrollVertical && 'sticky top-0 z-10 shadow-[0_1px_0_0_rgb(229_231_235)]'
          )}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Yükleniyor...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-gray-700 ${col.className ?? ''}`}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
