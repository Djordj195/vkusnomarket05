import { getCurrentVendor } from "@/server/vendor-auth";
import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

const FORM_LABELS: Record<string, string> = {
  IP: "ИП",
  OOO: "ООО",
  SAMOZ: "Самозанятый",
  NONE: "Не указано",
};

export default async function VendorRequisitesPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  return (
    <div className="space-y-4">
      <SubpageHeader title="Реквизиты" backHref="/vendor/dashboard/settings" />

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <Row
          label="Юр. форма"
          value={
            vendor.legalEntityType
              ? FORM_LABELS[vendor.legalEntityType] ?? vendor.legalEntityType
              : "Не указано"
          }
        />
        <Row label="Название юр.лица" value={vendor.legalName ?? "—"} />
        <Row label="ИНН" value={vendor.inn ?? "—"} />
        <Row label="Контактный телефон" value={vendor.contacts?.phone ?? "—"} />
        <Row label="Email" value={vendor.contacts?.email ?? "—"} />
      </section>

      <PlaceholderCard
        title="Редактирование реквизитов — в разработке"
        description="Скоро вы сможете обновить юридические данные, банковские реквизиты и подтвердить ИНН напрямую из кабинета. Сейчас изменения проходят через поддержку."
        ctaHref="/support"
        ctaLabel="Связаться с поддержкой"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-100 py-2 last:border-0">
      <div className="text-[12px] text-ink-500">{label}</div>
      <div className="max-w-[60%] text-right text-[13px] font-semibold text-ink-900">
        {value}
      </div>
    </div>
  );
}
