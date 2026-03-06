"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, PencilLine, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/hooks/use-app-data";
import { GAME_LABELS, VERSION_LABELS } from "@/lib/rules";
import { formatDate } from "@/lib/utils";

export function BuildLibraryPage() {
  const { builds, loaded, deleteBuild, duplicateBuild } = useAppData();
  const [query, setQuery] = useState("");
  const [gameFilter, setGameFilter] = useState<"all" | keyof typeof GAME_LABELS>("all");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return builds.filter((build) => {
      const matchesGame = gameFilter === "all" || build.game === gameFilter;
      const haystack = [
        build.title,
        build.commonSections.strategyName,
        build.commonSections.strategyNote,
        ...build.commonSections.tags,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      return matchesGame && matchesQuery;
    });
  }, [builds, gameFilter, query]);

  return (
    <AppShell>
      <section className="glass-panel">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/75">Build Library</p>
            <h2 className="mt-3 text-4xl font-black text-white">構築一覧</h2>
            <p className="mt-2 text-sm text-white/70">検索、複製、削除、版別の絞り込みをここで行います。</p>
          </div>
          <Link href="/editor" className="primary-button">
            新しい構築
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="構築名、タグ、戦法メモで検索"
            className="field-shell"
          />
          <select
            value={gameFilter}
            onChange={(event) => setGameFilter(event.target.value as "all" | keyof typeof GAME_LABELS)}
            className="field-shell"
          >
            <option value="all">全作品</option>
            {Object.entries(GAME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {!loaded ? (
          <div className="glass-panel text-sm text-white/70">保存データを読み込み中です。</div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel text-sm text-white/70">一致する構築がありません。新規構築から作成してください。</div>
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
                <div className="flex flex-wrap gap-2">
                  <Link href={`/editor?buildId=${build.id}&game=${build.game}&version=${build.version}`} className="secondary-button">
                    <PencilLine className="mr-2 size-4" />
                    編集
                  </Link>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      duplicateBuild(build.id);
                    }}
                  >
                    <Copy className="mr-2 size-4" />
                    複製
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      if (window.confirm("この構築を削除しますか？")) {
                        deleteBuild(build.id);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    削除
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
                    {build.commonSections.strategyNote || build.commonSections.overview || "戦法メモ未入力"}
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
