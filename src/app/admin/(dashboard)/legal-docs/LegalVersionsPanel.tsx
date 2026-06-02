"use client";

import { useEffect, useState } from "react";
import { History, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { LEGAL_DOCS } from "@/data/legal";
import {
  listAllVersionsAction,
  publishVersionAction,
} from "@/server/legal-versions-actions";
import type { LegalVersion } from "@/server/legal-versions-store";

export function LegalVersionsPanel() {
  const [versions, setVersions] = useState<LegalVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [docSlug, setDocSlug] = useState(LEGAL_DOCS[0]?.slug ?? "");
  const [revision, setRevision] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listAllVersionsAction();
      setVersions(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    listAllVersionsAction().then((data) => {
      if (!cancelled) {
        setVersions(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function publish() {
    setError(null);
    setSaving(true);
    try {
      const res = await publishVersionAction({ docSlug, revision, changeSummary });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setShowForm(false);
      setRevision("");
      setChangeSummary("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={16} className="text-ink-500" />
          <h2 className="text-[14px] font-bold text-ink-900">
            История версий
          </h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Закрыть" : "Новая версия"}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-xl bg-ink-50 p-3">
          <div>
            <label className="block text-[12px] font-semibold text-ink-700 mb-1">
              Документ
            </label>
            <select
              value={docSlug}
              onChange={(e) => setDocSlug(e.target.value)}
              className="w-full rounded-xl border border-ink-200 px-3 py-2 text-[13px]"
            >
              {LEGAL_DOCS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.shortTitle} ({d.slug})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Номер версии (например, v2)"
            value={revision}
            onChange={(e) => setRevision(e.target.value)}
            required
          />
          <Textarea
            label="Описание изменений"
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            rows={3}
            required
          />
          {error && (
            <div className="rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
              {error}
            </div>
          )}
          <Button fullWidth onClick={publish} disabled={saving}>
            {saving ? "Публикую..." : "Опубликовать версию"}
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-ink-500 py-4 text-center">Загрузка…</p>
      ) : versions.length === 0 ? (
        <p className="text-[12px] text-ink-500 py-4 text-center">
          Версии ещё не публиковались. Текущие документы — v1 (из кода).
        </p>
      ) : (
        <ul className="space-y-1.5">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2"
            >
              <div>
                <span className="text-[13px] font-semibold text-ink-900">
                  {v.docSlug}
                </span>{" "}
                <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                  {v.revision}
                </span>
                {v.isCurrent && (
                  <span className="ml-1 text-[10px] text-emerald-600 font-semibold">
                    текущая
                  </span>
                )}
                <div className="text-[11px] text-ink-500 mt-0.5">
                  {v.changeSummary}
                </div>
              </div>
              <span className="text-[10px] text-ink-400 shrink-0">
                {new Date(v.publishedAt).toLocaleDateString("ru-RU")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
