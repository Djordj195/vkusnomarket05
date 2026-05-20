import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

export default function CourierDocumentsPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader
        title="Документы"
        backHref="/courier/dashboard/profile"
      />
      <PlaceholderCard
        title="Загрузка документов появится после Phase 3.3"
        description="Готовится универсальный MediaUploader — он позволит сфотографировать паспорт, ИНН и мед.книжку прямо из приложения. Документы проверяются модератором перед допуском к смене."
      />
    </div>
  );
}
