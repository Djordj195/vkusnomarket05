"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <WifiOff size={48} className="text-ink-400" />
      <h1 className="text-lg font-bold text-ink-900">Нет подключения</h1>
      <p className="text-[14px] text-ink-600">
        Проверьте интернет-соединение и попробуйте снова.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-xl bg-brand-500 px-5 py-2.5 text-[13px] font-bold text-white"
      >
        Обновить
      </button>
    </div>
  );
}
