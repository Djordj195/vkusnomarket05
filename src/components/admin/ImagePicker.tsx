"use client";

import { useId, useRef, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
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
  const fileInputId = useId();
  const cameraInputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    // Client-side validation
    const mb = file.size / 1024 / 1024;
    if (mb > 8) {
      setError("Файл слишком большой (макс. 8 МБ).");
      return;
    }
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка загрузки";
      setError(msg);
    } finally {
      setPending(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
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
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="превью"
            className={`${previewBox} rounded-xl bg-ink-100 object-cover`}
          />
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange("");
            }}
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

      {/* Buttons: Gallery + Camera */}
      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={fileInputId}
          className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-[13px] font-bold text-white transition-colors hover:bg-brand-600 ${
            pending ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          <span>{pending ? "Загружаем..." : "Из галереи"}</span>
        </label>
        <input
          id={fileInputId}
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <label
          htmlFor={cameraInputId}
          className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-ink-50 ${
            pending ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Camera size={16} />
          <span>Камера</span>
        </label>
        <input
          id={cameraInputId}
          ref={cameraRef}
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
        required={required && !value}
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
