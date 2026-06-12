"use client";

import { Mail, MessageSquare, Smartphone } from "lucide-react";

type Props = {
  vendorId: string;
  hasEmail: boolean;
  hasPhone: boolean;
};

export function VendorNotificationChannels({ hasEmail, hasPhone }: Props) {
  const channels = [
    {
      icon: <Smartphone size={16} />,
      name: "SMS",
      description: "Новые заказы, отмены",
      status: hasPhone ? "Активно" : "Укажите телефон в реквизитах",
      active: hasPhone,
    },
    {
      icon: <Mail size={16} />,
      name: "Email",
      description: "Финансовые отчёты, акты",
      status: hasEmail ? "Активно" : "Укажите email в реквизитах",
      active: hasEmail,
    },
    {
      icon: <MessageSquare size={16} />,
      name: "Telegram",
      description: "Мгновенные уведомления (скоро)",
      status: "Скоро",
      active: false,
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-[13px] font-bold text-ink-800 px-1">
        Другие каналы
      </h3>
      <ul className="space-y-2">
        {channels.map((c) => (
          <li
            key={c.name}
            className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-3"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-ink-500">{c.icon}</span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-ink-900">
                  {c.name}
                </div>
                <div className="truncate text-[11px] text-ink-500">
                  {c.description}
                </div>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                c.active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-ink-100 text-ink-500"
              }`}
            >
              {c.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
