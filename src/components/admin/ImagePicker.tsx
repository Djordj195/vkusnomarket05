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

const MAX_DIMENSION = 1920;
const QUALITY = 0.82;
const MAX_UPLOAD_MB = 8;

/**
 * Compress/convert image file to JPEG using Canvas.
 * This handles HEIC, large camera photos, and any other format the browser can decode.
 * Falls back to original file if canvas conversion fails.
 */
async function compressImage(file: File): Promise<File> {
  // If the file is already small enough and a web-friendly format, skip compression
  const isWebFriendly =
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp";
  if (isWebFriendly && file.size < 1024 * 1024) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      // Resize if larger than MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // fallback
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // fallback
            return;
          }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" }
          );
          resolve(compressed);
        },
        "image/jpeg",
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original
    };

    img.src = url;
  });
}

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
    setPending(true);
    try {
      // Compress/convert image client-side (handles HEIC, large photos, etc.)
      const processed = await compressImage(file);

      const mb = processed.size / 1024 / 1024;
      if (mb > MAX_UPLOAD_MB) {
        setError(`Файл слишком большой (${mb.toFixed(1)} МБ, макс. ${MAX_UPLOAD_MB} МБ).`);
        return;
      }

      const fd = new FormData();
      fd.set("file", processed);
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
          accept="image/*"
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
