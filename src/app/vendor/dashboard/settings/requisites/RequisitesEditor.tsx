"use client";

import { useState, useTransition } from "react";
import { Save, Loader2 } from "lucide-react";
import { updateVendorContactsAction } from "@/server/vendor-media-actions";

type Props = {
  initial: {
    phone: string;
    email: string;
    telegram: string;
    whatsapp: string;
    legalEntityType: string;
    legalName: string;
    inn: string;
  };
};

const LEGAL_OPTIONS = [
  { value: "NONE", label: "Не указано" },
  { value: "IP", label: "ИП" },
  { value: "OOO", label: "ООО" },
  { value: "SAMOZ", label: "Самозанятый" },
];

export function RequisitesEditor({ initial }: Props) {
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [telegram, setTelegram] = useState(initial.telegram);
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const [legalEntityType, setLegalEntityType] = useState(initial.legalEntityType);
  const [legalName, setLegalName] = useState(initial.legalName);
  const [inn, setInn] = useState(initial.inn);
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
      fd.set("phone", phone);
      fd.set("email", email);
      fd.set("telegram", telegram);
      fd.set("whatsapp", whatsapp);
      fd.set("legalEntityType", legalEntityType);
      fd.set("legalName", legalName);
      fd.set("inn", inn);
      const res = await updateVendorContactsAction(fd);
      if (res.ok) {
        setFeedback({ type: "ok", message: "Реквизиты сохранены." });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feedback && (
        <div
          className={`rounded-xl p-3 text-[13px] ${
            feedback.type === "ok"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <fieldset className="space-y-3 rounded-2xl border border-ink-200 bg-white p-4">
        <legend className="text-[14px] font-bold text-ink-900 px-1">
          Контакты
        </legend>
        <Field
          label="Телефон"
          value={phone}
          onChange={setPhone}
          placeholder="+7 (999) 123-45-67"
          type="tel"
        />
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="shop@example.com"
          type="email"
        />
        <Field
          label="Telegram"
          value={telegram}
          onChange={setTelegram}
          placeholder="@username"
        />
        <Field
          label="WhatsApp"
          value={whatsapp}
          onChange={setWhatsapp}
          placeholder="+7 (999) 123-45-67"
          type="tel"
        />
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border border-ink-200 bg-white p-4">
        <legend className="text-[14px] font-bold text-ink-900 px-1">
          Юридические данные
        </legend>
        <div>
          <label className="block text-[12px] font-semibold text-ink-700 mb-1">
            Юр. форма
          </label>
          <select
            value={legalEntityType}
            onChange={(e) => setLegalEntityType(e.target.value)}
            className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-[14px] text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {LEGAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Название юр.лица"
          value={legalName}
          onChange={setLegalName}
          placeholder='ИП Иванов И.И. или ООО "Рога и копыта"'
        />
        <Field
          label="ИНН"
          value={inn}
          onChange={setInn}
          placeholder="1234567890"
          inputMode="numeric"
        />
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        {pending ? "Сохраняем…" : "Сохранить реквизиты"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-ink-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
}
