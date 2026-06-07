import SmsDiagPanel from "./SmsDiagPanel";

export default function SmsDiagPage() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-[20px] font-bold">Диагностика SMS</h2>
      <p className="text-[13px] text-ink-500">
        Проверка конфигурации SMS-провайдера и тестовая отправка.
      </p>
      <SmsDiagPanel />
    </div>
  );
}
