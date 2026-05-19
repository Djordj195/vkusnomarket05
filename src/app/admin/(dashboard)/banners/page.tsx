import { Image as ImageIcon } from "lucide-react";

export default function AdminBannersPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Баннеры и промо
        </h1>
        <p className="text-[12px] text-ink-500">
          Промо-баннеры главной страницы, акции и таргетинг по городам.
        </p>
      </header>

      <section className="rounded-2xl border border-ink-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
          <ImageIcon size={22} />
        </div>
        <h2 className="mt-3 text-[15px] font-extrabold text-ink-900">
          Управление баннерами — в разработке
        </h2>
        <p className="mt-1 text-[12px] text-ink-500">
          Здесь появится редактор баннеров: загрузка изображения, текст, ссылка,
          таргетинг по городу и времени показа.
        </p>
      </section>
    </div>
  );
}
