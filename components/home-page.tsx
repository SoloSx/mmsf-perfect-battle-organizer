"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/hooks/use-app-data";
import { GAME_LABELS, VERSION_LABELS } from "@/lib/rules";
import type { GameId, VersionId } from "@/lib/types";
import { cn } from "@/lib/utils";

const HOME_VERSION_GROUPS: Array<{
  game: GameId;
  line: string;
  panel: string;
  versions: VersionId[];
}> = [
  {
    game: "mmsf1",
    line: "bg-gradient-to-b from-sky-300 via-cyan-400 to-blue-500",
    panel: "border-cyan-300/16 bg-[linear-gradient(135deg,rgba(8,47,73,0.32),rgba(14,116,144,0.14),rgba(255,255,255,0.03))]",
    versions: ["pegasus", "leo", "dragon"],
  },
  {
    game: "mmsf2",
    line: "bg-gradient-to-b from-lime-300 via-emerald-400 to-green-600",
    panel: "border-emerald-300/16 bg-[linear-gradient(135deg,rgba(6,78,59,0.32),rgba(22,101,52,0.14),rgba(255,255,255,0.03))]",
    versions: ["berserker", "shinobi", "dinosaur"],
  },
  {
    game: "mmsf3",
    line: "bg-gradient-to-b from-orange-300 via-rose-400 to-red-600",
    panel: "border-rose-300/16 bg-[linear-gradient(135deg,rgba(127,29,29,0.3),rgba(190,24,93,0.12),rgba(255,255,255,0.03))]",
    versions: ["black-ace", "red-joker"],
  },
] as const;

const VERSION_DOT_COLORS: Record<VersionId, string> = {
  leo: "#E74F1B",
  dragon: "#C8DC54",
  pegasus: "#0A9BD8",
  berserker: "#92A4B8",
  shinobi: "#06963A",
  dinosaur: "#C43B1D",
  "black-ace": "#2DAEDA",
  "red-joker": "#60112C",
};

export function HomePage() {
  const { builds, loaded } = useAppData();

  return (
    <AppShell>
      <section className="glass-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-cyan-200/75">Introduction</p>
        <h2 className="mt-3 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
          流星のロックマン
          <br />
          パーフェクトバトルオーガナイザー
        </h2>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-white/80 md:text-base">
          全8バージョンの対戦構築をひとつのUIで管理するためのツールです。バトルカード、アビリティ、ブラザー、ウォーロック装備、
          作品固有仕様をまとめて保存し、最後に構築画像として書き出せます。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/editor" className="primary-button">
            新規構築を作る
          </Link>
          <Link href="/builds" className="secondary-button">
            構築一覧を見る
          </Link>
          <Link href="/builds" className="secondary-button">
            JSONを入出力する
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/75">Versions</p>
          <div className="mt-4 space-y-4">
            {HOME_VERSION_GROUPS.map(({ game, line, panel, versions }) => (
              <div key={game} className={cn("rounded-[28px] border p-4", panel)}>
                <div className="flex items-start gap-4">
                  <div className={cn("mt-1 h-12 w-1 rounded-full", line)} />
                  <div className="min-w-0 flex-1">
                    <div>
                      <p className="text-lg font-semibold text-white">{GAME_LABELS[game]}</p>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {versions.map((version) => (
                        <Link
                          key={version}
                          href={`/editor?game=${game}&version=${version}`}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium whitespace-nowrap text-white/84 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: VERSION_DOT_COLORS[version],
                              boxShadow: `0 0 14px ${VERSION_DOT_COLORS[version]}99`,
                            }}
                          />
                          <span>{VERSION_LABELS[version]}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/75">Workspace</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="glass-panel-soft">
              <p className="text-4xl font-black text-white">{loaded ? builds.length : "--"}</p>
              <p className="mt-2 text-sm text-white/70">保存済み構築</p>
            </div>
            <div className="glass-panel-soft">
              <p className="text-lg font-semibold text-white">JSON バックアップ</p>
              <p className="mt-2 text-sm leading-6 text-white/70">構築一覧からまとめて書き出し・読み込みできます。</p>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
