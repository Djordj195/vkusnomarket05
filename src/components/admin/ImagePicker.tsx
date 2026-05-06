"use client";

import { useId, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { uploadMediaAction } from "@/server/media-actions";

type Folder = "products" | "categories" | "shops";

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder: Folder;
  required?: boolean;
  label?: string;
  shape?: "square" | "wide";
};

export function ImagePicker({
  value,
  onChange,
  folder,
  required,
  label,
  shape = "square",
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadMediaAction(fd, folder);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onChange(res.url);
    } finally {
      setPending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const previewBox =
    shape === "wide" ? "aspect-[16/9] w-full" : "h-28 w-28";

  return (
    <div className="space-y-2">
      {label && (
        <span className="block text-[12px] font-semibold text-ink-700">
          {label}
        </span>
      )}

      {value ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="превью"
            className={`${previewBox} rounded-xl bg-ink-100 object-cover`}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={pending}
            aria-label="Убрать фото"
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow hover:bg-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          className={`${previewBox} flex items-center justify-center rounded-xl border border-dashed border-ink-300 bg-ink-50 text-ink-400`}
        >
          <ImageIcon size={28} />
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label
          htmlFor={inputId}
          className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 text-[13px] font-bold text-white transition-colors hover:bg-brand-600 ${
            pending ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          <span>{pending ? "Загружаем..." : "Загрузить с телефона"}</span>
        </label>
        <input
          id={inputId}
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="или вставьте ссылку https://..."
        required={required}
        className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      />

      {error && (
        <div className="rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
