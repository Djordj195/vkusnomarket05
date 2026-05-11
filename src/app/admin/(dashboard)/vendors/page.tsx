import Link from "next/link";
import { Sparkles, Store } from "lucide-react";
import { listVendors } from "@/server/vendors-store";
import { listCities } from "@/server/cities-store";
import {
  VERTICAL_LABELS,
  type Vendor,
  type VendorStatus,
} from "@/lib/types";
import { isSupabaseConfigured } from "@/server/supabase";

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

export default async function AdminVendorsPage() {
  const [vendors, cities] = await Promise.all([listVendors(), listCities()]);
  const cityById = new Map(cities.map((c) => [c.id, c]));
  const dbConfigured = isSupabaseConfigured();

  const buckets: Record<VendorStatus, Vendor[]> = {
    pending: [],
    approved: [],
    draft: [],
    suspended: [],
    blocked: [],
  };
  for (const v of vendors) buckets[v.status].push(v);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Продавцы</h1>
        <p className="text-[13px] text-ink-500">
          Заявки на подключение и активные продавцы платформы. Одобренные сразу
          появляются в вертикалях и на витринах.
        </p>
      </header>

      {!dbConfigured && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[13px] text-amber-800">
          Supabase не настроен — отображаются статические данные, изменения не
          сохранятся.
        </div>
      )}

      {(["pending", "approved", "draft", "suspended", "blocked"] as VendorStatus[]).map(
        (status) => {
          const list = buckets[status];
          if (list.length === 0 && status !== "pending") return null;
          return (
            <section key={status} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-ink-800">
                  {STATUS_LABELS[status]} ·{" "}
                  <span className="text-ink-500">{list.length}</span>
                </h2>
              </div>
              {list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-200 p-4 text-[13px] text-ink-500">
                  Заявок в этой группе пока нет.
                </div>
              ) : (
                <ul className="space-y-2">
                  {list.map((v) => {
                    const city = cityById.get(v.cityId);
                    return (
                      <li key={v.id}>
                        <Link
                          href={`/admin/vendors/${v.id}`}
                          className="flex items-center gap-3 rounded-2xl bg-white border border-ink-200 p-3 hover:bg-ink-50 transition"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                            <Store size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[14px] font-bold text-ink-900">
                                {v.brandName}
                              </span>
                              {v.featured && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-1.5 py-0.5 text-[10px] font-bold text-accent-600">
                                  <Sparkles size={10} /> TOP
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 truncate text-[12px] text-ink-500">
                              {VERTICAL_LABELS[v.verticalPrimary]} ·{" "}
                              {city?.name ?? v.cityId}
                              {v.inn ? ` · ИНН ${v.inn}` : ""}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[v.status]}`}
                          >
                            {STATUS_LABELS[v.status]}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        }
      )}
    </div>
  );
}
