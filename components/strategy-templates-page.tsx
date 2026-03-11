"use client";

import { useMemo, useRef, useState } from "react";
import { FileJson, Import, Plus, Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/hooks/use-app-data";
import type { StrategyTemplate } from "@/lib/types";
import { createId } from "@/lib/utils";

const blankTemplate: StrategyTemplate = {
  id: "",
  name: "",
  tags: [],
  notes: "",
  defaultValues: {
    strategyName: "",
    strategyNote: "",
    overview: "",
    tags: [],
  },
  createdAt: "",
  updatedAt: "",
};

function cloneTemplate(template: StrategyTemplate): StrategyTemplate {
  return {
    ...template,
    tags: [...template.tags],
    defaultValues: {
      strategyName: template.defaultValues?.strategyName ?? "",
      strategyNote: template.defaultValues?.strategyNote ?? "",
      overview: template.defaultValues?.overview ?? "",
      tags: [...(template.defaultValues?.tags ?? [])],
    },
  };
}

function buildExportTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  const hours = `${now.getHours()}`.padStart(2, "0");
  const minutes = `${now.getMinutes()}`.padStart(2, "0");
  const seconds = `${now.getSeconds()}`.padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseTemplatesFromJson(text: string): StrategyTemplate[] {
  const parsed = JSON.parse(text) as StrategyTemplate[] | { templates?: StrategyTemplate[] };

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed.templates)) {
    return parsed.templates;
  }

  throw new Error("JSON の形式が不正です。");
}

function normalizeImportedTemplates(templates: StrategyTemplate[]) {
  return templates.map((template) => ({
    id: template.id || createId(),
    name: template.name ?? "",
    tags: template.tags ?? [],
    notes: template.notes ?? "",
    defaultValues: {
      strategyName: template.defaultValues?.strategyName ?? "",
      strategyNote: template.defaultValues?.strategyNote ?? "",
      overview: template.defaultValues?.overview ?? "",
      tags: template.defaultValues?.tags ?? [],
    },
    createdAt: template.createdAt || new Date().toISOString(),
    updatedAt: template.updatedAt || new Date().toISOString(),
  }));
}

export function StrategyTemplatesPage() {
  const { templates, upsertTemplate, importTemplates, deleteTemplate } = useAppData();
  const [selectedId, setSelectedId] = useState<string>("new");
  const [form, setForm] = useState<StrategyTemplate>(blankTemplate);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tagValue = form.tags.join(", ");
  const exportTimestamp = useMemo(() => buildExportTimestamp(), []);

  return (
    <AppShell>
      <section className="glass-panel">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/75">Saved Strategies</p>
            <h2 className="mt-3 text-4xl font-black text-white">保存済み戦法一覧</h2>
            <p className="mt-2 text-sm text-white/70">構築へ流用したい戦法メモやタグを、一覧で保存・編集します。</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const payload = {
                  exportedAt: new Date().toISOString(),
                  templates,
                };
                downloadTextFile(
                  `saved-strategies-${exportTimestamp}.json`,
                  JSON.stringify(payload, null, 2),
                  "application/json;charset=utf-8",
                );
              }}
            >
              <FileJson className="mr-2 size-4" />
              JSON 書き出し
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              <Import className="mr-2 size-4" />
              JSON 読み込み
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) {
              return;
            }

            try {
              const text = await file.text();
              const imported = parseTemplatesFromJson(text);
              const normalizedImported = normalizeImportedTemplates(imported);

              if (normalizedImported.length === 0) {
                setStatus("読み込める保存済み戦法がありませんでした。");
                return;
              }

              const count = importTemplates(normalizedImported);
              setStatus(`${count}件の保存済み戦法を読み込みました。`);
              const nextTemplate = normalizedImported[0] ? cloneTemplate(normalizedImported[0]) : cloneTemplate(blankTemplate);
              setSelectedId(nextTemplate.id || "new");
              setForm(nextTemplate);
            } catch {
              setStatus("JSON の読み込みに失敗しました。");
            }
          }}
        />

        {status && <p className="mt-4 text-sm text-cyan-200/80">{status}</p>}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">保存済み戦法一覧</h3>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setSelectedId("new");
                setForm(cloneTemplate(blankTemplate));
              }}
            >
              <Plus className="mr-2 size-4" />
              新規
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {templates.map((template) => (
              <button
              type="button"
              key={template.id}
              onClick={() => {
                setSelectedId(template.id);
                setForm(cloneTemplate(template));
              }}
              className={`w-full rounded-3xl border px-4 py-4 text-left ${
                selectedId === template.id
                  ? "border-purple-300/40 bg-gradient-to-r from-purple-500/20 to-cyan-500/15"
                    : "border-white/10 bg-white/6"
                }`}
              >
                <p className="text-lg font-semibold text-white">{template.name}</p>
                <p className="mt-1 text-sm text-white/60">{template.notes || "説明未入力"}</p>
                {template.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="text-xl font-semibold text-white">{selectedId === "new" ? "戦法を保存" : "保存済み戦法を編集"}</h3>
          <div className="mt-5 grid gap-4">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="保存する戦法名"
              className="field-shell"
            />
            <input
              value={tagValue}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tags: event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="タグをカンマ区切りで入力"
              className="field-shell"
            />
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="保存済み戦法の説明"
              className="field-shell min-h-32"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.defaultValues.strategyName ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultValues: { ...current.defaultValues, strategyName: event.target.value },
                  }))
                }
                placeholder="戦法名"
                className="field-shell"
              />
              <input
                value={(form.defaultValues.tags ?? []).join(", ")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultValues: {
                      ...current.defaultValues,
                      tags: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                placeholder="初期タグ"
                className="field-shell"
              />
            </div>

            <textarea
              value={form.defaultValues.strategyNote ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  defaultValues: { ...current.defaultValues, strategyNote: event.target.value },
                }))
              }
              placeholder="構築へ適用する戦法メモ"
              className="field-shell min-h-36"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="primary-button"
              onClick={() => {
                if (!form.name.trim()) {
                    window.alert("保存する戦法名を入力してください。");
                    return;
                  }

                  const template = upsertTemplate({
                    ...form,
                    id: form.id || createId(),
                    createdAt: form.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  });
                  setForm(cloneTemplate(template));
                  setSelectedId(template.id);
                  setStatus(selectedId === "new" ? "保存済み戦法を追加しました。" : "保存済み戦法を上書き保存しました。");
                }}
              >
                <Save className="mr-2 size-4" />
                保存
              </button>

              {selectedId !== "new" && (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    if (window.confirm("この保存済み戦法を削除しますか？")) {
                      deleteTemplate(form.id);
                      setSelectedId("new");
                    }
                  }}
                >
                  <Trash2 className="mr-2 size-4" />
                  削除
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
