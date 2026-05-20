import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { VendorDocumentsUploader } from "./VendorDocumentsUploader";

export default function VendorDocumentsPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader title="Документы" backHref="/vendor/dashboard/settings" />
      <p className="text-[13px] text-ink-500">
        Лицензии, сертификаты, договоры с маркетплейсом. Все документы хранятся
        в зашифрованном хранилище.
      </p>

      <VendorDocumentsUploader />
    </div>
  );
}
