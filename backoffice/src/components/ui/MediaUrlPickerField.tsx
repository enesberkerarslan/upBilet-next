'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import MediaPickerModal from '@/components/ui/MediaPickerModal';

function looksLikeFetchableUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith('/')) return true;
  return /^https?:\/\//i.test(t);
}

interface MediaUrlPickerFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** URL geçerliyse alanın altında görsel önizlemesi (varsayılan: açık) */
  showPreview?: boolean;
}

export default function MediaUrlPickerField({
  label,
  value,
  onChange,
  placeholder = 'https://...',
  disabled,
  showPreview = true,
}: MediaUrlPickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    setPreviewFailed(false);
  }, [value]);

  const trimmed = value.trim();
  const canPreview = showPreview && looksLikeFetchableUrl(trimmed);

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-2 items-center">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
          >
            Medyadan seç
          </Button>
        </div>
        {canPreview && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-100 overflow-hidden">
            {!previewFailed ? (
              <img
                src={trimmed}
                alt=""
                className="max-h-48 w-full object-contain object-center min-h-16"
                onError={() => setPreviewFailed(true)}
              />
            ) : (
              <p className="text-xs text-amber-700 px-3 py-2.5 bg-amber-50">
                Önizleme yüklenemedi. URL’yi kontrol edin.
              </p>
            )}
          </div>
        )}
      </div>
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setPickerOpen(false);
        }}
      />
    </>
  );
}
