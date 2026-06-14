"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  VERTICAL_LABELS,
  type City,
  type LegalEntityType,
  type Vertical,
} from "@/lib/types";
import { cn, maskPhoneInput } from "@/lib/utils";
import { submitVendorApplicationAction } from "@/server/vendor-actions";

const VERTICALS: Vertical[] = ["food", "grocery", "pharmacy", "chemistry"];

const LEGAL_LABELS: Record<LegalEntityType, string> = {
  IP: "ИП",
  OOO: "ООО",
  SAMOZ: "Самозанятый",
  NONE: "Без юр.лица (пока думаем)",
};

const STEPS = ["О бренде", "Город", "Юр.лицо", "Контакты"] as const;

type FormState = {
  brandName: string;
  verticalPrimary: Vertical | "";
  verticals: Vertical[];
  shortDescription: string;
  description: string;
  cityId: string;
  legalEntityType: LegalEntityType | "";
  legalName: string;
  inn: string;
  legalAddress: string;
  licenseNumber: string;
  contactPhone: string;
  contactEmail: string;
  contactTelegram: string;
  contactWhatsapp: string;
};

const INITIAL: FormState = {
  brandName: "",
  verticalPrimary: "",
  verticals: [],
  shortDescription: "",
  description: "",
  cityId: "",
  legalEntityType: "",
  legalName: "",
  inn: "",
  legalAddress: "",
  licenseNumber: "",
  contactPhone: "",
  contactEmail: "",
  contactTelegram: "",
  contactWhatsapp: "",
};

type Props = {
  cities: City[];
};

