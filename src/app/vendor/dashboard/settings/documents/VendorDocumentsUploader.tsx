"use client";

import { useState } from "react";
import { MediaUploader } from "@/components/media/MediaUploader";
import { uploadVendorMediaAction } from "@/server/vendor-media-actions";

const SLOTS: Array<{ key: string; title: string; hint: string; required?: boolean }> = [
  {
    key: "ogrn",
    title: "Свидетельство ОГРН / ОГРНИП",
    hint: "Скан или фото. Для ИП — лист записи ЕГРИП.",
    required: true,
  },
  {
    key: "inn",
    title: "Свидетельство ИНН",
    hint: "Скан или фото свидетельства из ФНС.",
    required: true,
  },
  {
    key: "license",
    title: "Лицензия",
    hint: "Для аптеки — лицензия Росздравнадзора. Для общепита — СЭЗ.",
  },
  {
    key: "contract",
    title: "Договор с ВкусМаркетом",
    hint: "Подписанный скан агентского договора.",
  },
];

export function VendorDocumentsUploader() {
  const [values, setValues] = useState<Record<string, string | null>>({});

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
        Документы хранятся в защищённом хранилище и доступны только модератору
        ВкусМаркета. Загруженный документ не публикуется в магазине.
      </div>

      {SLOTS.map((s) => (
        <section
          key={s.key}
          className="rounded-2xl border border-ink-200 bg-white p-4"
        >
          <h2 className="text-[14px] font-bold text-ink-900">
            {s.title}
            {s.required && (
              <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                обязательно
              </span>
            )}
          </h2>
          <p className="mt-1 text-[12px] text-ink-500">{s.hint}</p>
          <div className="mt-3">
            <MediaUploader
              value={values[s.key]}
              onChange={(url) =>
                setValues((prev) => ({ ...prev, [s.key]: url }))
              }
              upload={uploadVendorMediaAction}
              extraFields={{ slot: "document" }}
              shape="wide"
              asDocument
              accept="image/jpeg,image/png,image/webp,application/pdf"
              maxSizeMb={16}
              uploadLabel="Загрузить"
            />
          </div>
        </section>
      ))}
    </div>
  );
}
