"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminResetVendorPasswordAction } from "@/server/vendor-credentials-actions";

export function AdminResetPasswordForm({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-ink-200 px-3 py-2 text-[13px] font-semibold text-ink-700 hover:bg-ink-50"
      >
        Сбросить пароль
      </button>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData();
    fd.set("vendorId", vendorId);
    fd.set("newPassword", newPassword);
    startTransition(async () => {
      const res = await adminResetVendorPasswordAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      setNewPassword("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2">
      <Input
        label="Новый пароль"
        placeholder="Мин. 6 символов"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={error ?? undefined}
      />
      {success && (
        <p className="text-[12px] text-emerald-700 font-semibold">
          Пароль успешно обновлён.
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={pending}>
          {pending ? "Сохраняем..." : "Сохранить новый пароль"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
            setSuccess(false);
          }}
          className="px-3 py-1.5 text-[13px] text-ink-500 hover:text-ink-800"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