export function SignupForm({ cities }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [submittedSlug, setSubmittedSlug] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const toggleVertical = (v: Vertical) => {
    setState((s) => ({
      ...s,
      verticals: s.verticals.includes(v)
        ? s.verticals.filter((x) => x !== v)
        : [...s.verticals, v],
    }));
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (state.brandName.trim().length < 2)
        return "Укажите название бренда (минимум 2 символа).";
      if (!state.verticalPrimary) return "Выберите основную вертикаль.";
    }
    if (step === 1) {
      if (!state.cityId) return "Выберите город.";
    }
    if (step === 2) {
      if (!state.legalEntityType) return "Выберите форму юр.лица.";
      if (state.legalEntityType !== "NONE") {
        if (state.legalName.trim().length < 2)
          return "Укажите юридическое название.";
        const innDigits = state.inn.replace(/\D/g, "");
        if (innDigits.length !== 10 && innDigits.length !== 12)
          return "ИНН должен содержать 10 или 12 цифр.";
      }
      if (state.verticalPrimary === "pharmacy" && state.licenseNumber.trim().length < 3)
        return "Для аптеки нужен номер лицензии Росздравнадзора.";
    }
    if (step === 3) {
      const phoneDigits = state.contactPhone.replace(/\D/g, "");
      if (phoneDigits.length !== 11) return "Введите корректный телефон (+7...).";
    }
    return null;
  };

  const next = () => {
    const e = validateStep();
    if (e) {
      setError(e);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = () => {
    const e = validateStep();
    if (e) {
      setError(e);
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("brandName", state.brandName);
    fd.set("verticalPrimary", state.verticalPrimary);
    state.verticals.forEach((v) => fd.append("verticals", v));
    fd.set("cityId", state.cityId);
    fd.set("shortDescription", state.shortDescription);
    fd.set("description", state.description);
    fd.set("legalEntityType", state.legalEntityType);
    fd.set("legalName", state.legalName);
    fd.set("inn", state.inn);
    fd.set("legalAddress", state.legalAddress);
    fd.set("licenseNumber", state.licenseNumber);
    fd.set("contactPhone", state.contactPhone);
    fd.set("contactEmail", state.contactEmail);
    fd.set("contactTelegram", state.contactTelegram);
    fd.set("contactWhatsapp", state.contactWhatsapp);

    startTransition(async () => {
      const result = await submitVendorApplicationAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmittedSlug(result.slug);
    });
  };

  if (submittedSlug) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-ink-100 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="mt-4 text-[20px] font-extrabold text-ink-900">
          Заявка отправлена!
        </h2>
        <p className="mt-2 text-[14px] text-ink-600">
          Мы проверим документы и свяжемся с вами в течение 1–3 рабочих дней.
          После одобрения вы сможете создать логин и пароль для входа в кабинет
          на странице{" "}
          <span className="font-mono text-brand-700">/vendor/create-password</span>.
        </p>
        <Button
          fullWidth
          size="lg"
          className="mt-6"
          onClick={() => router.push("/vendor/create-password")}
        >
          Создать учётные данные
        </Button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-2 block w-full text-center text-[13px] text-ink-500 hover:text-ink-800"
        >
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Stepper step={step} />

      <div className="rounded-3xl bg-white p-4 shadow-sm border border-ink-100 space-y-4">
        {step === 0 && (
          <div className="space-y-3">
            <Input
              label="Название бренда"
              placeholder="Например: Моя Пекарня"
              value={state.brandName}
              onChange={(e) => update("brandName", e.target.value)}
              maxLength={64}
            />
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-ink-700">
                Основная вертикаль
              </span>
              <div className="grid grid-cols-2 gap-2">
                {VERTICALS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => update("verticalPrimary", v)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left text-[14px] font-semibold transition",
                      state.verticalPrimary === v
                        ? "border-brand-500 bg-brand-50 text-brand-800"
                        : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
                    )}
                  >
                    {VERTICAL_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-ink-700">
                Дополнительные вертикали (необязательно)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {VERTICALS.filter((v) => v !== state.verticalPrimary).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVertical(v)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left text-[13px] transition",
                      state.verticals.includes(v)
                        ? "border-brand-500 bg-brand-50 text-brand-800 font-semibold"
                        : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
                    )}
                  >
                    {state.verticals.includes(v) && <Check size={12} className="inline mr-1" />}
                    {VERTICAL_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Короткое описание (для карточки на главной)"
              placeholder="Свежие продукты с местного рынка и готовые блюда"
              value={state.shortDescription}
              onChange={(e) => update("shortDescription", e.target.value)}
              maxLength={120}
              hint={`${state.shortDescription.length}/120`}
            />
            <Textarea
              label="Полное описание (для витрины)"
              placeholder="Расскажите о себе: что готовите, откуда продукты, какие условия доставки."
              value={state.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              maxLength={600}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-[13px] text-ink-600">
              В каком городе вы работаете? Подбираем заявки в активных городах в
              первую очередь.
            </p>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {cities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => update("cityId", c.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-left transition",
                    state.cityId === c.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-ink-200 bg-white hover:bg-ink-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-semibold text-ink-900">
                        {c.name}
                      </div>
                      <div className="text-[12px] text-ink-500">{c.region}</div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                        c.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-ink-100 text-ink-600"
                      )}
                    >
                      {c.status === "active" ? "активен" : "скоро"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-ink-700">
                Форма юр.лица
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(LEGAL_LABELS) as LegalEntityType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update("legalEntityType", t)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left text-[14px] font-semibold transition",
                      state.legalEntityType === t
                        ? "border-brand-500 bg-brand-50 text-brand-800"
                        : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
                    )}
                  >
                    {LEGAL_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            {state.legalEntityType && state.legalEntityType !== "NONE" && (
              <>
                <Input
                  label="Юридическое название"
                  placeholder='ИП Иванов И.И. / ООО «Свежесть»'
                  value={state.legalName}
                  onChange={(e) => update("legalName", e.target.value)}
                />
                <Input
                  label="ИНН"
                  placeholder="10 или 12 цифр"
                  inputMode="numeric"
                  value={state.inn}
                  onChange={(e) =>
                    update("inn", e.target.value.replace(/\D/g, "").slice(0, 12))
                  }
                />
                <Input
                  label="Юридический адрес"
                  placeholder="Регион, город, улица, дом"
                  value={state.legalAddress}
                  onChange={(e) => update("legalAddress", e.target.value)}
                />
              </>
            )}
            {state.verticalPrimary === "pharmacy" && (
              <Input
                label="Номер лицензии Росздравнадзора"
                placeholder="ЛО-XX-XXXXXX-XXXX"
                value={state.licenseNumber}
                onChange={(e) => update("licenseNumber", e.target.value)}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Input
              label="Контактный телефон"
              placeholder="+7 (___) ___-__-__"
              inputMode="tel"
              value={state.contactPhone}
              onChange={(e) =>
                update("contactPhone", maskPhoneInput(e.target.value))
              }
            />
            <Input
              label="Email (необязательно)"
              placeholder="hello@brand.ru"
              type="email"
              value={state.contactEmail}
              onChange={(e) => update("contactEmail", e.target.value)}
            />
            <Input
              label="Telegram (необязательно)"
              placeholder="@your_brand"
              value={state.contactTelegram}
              onChange={(e) => update("contactTelegram", e.target.value)}
            />
            <Input
              label="WhatsApp (необязательно)"
              placeholder="+7..."
              value={state.contactWhatsapp}
              onChange={(e) => update("contactWhatsapp", e.target.value)}
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={back}
            disabled={pending}
          >
            <ArrowLeft size={16} />
            Назад
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            size="lg"
            fullWidth
            onClick={next}
            disabled={pending}
          >
            Далее
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            fullWidth
            onClick={submit}
            disabled={pending}
          >
            {pending ? "Отправляем..." : "Отправить заявку"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <li key={label} className="flex-1">
          <div
            className={cn(
              "h-1.5 rounded-full transition",
              i <= step ? "bg-brand-500" : "bg-ink-200"
            )}
          />
          <div
            className={cn(
              "mt-1 text-[11px] font-semibold leading-tight text-center",
              i === step ? "text-brand-700" : "text-ink-400"
            )}
          >
            {label}
          </div>
        </li>
      ))}
    </ol>
  );
}
