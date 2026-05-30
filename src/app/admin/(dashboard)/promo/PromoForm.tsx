"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  PROMO_CODE_KIND_LABELS,
  type PromoCode,
  type PromoCodeKind,
} from "@/lib/types";
import {
  createPromoAction,
  deletePromoAction,
  updatePromoAction,
} from "@/server/promo/promo-actions";

type Vendor = { id: string; brandName: string };
type Category = { id: string; name: string };

type Props = {
  promo: PromoCode | null;
  vendors: Vendor[];
  categories: Category[];
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateInput(s: string): string | null {
  if (!s.trim()) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function PromoForm({ promo, vendors, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState(promo?.code ?? "");
  const [description, setDescription] = useState(promo?.description ?? "");
  const [kind, setKind] = useState<PromoCodeKind>(promo?.kind ?? "percent");
  const [value, setValue] = useState<string>(
    promo?.value != null ? String(promo.value) : "10"
  );
  const [minSubtotal, setMinSubtotal] = useState<string>(
    promo?.minSubtotal != null ? String(promo.minSubtotal) : "0"
  );
  const [maxDiscount, setMaxDiscount] = useState<string>(
    promo?.maxDiscount != null ? String(promo.maxDiscount) : "0"
  );
  const [validFrom, setValidFrom] = useState<string>(
    toDateInput(promo?.validFrom ?? null)
  );
  const [validUntil, setValidUntil] = useState<string>(
    toDateInput(promo?.validUntil ?? null)
  );
  const [usageLimit, setUsageLimit] = useState<string>(
    promo?.usageLimit != null ? String(promo.usageLimit) : "0"
  );
  const [perUserLimit, setPerUserLimit] = useState<string>(
    promo?.perUserLimit != null ? String(promo.perUserLimit) : "1"
  );
  const [vendorId, setVendorId] = useState<string>(promo?.vendorId ?? "");
  const [categoryId, setCategoryId] = useState<string>(promo?.categoryId ?? "");
  const [active, setActive] = useState<boolean>(promo?.active ?? true);

  const onSubmit = () => {
    setError(null);
    const payload = {
      id: promo?.id,
      code: code.trim().toUpperCase(),
      description: description.trim(),
      kind,
      value: kind === "free_shipping" ? 0 : Number(value) || 0,
      minSubtotal: Number(minSubtotal) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      validFrom: fromDateInput(validFrom),
      validUntil: fromDateInput(validUntil),
      usageLimit: Number(usageLimit) || 0,
      perUserLimit: Number(perUserLimit) || 0,
      vendorId: vendorId || null,
      categoryId: categoryId || null,
      active,
    };
    startTransition(async () => {
      const result = promo
        ? await updatePromoAction(payload)
        : await createPromoAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/promo/${result.promo.id}`);
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!promo) return;
    if (!confirm(`Удалить промокод ${promo.code}? Действие необратимо.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deletePromoAction({ id: promo.id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/promo");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[15px] font-bold text-ink-900">Основное</h2>
        <Input
          label="Код"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="SALE10"
          hint="3–32 символа: A–Z, 0–9, _ и -"
          required
        />
        <Textarea
          label="Описание для клиента"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Скидка 10% на первый заказ"
          rows={2}
        />
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink-700">
            Тип скидки
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PROMO_CODE_KIND_LABELS) as PromoCodeKind[]).map(
              (k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-xl border px-2 py-2 text-[12px] font-semibold transition ${
                    kind === k
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
                  }`}
                >
                  {PROMO_CODE_KIND_LABELS[k]}
                </button>
              )
            )}
          </div>
        </div>
        {kind !== "free_shipping" && (
          <Input
            label={kind === "percent" ? "Процент скидки" : "Сумма скидки (₽)"}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            hint={
              kind === "percent" ? "1–100" : "Сумма в рублях, целое число"
            }
            required
          />
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[15px] font-bold text-ink-900">Условия</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Мин. сумма заказа (₽)"
            value={minSubtotal}
            onChange={(e) =>
              setMinSubtotal(e.target.value.replace(/\D/g, ""))
            }
            inputMode="numeric"
            hint="0 = без минимума"
          />
          {kind !== "free_shipping" && (
            <Input
              label="Макс. скидка (₽)"
              value={maxDiscount}
              onChange={(e) =>
                setMaxDiscount(e.target.value.replace(/\D/g, ""))
              }
              inputMode="numeric"
              hint="0 = без потолка"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Лимит использований"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            hint="0 = без лимита"
          />
          <Input
            label="Лимит на клиента"
            value={perUserLimit}
            onChange={(e) =>
              setPerUserLimit(e.target.value.replace(/\D/g, ""))
            }
            inputMode="numeric"
            hint="по номеру телефона"
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[15px] font-bold text-ink-900">Период действия</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-700">
              С даты
            </span>
            <input
              type="datetime-local"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="block w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-[14px] text-ink-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-700">
              По дату
            </span>
            <input
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="block w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-[14px] text-ink-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[15px] font-bold text-ink-900">
          Привязки (необязательно)
        </h2>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-700">
            Только для продавца
          </span>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="block w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-[14px] text-ink-900"
          >
            <option value="">Все продавцы</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brandName}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-700">
            Только для категории
          </span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="block w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-[14px] text-ink-900"
          >
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4 rounded border-ink-300 text-brand-600"
          />
          <span className="text-[13px] text-ink-700">Промокод активен</span>
        </label>
      </section>

      {error && (
        <div className="rounded-2xl bg-red-50 p-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onSubmit} disabled={pending} fullWidth size="lg">
          {pending ? "Сохраняем…" : promo ? "Сохранить" : "Создать"}
        </Button>
        {promo && (
          <Button
            type="button"
            variant="danger"
            onClick={onDelete}
            disabled={pending}
            aria-label="Удалить промокод"
            size="lg"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
