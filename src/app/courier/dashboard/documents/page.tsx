import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { CourierDocumentsEditor } from "./CourierDocumentsEditor";

export default function CourierDocumentsPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader
        title="Документы"
        backHref="/courier/dashboard/profile"
      />
      <p className="text-[13px] text-ink-500">
        Загрузите документы для допуска к сменам. Можно сфотографировать прямо
        с камеры или прикрепить из галереи.
      </p>
      <CourierDocumentsEditor />
    </div>
  );
}
