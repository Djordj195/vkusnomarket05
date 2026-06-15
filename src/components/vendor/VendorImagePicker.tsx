"use client";

import { useId, useRef, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { uploadVendorMediaAction } from "@/server/vendor-media-actions";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

const MAX_DIMENSION = 1920;
const QUALITY = 0.82;
const MAX_UPLOAD_MB = 8;

async function compressImage(file: File): Promise<File> {
  const isWebFriendly =
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp";
  if (isWebFriendly && file.size < 1024 * 1024) return file;

  return new Promise<File>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
            })
          );
        },
        "image/jpeg",
        QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export function VendorImagePicker({ value, onChange, label }: Props) {
  const fileInputId = useId();
  const cameraInputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setPending(true);
    try {
      const processed = await compressImage(file);
      const mb = processed.size / 1024 / 1024;
      if (mb > MAX_UPLOAD_MB) {
        setError(`Файл слишком большой (${mb.toFixed(1)} МБ, макс. ${MAX_UPLOAD_MB} МБ).`);
        return;
      }
      const fd = new FormData();
      fd.set("file", processed);
      fd.set("slot", "gallery");
      const res = await uploadVendorMediaAction(fd);
      if (!res.ok) { setError(res.error); return; }
      onChange(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setPending(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

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
            alt="Фото товара"
            className="h-28 w-28 rounded-xl object-cover border border-ink-200"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white shadow"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 text-ink-400">
          <ImageIcon size={28} />
        </div>
      )}

      {pending && (
        <div className="flex items-center gap-2 text-[12px] text-ink-500">
          <Loader2 size={14} className="animate-spin" /> Загрузка…
        </div>
      )}

      {error && (
        <p className="text-[12px] text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <label
          htmlFor={fileInputId}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-[12px] font-semibold text-brand-700 hover:bg-brand-100"
        >
          <Upload size={14} /> Из галереи
        </label>
        <input
          ref={fileRef}
          id={fileInputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <label
          htmlFor={cameraInputId}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-ink-100 px-3 py-2 text-[12px] font-semibold text-ink-700 hover:bg-ink-200"
        >
          <Camera size={14} /> Камера
        </label>
        <input
          ref={cameraRef}
          id={cameraInputId}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
    </div>
  );
}
