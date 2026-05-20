"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { MediaUploader } from "@/components/media/MediaUploader";
import {
  updateVendorStorefrontAction,
  uploadVendorMediaAction,
} from "@/server/vendor-media-actions";

type Initial = {
  brandName: string;
  shortDescription: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
};

type Props = {
  initial: Initial;
};

export function StorefrontEditor({ initial }: Props) {
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [bannerUrl, setBannerUrl] = useState(initial.bannerUrl);
  const [brandName, setBrandName] = useState(initial.brandName);
  const [shortDescription, setShortDescription] = useState(
    initial.shortDescription
  );
  const [description, setDescription] = useState(initial.description);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    message: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("logoUrl", logoUrl);
      fd.set("bannerUrl", bannerUrl);
      fd.set("brandName", brandName);
      fd.set("shortDescription", shortDescription);
      fd.set("description", description);
      const res = await updateVendorStorefrontAction(fd);
      if (res.ok) {
        setFeedback({ type: "ok", message: "Витрина сохранена." });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[14px] font-bold text-ink-900">Логотип и баннер</h2>
        <p className="mt-1 text-[12px] text-ink-500">
          Логотип отображается в карточке магазина и шапке. Баннер — на странице
          магазина. Поддерживаются JPEG / PNG / WEBP.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <MediaUploader
            label="Логотип"
            shape="square"
            value={logoUrl}
            onChange={(url) => setLogoUrl(url ?? "")}
            upload={uploadVendorMediaAction}
            extraFields={{ slot: "logo" }}
            maxSizeMb={4}
            hint="Квадратное изображение, минимум 256×256."
          />
          <MediaUploader
            label="Баннер"
            shape="wide"
            value={bannerUrl}
            onChange={(url) => setBannerUrl(url ?? "")}
            upload={uploadVendorMediaAction}
            extraFields={{ slot: "banner" }}
            maxSizeMb={8}
            hint="Широкое изображение 16:9, минимум 1200×675."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[14px] font-bold text-ink-900">Описание</h2>
        <p className="mt-1 text-[12px] text-ink-500">
          Расскажите о магазине — клиенты увидят это в каталоге и на странице
          магазина.
        </p>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="block text-[12px] font-semibold text-ink-700">
              Название бренда
            </span>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-[14px] text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              maxLength={64}
              required
            />
          </label>
          <label className="block">
            <span className="block text-[12px] font-semibold text-ink-700">
              Короткое описание
            </span>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Одна строка для карточки в каталоге"
              className="mt-1 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              maxLength={160}
            />
            <span className="mt-1 block text-[11px] text-ink-400">
              {shortDescription.length}/160
            </span>
          </label>
          <label className="block">
            <span className="block text-[12px] font-semibold text-ink-700">
              Полное описание
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Подробно о магазине, акциях, доставке"
              className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              maxLength={4000}
            />
            <span className="mt-1 block text-[11px] text-ink-400">
              {description.length}/4000
            </span>
          </label>
        </div>
      </section>

      {feedback && (
        <div
          className={`rounded-xl p-3 text-[13px] ${
            feedback.type === "ok"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-[14px] font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        <span>{pending ? "Сохраняем..." : "Сохранить витрину"}</span>
      </button>
    </form>
  );
}
