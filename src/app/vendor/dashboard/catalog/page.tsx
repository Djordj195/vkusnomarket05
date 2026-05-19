import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

export default function VendorCatalogPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader title="Каталог" />
      <p className="text-[13px] text-ink-500">
        Управление категориями, товарами и блюдами вашего магазина: цены,
        наличие, фотографии, модификаторы и массовое редактирование.
      </p>

      <section className="grid grid-cols-3 gap-3">
        <Tile label="Категории" value="—" />
        <Tile label="Товары" value="—" />
        <Tile label="Скрытые" value="—" />
      </section>

      <PlaceholderCard
        title="Редактор каталога — в разработке"
        description="Здесь появятся: добавление товара, массовая загрузка, модификаторы, состав и аллергены для еды, маркировочные атрибуты для БАД. Аптечные товары — только безрецептурные и БАД."
      />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-3 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="mt-1 text-[20px] font-extrabold text-ink-900">
        {value}
      </div>
    </div>
  );
}
