'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import MediaPickerModal from '@/components/ui/MediaPickerModal';

interface MediaUrlPickerFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function MediaUrlPickerField({
  label,
  value,
  onChange,
  placeholder = 'https://...',
  disabled,
}: MediaUrlPickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

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
