"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteVendorAction } from "@/server/vendor-actions";

type Props = {
  vendorId: string;
  brandName: string;
};

export function DeleteVendorButton({ vendorId, brandName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setPending(true);
    const fd = new FormData();
    fd.set("id", vendorId);
    await deleteVendorAction(fd);
    router.push("/admin/vendors");
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-red-700">
          Удалить «{brandName}»?
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          className="rounded-lg bg-red-700 px-3 py-2 text-[13px] font-semibold text-white hover:bg-red-800 disabled:opacity-50"
        >
          {pending ? "Удаляем…" : "Да, удалить"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-[13px] font-semibold text-ink-700 hover:bg-ink-50"
        >
          Отмена
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[13px] font-semibold text-red-700 hover:bg-red-50"
    >
      <Trash2 size={14} />
      Удалить
    </button>
  );
}
