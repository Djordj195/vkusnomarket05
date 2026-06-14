"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  Camera,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

/**
 * Универсальный загрузчик медиа. Поддерживает:
 *  - выбор из галереи (input file)
 *  - съёмку с камеры (input file + capture)
 *  - drag&drop на вебе
 *  - предпросмотр (image или иконка для PDF)
 *  - удаление
 *  - валидация формата и размера на клиенте (бэк проверит повторно)
 *  - автоматическое сжатие/конвертация изображений (HEIC, большие фото)
 *  - повторную загрузку при ошибке
 *
 * Использует server action, передаваемый родителем через проп `upload`.
 * Это позволяет переиспользовать один компонент для:
 *  - продавцов (vendor-media-actions.ts)
 *  - курьеров (courier-media-actions.ts)
 *  - админов (media-actions.ts, после миграции)
 */

const IMG_MAX_DIMENSION = 1920;
const IMG_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  // Skip non-image files (e.g. PDF)
  if (!file.type.startsWith("image/") && file.type !== "") return file;
  // Skip PDFs
  if (file.type === "application/pdf") return file;
  // If the file is already small enough and a web-friendly format, skip
  const isWebFriendly =
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp";
  if (isWebFriendly && file.size < 1024 * 1024) return file;

  return new Promise<File>((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > IMG_MAX_DIMENSION || height > IMG_MAX_DIMENSION) {
        const ratio = Math.min(
          IMG_MAX_DIMENSION / width,
          IMG_MAX_DIMENSION / height
        );
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = window.document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
            })
          );
        },
        "image/jpeg",
        IMG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export type UploadActionResult =
  | { ok: true; url: string; path?: string }
  | { ok: false; error: string };

export type MediaShape = "square" | "wide" | "tall" | "fill";

export type MediaUploaderProps = {
  /** Текущая ссылка на файл. */
  value?: string | null;
  /** Колбэк после успешной загрузки/удаления. */
  onChange: (url: string | null) => void;
  /**
   * Server-action, который принимает FormData (поле `file` + любые
   * предустановленные родителем поля) и возвращает результат загрузки.
   */
  upload: (formData: FormData) => Promise<UploadActionResult>;
  /**
   * Дополнительные поля, которые будут добавлены в FormData перед отправкой
   * (например `{ slot: "logo" }` или `{ folder: "products" }`).
   */
  extraFields?: Record<string, string>;
  /** Подпись над компонентом. */
  label?: string;
  /** Подсказка под кнопками. */
  hint?: string;
  /** Принимаемые MIME (по умолчанию images). */
  accept?: string;
  /** Разрешить также съёмку с камеры (по умолчанию true для image accept). */
  allowCamera?: boolean;
  /** Форма превью. */
  shape?: MediaShape;
  /**
   * Если true — считаем файл документом (показываем иконку PDF, не image).
   * По умолчанию определяется по accept.
   */
  asDocument?: boolean;
  /** Максимальный размер в МБ для клиентской предвалидации. */
  maxSizeMb?: number;
  /** Текст кнопки выбора файла. */
  uploadLabel?: string;
};

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

export function MediaUploader({
  value,
  onChange,
  upload,
  extraFields,
  label,
  hint,
  accept = "image/*",
  allowCamera,
  shape = "square",
  asDocument,
  maxSizeMb = 16,
  uploadLabel,
}: MediaUploaderProps) {
  const fileInputId = useId();
  const cameraInputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const acceptsImages = useMemo(() => accept.includes("image"), [accept]);
  const showCamera = allowCamera ?? acceptsImages;
  const document = asDocument ?? !acceptsImages;

  const shapeClass = (() => {
    switch (shape) {
      case "wide":
        return "aspect-[16/9] w-full";
      case "tall":
        return "aspect-[3/4] w-full";
      case "fill":
        return "h-full w-full";
      case "square":
      default:
        return "h-28 w-28";
    }
  })();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setPending(true);
      try {
        // Compress/convert images client-side (handles HEIC, large phone photos)
        const processed = await compressImage(file);

        const mb = processed.size / 1024 / 1024;
        if (mb > maxSizeMb) {
          setError(`Файл слишком большой (${mb.toFixed(1)} МБ, макс. ${maxSizeMb} МБ).`);
          return;
        }

        const fd = new FormData();
        fd.set("file", processed);
        if (extraFields) {
          for (const [k, v] of Object.entries(extraFields)) {
            fd.set(k, v);
          }
        }
        const res = await upload(fd);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onChange(res.url);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Неизвестная ошибка.";
        setError(message);
      } finally {
        setPending(false);
        if (fileRef.current) fileRef.current.value = "";
        if (cameraRef.current) cameraRef.current.value = "";
      }
    },
    [extraFields, maxSizeMb, onChange, upload]
  );

  // drag & drop
  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);
  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const isImage = value && !document && !isPdfUrl(value);
  const isFileLink = value && (document || isPdfUrl(value));

  return (
    <div className="space-y-2">
      {label && (
        <span className="block text-[12px] font-semibold text-ink-700">
          {label}
        </span>
      )}

      {value ? (
        <div className="relative">
          {isImage && (
            // Используем native img, чтобы не подключать конфиг next/image
            // для пользовательских доменов Supabase Storage.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="превью"
              className={`${shapeClass} rounded-xl border border-ink-200 bg-ink-100 object-cover`}
            />
          )}
          {isFileLink && (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className={`${shapeClass} flex flex-col items-center justify-center gap-2 rounded-xl border border-ink-200 bg-ink-50 p-3 text-center text-[12px] font-semibold text-ink-700 hover:bg-ink-100`}
            >
              <FileText size={28} className="text-brand-500" />
              <span>Открыть документ</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange(null);
            }}
            disabled={pending}
            aria-label="Удалить файл"
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow hover:bg-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`${shapeClass} flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center transition-colors ${
            dragOver
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-ink-300 bg-ink-50 text-ink-400"
          }`}
        >
          {document ? <FileText size={28} /> : <ImageIcon size={28} />}
          <span className="text-[11px] leading-tight">
            {document
              ? "Перетащите файл сюда\nили выберите ниже"
              : "Перетащите фото сюда\nили выберите ниже"}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label
          htmlFor={fileInputId}
          className={`flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 text-[13px] font-bold text-white transition-colors hover:bg-brand-600 ${
            pending ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          <span>
            {pending
              ? "Загружаем..."
              : value
                ? "Заменить файл"
                : (uploadLabel ?? "Выбрать файл")}
          </span>
        </label>
        <input
          id={fileInputId}
          ref={fileRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {showCamera && (
          <>
            <label
              htmlFor={cameraInputId}
              className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-ink-50 ${
                pending ? "pointer-events-none opacity-50" : ""
              }`}
              aria-label="Сделать фото с камеры"
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
          </>
        )}

        {value && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange(null);
            }}
            disabled={pending}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50"
            aria-label="Удалить файл"
          >
            <Trash2 size={16} />
            <span>Удалить</span>
          </button>
        )}
      </div>

      {hint && <p className="text-[11px] text-ink-500">{hint}</p>}

      {error && (
        <div className="rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
