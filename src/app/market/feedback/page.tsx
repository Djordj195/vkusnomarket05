import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { FeedbackForm } from "./FeedbackForm";

export const metadata: Metadata = {
  title: "Отзывы и предложения",
};

export default function FeedbackPage() {
  return (
    <PageShell className="bg-white">
      <Header variant="page" title="Отзывы и предложения" showBack />
      <div className="px-4 pt-2 pb-6">
        <p className="text-[14px] text-ink-600">
          Расскажите, что понравилось или что хотелось бы улучшить. Мы читаем
          каждое сообщение и отвечаем владельцу лично.
        </p>
        <div className="mt-5">
          <FeedbackForm />
        </div>
      </div>
    </PageShell>
  );
}
