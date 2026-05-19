import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

export default function VendorDocumentsPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader title="Документы" backHref="/vendor/dashboard/settings" />
      <p className="text-[13px] text-ink-500">
        Лицензии, сертификаты, договоры с маркетплейсом. Все документы хранятся
        в зашифрованном хранилище.
      </p>

      <PlaceholderCard
        title="Загрузка документов появится после Phase 3.3"
        description="Готовится универсальный MediaUploader: загрузка с камеры/галереи, drag&drop на вебе, проверка формата и размера, кроп. Применим его для лого, баннеров, лицензий и сертификатов."
      />
    </div>
  );
}
