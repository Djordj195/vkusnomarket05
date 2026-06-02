import { listBanners } from "@/server/banners-store";
import { BannerManager } from "./BannerManager";

export default async function AdminBannersPage() {
  const banners = await listBanners();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Баннеры и промо
        </h1>
        <p className="text-[12px] text-ink-500">
          Промо-баннеры главной страницы. Задайте заголовок, цвета, ссылку и
          расписание показа.
        </p>
      </header>

      <BannerManager banners={banners} />
    </div>
  );
}
