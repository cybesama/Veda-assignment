'use client';
import { useRef, useState, useCallback } from 'react';
import clsx from 'clsx';

interface Props {
  value: File | null;
  onChange: (file: File | null) => void;
}

export default function FileUpload({ value, onChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onChange(file);
    },
    [onChange]
  );

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all',
          dragging ? 'border-primary bg-primary/5' : 'border-veda-border bg-white hover:border-gray-400'
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.jpg,.jpeg,.png"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <div className="w-10 h-10 flex items-center justify-center text-veda-muted">
          <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
            <path d="M20 28V12M20 12L14 18M20 12L26 18" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 30h24" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {value ? (
          <div className="text-center">
            <p className="text-sm font-medium text-veda-text">{value.name}</p>
            <p className="text-xs text-veda-muted">{(value.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-veda-text">Choose a file or drag & drop it here</p>
            <p className="text-xs text-veda-muted mt-0.5">JPEG, PNG, PDF, TXT · up to 10MB</p>
          </div>
        )}

        <button
          type="button"
          className="px-5 py-1.5 border border-veda-border rounded-lg text-sm font-medium text-veda-text hover:bg-gray-50 transition-colors"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          Browse Files
        </button>
      </div>

      {value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(null); }}
          className="mt-2 text-xs text-red-500 hover:underline"
        >
          Remove file
        </button>
      )}
      <p className="text-xs text-veda-muted mt-2 text-center">Upload images of your preferred document/image</p>
    </div>
  );
}
