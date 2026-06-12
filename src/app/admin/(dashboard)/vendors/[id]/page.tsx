import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, KeyRound, Sparkles } from "lucide-react";
import { getVendorById } from "@/server/vendors-store";
import { getCityById } from "@/server/cities-store";
import { getCredentialsByVendorId } from "@/server/vendor-credentials-store";
import {
  VERTICAL_LABELS,
  type VendorStatus,
} from "@/lib/types";
import {
  toggleVendorFeaturedAction,
  updateVendorStatusAction,
} from "@/server/vendor-actions";
import { AdminResetPasswordForm } from "./AdminResetPasswordForm";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<VendorStatus, string> = {
  draft: "Черновик",
  pending: "На модерации",
  approved: "Одобрен",
  suspended: "Приостановлен",
  blocked: "Заблокирован",
};

const STATUS_COLORS: Record<VendorStatus, string> = {
  draft: "bg-ink-100 text-ink-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  suspended: "bg-orange-100 text-orange-800",
  blocked: "bg-red-100 text-red-700",
};

export default async function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getVendorById(id);
  if (!vendor) notFound();
  const city = await getCityById(vendor.cityId);
  const credentials = await getCredentialsByVendorId(vendor.id);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-600 hover:text-brand-700"
        >
          <ChevronLeft size={16} />К списку продавцов
        </Link>
      </div>

      <header className="rounded-3xl bg-white border border-ink-200 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[20px] font-extrabold text-ink-900">
                {vendor.brandName}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[vendor.status]}`}
              >
                {STATUS_LABELS[vendor.status]}
              </span>
              {vendor.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-1.5 py-0.5 text-[10px] font-bold text-accent-600">
                  <Sparkles size={10} /> TOP
                </span>
              )}
            </div>
            <div className="mt-1 text-[13px] text-ink-500">
              {VERTICAL_LABELS[vendor.verticalPrimary]} ·{" "}
              {city?.name ?? vendor.cityId} · /vendor/{vendor.slug}
            </div>
            {vendor.shortDescription && (
              <p className="mt-2 text-[13px] text-ink-700">
                {vendor.shortDescription}
              </p>
            )}
          </div>
          <Link
            href={`/vendor/${vendor.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2 py-1 text-[12px] font-semibold text-ink-700 hover:bg-ink-50"
          >
            Открыть <ExternalLink size={12} />
          </Link>
        </div>
      </header>

      <section className="rounded-2xl bg-white border border-ink-200 p-4">
        <h2 className="text-[14px] font-bold text-ink-800">Модерация</h2>
        <p className="mt-1 text-[12px] text-ink-500">
          Изменение статуса сразу влияет на видимость продавца в приложении.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {vendor.status !== "approved" && (
            <form action={updateVendorStatusAction}>
              <input type="hidden" name="id" value={vendor.id} />
              <input type="hidden" name="status" value="approved" />
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700"
              >
                Одобрить
              </button>
            </form>
          )}
          {vendor.status === "approved" && (
            <form action={updateVendorStatusAction}>
              <input type="hidden" name="id" value={vendor.id} />
              <input type="hidden" name="status" value="suspended" />
              <button
                type="submit"
                className="rounded-lg bg-orange-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-orange-700"
              >
                Приостановить
              </button>
            </form>
          )}
          {vendor.status !== "blocked" && (
            <form action={updateVendorStatusAction}>
              <input type="hidden" name="id" value={vendor.id} />
              <input type="hidden" name="status" value="blocked" />
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-red-700"
              >
                Заблокировать
              </button>
            </form>
          )}
          {vendor.status === "pending" && (
            <form action={updateVendorStatusAction}>
              <input type="hidden" name="id" value={vendor.id} />
              <input type="hidden" name="status" value="draft" />
              <button
                type="submit"
                className="rounded-lg border border-ink-200 px-3 py-2 text-[13px] font-semibold text-ink-700 hover:bg-ink-50"
              >
                Вернуть в черновик
              </button>
            </form>
          )}
          {vendor.status === "approved" && (
            <form action={toggleVendorFeaturedAction}>
              <input type="hidden" name="id" value={vendor.id} />
              <input
                type="hidden"
                name="featured"
                value={vendor.featured ? "false" : "true"}
              />
              <button
                type="submit"
                className="rounded-lg border border-ink-200 px-3 py-2 text-[13px] font-semibold text-ink-700 hover:bg-ink-50"
              >
                {vendor.featured ? "Убрать TOP-бэйдж" : "Поднять в TOP"}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-ink-200 p-4">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-ink-500" />
          <h2 className="text-[14px] font-bold text-ink-800">
            Учётные данные (логин/пароль)
          </h2>
        </div>
        {credentials ? (
          <div className="mt-3 space-y-2">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[13px] text-emerald-800">
              Логин: <strong>{credentials.login}</strong>
              <br />
              <span className="text-[11px] text-emerald-600">
                Создано: {new Date(credentials.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>
            <AdminResetPasswordForm vendorId={vendor.id} />
          </div>
        ) : (
          <div className="mt-3">
            {vendor.status === "approved" ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[13px] text-amber-800">
                Учётные данные ещё не созданы. Продавец может создать их на
                странице{" "}
                <span className="font-mono text-amber-700">/vendor/create-password</span>.
              </div>
            ) : (
              <div className="rounded-xl bg-ink-50 border border-ink-200 p-3 text-[13px] text-ink-600">
                Продавец сможет создать логин и пароль после одобрения заявки.
              </div>
            )}
          </div>
        )}
      </section>

      <DataCard title="Юридическая информация">
        <Field label="Форма" value={vendor.legalEntityType ?? "—"} />
        <Field label="Юр.название" value={vendor.legalName ?? "—"} />
        <Field label="ИНН" value={vendor.inn ?? "—"} />
      </DataCard>

      <DataCard title="Контакты">
        <Field label="Телефон" value={vendor.contacts.phone ?? "—"} />
        <Field label="Email" value={vendor.contacts.email ?? "—"} />
        <Field label="Telegram" value={vendor.contacts.telegram ?? "—"} />
        <Field label="WhatsApp" value={vendor.contacts.whatsapp ?? "—"} />
      </DataCard>

      <DataCard title="Витрина">
        <Field
          label="Дополнительные вертикали"
          value={
            vendor.verticals.length > 1
              ? vendor.verticals
                  .filter((v) => v !== vendor.verticalPrimary)
                  .map((v) => VERTICAL_LABELS[v])
                  .join(", ") || "—"
              : "—"
          }
        />
        <Field
          label="Рейтинг"
          value={`${vendor.ratingAvg.toFixed(1)} (${vendor.ratingCount})`}
        />
        <Field label="Тариф" value={vendor.subscriptionTier} />
        <Field label="Sort order" value={String(vendor.sortOrder)} />
      </DataCard>

      {vendor.description && (
        <section className="rounded-2xl bg-white border border-ink-200 p-4">
          <h3 className="text-[14px] font-bold text-ink-800">Описание</h3>
          <p className="mt-2 whitespace-pre-wrap text-[13px] text-ink-700">
            {vendor.description}
          </p>
        </section>
      )}
    </div>
  );
}

function DataCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white border border-ink-200 p-4">
      <h3 className="text-[14px] font-bold text-ink-800">{title}</h3>
      <dl className="mt-3 divide-y divide-ink-100">{children}</dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-[13px]">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900 text-right break-all">{value}</dd>
    </div>
  );
}
