import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Download,
  Smartphone,
  Monitor,
  ArrowLeft,
  Share2,
  Plus,
  MoreVertical,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Установить приложение",
};

const APPS = [
  {
    name: "ВкусМаркет",
    subtitle: "Покупатель",
    url: "/",
    color: "#6f46ff",
    icon: "/icon-192.png",
  },
  {
    name: "ВМ Продавец",
    subtitle: "Продавец",
    url: "/vendor/login",
    color: "#16a34a",
    icon: "/icon-vendor-192.png",
  },
  {
    name: "ВМ Курьер",
    subtitle: "Курьер",
    url: "/courier/login",
    color: "#ea580c",
    icon: "/icon-courier-192.png",
  },
  {
    name: "ВМ Админ",
    subtitle: "Администратор",
    url: "/admin",
    color: "#dc2626",
    icon: "/icon-admin-192.png",
  },
];

export default function HowToInstallPage() {
  return (
    <div
      className="min-h-screen bg-ink-50"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ink-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[15px] font-bold text-ink-900">
            Установить приложение
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* App cards */}
        <section className="space-y-3">
          <h2 className="text-[14px] font-bold text-ink-700 flex items-center gap-2">
            <Download size={16} />
            Выберите приложение
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {APPS.map((app) => (
              <Link
                key={app.url}
                href={app.url}
                className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <Image
                  src={app.icon}
                  alt={app.name}
                  width={48}
                  height={48}
                  className="rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-ink-900">
                    {app.name}
                  </div>
                  <div
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: app.color }}
                  >
                    {app.subtitle}
                  </div>
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: app.color }}
                >
                  <Download size={14} className="text-white" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* iPhone instructions */}
        <section className="rounded-2xl border border-ink-200 bg-white p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-ink-700 flex items-center gap-2">
            <Smartphone size={16} />
            iPhone / iPad (Safari)
          </h2>
          <ol className="space-y-2 text-[13px] text-ink-700">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                1
              </span>
              <span>
                Откройте нужную ссылку в <strong>Safari</strong> (не Chrome!)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                2
              </span>
              <span className="flex items-center gap-1">
                Нажмите кнопку
                <Share2 size={14} className="inline text-blue-500" />
                «Поделиться» внизу экрана
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                3
              </span>
              <span className="flex items-center gap-1">
                Выберите
                <Plus size={14} className="inline text-ink-500" />
                «На экран Домой»
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                4
              </span>
              <span>
                Нажмите <strong>«Добавить»</strong>
              </span>
            </li>
          </ol>
        </section>

        {/* Android instructions */}
        <section className="rounded-2xl border border-ink-200 bg-white p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-ink-700 flex items-center gap-2">
            <Smartphone size={16} />
            Android (Chrome)
          </h2>
          <ol className="space-y-2 text-[13px] text-ink-700">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                1
              </span>
              <span>
                Откройте нужную ссылку в <strong>Chrome</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                2
              </span>
              <span className="flex items-center gap-1">
                Нажмите
                <MoreVertical size={14} className="inline text-ink-500" />
                (три точки вверху справа)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                3
              </span>
              <span>
                Выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                4
              </span>
              <span>
                Подтвердите — <strong>«Установить»</strong>
              </span>
            </li>
          </ol>
        </section>

        {/* Desktop instructions */}
        <section className="rounded-2xl border border-ink-200 bg-white p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-ink-700 flex items-center gap-2">
            <Monitor size={16} />
            Компьютер (Chrome / Edge)
          </h2>
          <ol className="space-y-2 text-[13px] text-ink-700">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                1
              </span>
              <span>
                Откройте нужную ссылку в <strong>Chrome</strong> или <strong>Edge</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                2
              </span>
              <span>
                В адресной строке нажмите иконку
                <Download size={14} className="inline text-ink-500 mx-1" />
                (установить)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold">
                3
              </span>
              <span>
                Подтвердите — <strong>«Установить»</strong>
              </span>
            </li>
          </ol>
        </section>

        <p className="text-center text-[11px] text-ink-400 pb-6">
          Каждое приложение устанавливается отдельно с уникальной иконкой
        </p>
      </main>
    </div>
  );
}
