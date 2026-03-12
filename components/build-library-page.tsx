"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Copy, Import, PencilLine, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SearchableSelectInput } from "@/components/searchable-select-input";
import { useAppData } from "@/hooks/use-app-data";
import { GAME_LABELS, VERSION_LABELS } from "@/lib/rules";
import type { BuildRecord, VersionId } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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

function buildExportFilename(build: BuildRecord) {
  const fallbackName = `${GAME_LABELS[build.game]}-${VERSION_LABELS[build.version]}`;
  const baseName = (build.title.trim() || fallbackName).replace(/[\\/:*?"<>|]/g, "-");
  return `${baseName}-${buildExportTimestamp()}.json`;
}

function isBuildRecord(value: unknown): value is BuildRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BuildRecord>;
  return typeof candidate.id === "string" && typeof candidate.game === "string" && typeof candidate.version === "string";
}

function parseBuildsFromJson(text: string): BuildRecord[] {
  const parsed = JSON.parse(text) as BuildRecord[] | BuildRecord | { builds?: BuildRecord[] | BuildRecord };

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === "object" && "builds" in parsed) {
    if (Array.isArray(parsed.builds)) {
      return parsed.builds;
    }

    if (isBuildRecord(parsed.builds)) {
      return [parsed.builds];
    }
  }

  if (isBuildRecord(parsed)) {
    return [parsed];
  }

  throw new Error("JSON の形式が不正です。");
}

const BUILD_VERSION_FILTER_OPTIONS: Array<{ value: "all" | VersionId; label: string }> = [
  { value: "all", label: "全作品" },
  ...Object.entries(VERSION_LABELS).map(([value, label]) => ({
    value: value as VersionId,
    label,
  })),
];

export function BuildLibraryPage() {
  const { builds, loaded, deleteBuild, duplicateBuild, importBuilds } = useAppData();
  const [query, setQuery] = useState("");
  const [versionFilter, setVersionFilter] = useState<"all" | VersionId>("all");
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return builds.filter((build) => {
      const matchesVersion = versionFilter === "all" || build.version === versionFilter;
      const haystack = [
        build.title,
        build.commonSections.overview,
        build.commonSections.strategyNote,
        ...build.commonSections.tags,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      return matchesVersion && matchesQuery;
    });
  }, [builds, query, versionFilter]);

  return (
    <AppShell>
      <section className="glass-panel relative z-0 overflow-visible focus-within:z-40">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/75">Build Library</p>
            <h2 className="mt-3 text-4xl font-black text-white">構築一覧</h2>
            <p className="mt-2 text-sm text-white/70">検索、複製、削除、JSON の読み込みをここで行います。</p>
          </div>
          <div className="flex flex-wrap gap-3">
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
              const imported = parseBuildsFromJson(text);

              if (imported.length === 0) {
                setStatus("読み込める構築がありませんでした。");
                return;
              }

              const count = importBuilds(imported);
              setStatus(`${count}件の構築を読み込みました。`);
            } catch {
              setStatus("JSON の読み込みに失敗しました。");
            }
          }}
        />

        {status && <p className="mt-4 text-sm text-cyan-200/80">{status}</p>}

        <div className="relative z-0 mt-6 grid gap-4 overflow-visible focus-within:z-40 md:grid-cols-[1fr_220px]">
          <div className="relative z-0 overflow-visible focus-within:z-30">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="構築名、タグ、概要メモで検索"
              className="field-shell"
            />
          </div>
          <div className="relative z-0 overflow-visible focus-within:z-30">
            <SearchableSelectInput
              value={versionFilter}
              onChange={(value) => setVersionFilter(value as "all" | VersionId)}
              options={BUILD_VERSION_FILTER_OPTIONS}
              placeholder="作品を選択"
              displayValue={BUILD_VERSION_FILTER_OPTIONS.find((option) => option.value === versionFilter)?.label ?? ""}
              className="field-shell min-h-[52px] w-full"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {!loaded ? (
          <div className="glass-panel text-sm text-white/70 xl:col-span-2">保存データを読み込み中です。</div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel text-sm text-white/70 xl:col-span-2">一致する構築がありません。</div>
        ) : (
          filtered.map((build) => (
            <article key={build.id} className="glass-panel">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="chip">{GAME_LABELS[build.game]}</span>
                    <span className="chip">{VERSION_LABELS[build.version]}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-white">{build.title || "名称未設定の構築"}</h3>
                  <p className="mt-2 text-sm text-white/65">更新日時: {formatDate(build.updatedAt)}</p>
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-2 md:w-[380px]">
                  <Link
                    href={`/editor?buildId=${build.id}&game=${build.game}&version=${build.version}`}
                    className="secondary-button w-full justify-center"
                  >
                    <PencilLine className="mr-2 size-4" />
                    編集
                  </Link>
                  <button
                    type="button"
                    className="secondary-button w-full justify-center"
                    onClick={() => {
                      duplicateBuild(build.id);
                    }}
                  >
                    <Copy className="mr-2 size-4" />
                    複製
                  </button>
                  <button
                    type="button"
                    className="danger-button w-full"
                    onClick={() => {
                      if (window.confirm("この構築を削除しますか？")) {
                        deleteBuild(build.id);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    削除
                  </button>
                  <button
                    type="button"
                    className="secondary-button w-full justify-center"
                    onClick={() => {
                      downloadTextFile(
                        buildExportFilename(build),
                        JSON.stringify(build, null, 2),
                        "application/json;charset=utf-8",
                      );
                    }}
                  >
                    <Upload className="mr-2 size-4" />
                    書き出し
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr]">
                <div className="glass-panel-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Cards</p>
                  <ul className="mt-3 space-y-2 text-sm text-white/80">
                    {build.commonSections.cards.slice(0, 5).map((card) => (
                      <li key={card.id}>
                        • {card.name} {card.quantity > 1 ? `x${card.quantity}` : ""}
                      </li>
                    ))}
                    {build.commonSections.cards.length === 0 && <li>• カード未登録</li>}
                  </ul>
                </div>
                <div className="glass-panel-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Strategy</p>
                  <p className="mt-3 text-sm leading-7 text-white/80">
                    {build.commonSections.overview || build.commonSections.strategyNote || "概要メモ未入力"}
                  </p>
                </div>
              </div>

              {build.commonSections.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {build.commonSections.tags.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}
