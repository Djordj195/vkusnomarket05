"use client";

import { useState } from "react";
import { MediaUploader } from "@/components/media/MediaUploader";
import { uploadCourierMediaAction } from "@/server/courier-media-actions";

type Slot = {
  id:
    | "avatar"
    | "passport"
    | "id_card"
    | "med_book"
    | "driver_license"
    | "self_employed_cert";
  title: string;
  hint: string;
  asDocument?: boolean;
  shape?: "square" | "wide" | "tall";
  required?: boolean;
};

const SLOTS: Slot[] = [
  {
    id: "avatar",
    title: "Фото для профиля",
    hint: "Это фото увидит клиент в трекере доставки. Только лицо, без головных уборов.",
    shape: "square",
    required: true,
  },
  {
    id: "passport",
    title: "Паспорт (разворот с фото)",
    hint: "Фото или PDF. Хранится в защищённом хранилище и доступно только модератору.",
    asDocument: true,
    shape: "wide",
    required: true,
  },
  {
    id: "id_card",
    title: "ИНН или СНИЛС",
    hint: "Один из документов — на ваш выбор.",
    asDocument: true,
    shape: "wide",
  },
  {
    id: "med_book",
    title: "Медицинская книжка",
    hint: "Обязательна для доставки готовой еды и аптек.",
    asDocument: true,
    shape: "wide",
  },
  {
    id: "driver_license",
    title: "Водительское удостоверение",
    hint: "Если вы доставляете на авто или мото.",
    asDocument: true,
    shape: "wide",
  },
  {
    id: "self_employed_cert",
    title: "Справка самозанятого",
    hint: "Скриншот из приложения «Мой налог» или PDF.",
    asDocument: true,
    shape: "wide",
  },
];

export function CourierDocumentsEditor() {
  // Локально храним последние загруженные ссылки, чтобы курьер видел статус
  // прямо в UI. Реальная привязка к таблице couriers появится в Phase 5
  // (модерация курьеров + публикация на смену).
  const [values, setValues] = useState<Record<string, string | null>>({});

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
        Документы хранятся в защищённом хранилище ВкусМаркета. Они доступны
        только модератору при проверке. Загрузка одного документа не активирует
        смены автоматически — сначала проверит модерация.
      </div>

      {SLOTS.map((slot) => (
        <section
          key={slot.id}
          className="rounded-2xl border border-ink-200 bg-white p-4"
        >
          <h2 className="text-[14px] font-bold text-ink-900">
            {slot.title}
            {slot.required && (
              <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                обязательно
              </span>
            )}
          </h2>
          <p className="mt-1 text-[12px] text-ink-500">{slot.hint}</p>
          <div className="mt-3">
            <MediaUploader
              value={values[slot.id]}
              onChange={(url) =>
                setValues((s) => ({ ...s, [slot.id]: url }))
              }
              upload={uploadCourierMediaAction}
              extraFields={{ slot: slot.id }}
              shape={slot.shape ?? "wide"}
              asDocument={slot.asDocument}
              accept={
                slot.asDocument
                  ? "image/jpeg,image/png,image/webp,application/pdf"
                  : "image/*"
              }
              maxSizeMb={16}
              uploadLabel="Загрузить"
            />
          </div>
        </section>
      ))}
    </div>
  );
}
