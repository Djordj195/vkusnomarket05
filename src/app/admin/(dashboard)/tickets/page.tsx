import Link from "next/link";
import { ClipboardList, AlertTriangle, MessageSquare } from "lucide-react";

export default function AdminTicketsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Тикеты</h1>
        <p className="text-[12px] text-ink-500">
          Обращения клиентов, продавцов и курьеров. Шаблоны ответов, эскалация
          в смежные отделы.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <Tile label="Открытые" value="0" tone="amber" />
        <Tile label="В работе" value="0" tone="brand" />
        <Tile label="Эскалация" value="0" tone="red" />
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
          <ClipboardList size={22} />
        </div>
        <h2 className="mt-3 text-[15px] font-extrabold text-ink-900">
          Тикетная система в разработке
        </h2>
        <p className="mt-1 text-[12px] text-ink-500">
          Здесь появится список обращений с маскированными данными, шаблонами
          ответов и кнопкой эскалации. Сейчас обращения принимаются через{" "}
          <Link
            href="/admin/feedback"
            className="font-semibold text-brand-700 hover:underline"
          >
            «Отзывы и предложения»
          </Link>
          .
        </p>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="mb-2 text-[14px] font-bold text-ink-900">
          Что будет в модуле поддержки
        </h2>
        <ul className="space-y-2 text-[12px] text-ink-700">
          <Li
            icon={<ClipboardList size={16} />}
            text="Список тикетов с фильтрами по статусу и приоритету"
          />
          <Li
            icon={<MessageSquare size={16} />}
            text="Шаблоны ответов и история переписки"
          />
          <Li
            icon={<AlertTriangle size={16} />}
            text="Эскалация в смежные отделы и аудит действий"
          />
        </ul>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "brand" | "amber" | "red";
}) {
  const colors: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className={`rounded-2xl ${colors[tone]} p-3 text-center`}>
      <div className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </div>
      <div className="mt-1 text-[20px] font-extrabold">{value}</div>
    </div>
  );
}

function Li({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-ink-400">{icon}</span>
      <span>{text}</span>
    </li>
  );
}
