"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpenText, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, FolderKanban, LayoutGrid } from "lucide-react";
import { VERSION_LABELS } from "@/lib/rules";
import type { GameId, VersionId } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "はじめに", icon: BookOpenText },
  { href: "/builds", label: "構築一覧", icon: LayoutGrid },
  { href: "/templates", label: "戦法テンプレート", icon: FolderKanban },
];

const sidebarItemBaseClass =
  "flex w-full items-center rounded-2xl border py-3 text-sm font-medium transition-all duration-200";

const sidebarItemIdleClass =
  "border-transparent bg-white/5 text-white/80 hover:border-white/12 hover:bg-white/10 hover:text-white";

const sidebarItemExpandedClass = "border-white/12 bg-white/10 text-white";

const versionDotColors: Record<VersionId, string> = {
  leo: "#E74F1B",
  dragon: "#C8DC54",
  pegasus: "#0A9BD8",
  berserker: "#92A4B8",
  shinobi: "#06963A",
  dinosaur: "#C43B1D",
  "black-ace": "#2DAEDA",
  "red-joker": "#60112C",
};

const gameTree: Array<{
  id: GameId;
  label: string;
  compactLabel: string;
  versions: VersionId[];
  tones: {
    line: string;
    title: string;
    meta: string;
    pill: string;
  };
}> = [
  {
    id: "mmsf1",
    label: "流星のロックマン1",
    compactLabel: "流星1",
    versions: ["leo", "dragon", "pegasus"],
    tones: {
      line: "bg-gradient-to-b from-cyan-200 via-sky-400 to-blue-500 shadow-[0_0_18px_rgba(56,189,248,0.45)]",
      title: "text-cyan-50/92",
      meta: "text-cyan-200/48",
      pill: "border-cyan-300/16 bg-cyan-400/10 text-cyan-50/88",
    },
  },
  {
    id: "mmsf2",
    label: "流星のロックマン2",
    compactLabel: "流星2",
    versions: ["berserker", "shinobi", "dinosaur"],
    tones: {
      line: "bg-gradient-to-b from-emerald-200 via-lime-300 to-green-500 shadow-[0_0_18px_rgba(74,222,128,0.4)]",
      title: "text-emerald-50/92",
      meta: "text-emerald-200/48",
      pill: "border-emerald-300/16 bg-emerald-400/10 text-emerald-50/88",
    },
  },
  {
    id: "mmsf3",
    label: "流星のロックマン3",
    compactLabel: "流星3",
    versions: ["black-ace", "red-joker"],
    tones: {
      line: "bg-gradient-to-b from-orange-200 via-rose-300 to-red-500 shadow-[0_0_18px_rgba(251,113,133,0.45)]",
      title: "text-rose-50/92",
      meta: "text-rose-200/48",
      pill: "border-rose-300/16 bg-rose-400/10 text-rose-50/88",
    },
  },
];

const initialGameSections: Record<GameId, boolean> = {
  mmsf1: true,
  mmsf2: true,
  mmsf3: true,
};

export function SidebarNav() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedGames, setExpandedGames] = useState<Record<GameId, boolean>>(initialGameSections);
  const [activeCollapsedGame, setActiveCollapsedGame] = useState<GameId | null>(null);

  const toggleGameSection = (gameId: GameId) => {
    setExpandedGames((current) => ({
      ...current,
      [gameId]: !current[gameId],
    }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((current) => !current);
    setActiveCollapsedGame(null);
  };

  const toggleCollapsedGame = (gameId: GameId) => {
    setActiveCollapsedGame((current) => (current === gameId ? null : gameId));
  };

  return (
    <aside
      className={cn(
        "relative z-20 border-b border-white/10 bg-[linear-gradient(180deg,rgba(35,12,76,0.44),rgba(14,10,52,0.3))] px-4 py-4 backdrop-blur-xl transition-[width,padding] duration-300 md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r",
        isSidebarOpen ? "md:w-72 md:px-6 md:py-6" : "md:w-24 md:px-4 md:py-6",
      )}
    >
      <div className={cn("flex gap-4", isSidebarOpen ? "items-start justify-between" : "justify-center")}>
        {isSidebarOpen ? (
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-purple-200/75">Perfect Collection</p>
            <h1 className="mt-2 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
              MMSF Battle Organizer
            </h1>
          </div>
        ) : null}

        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/75 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white",
            isSidebarOpen ? "h-11 w-11" : "w-full px-3 py-3",
          )}
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
        >
          {isSidebarOpen ? <ChevronsLeft className="size-4" /> : <ChevronsRight className="size-4" />}
        </button>
      </div>

      <nav className={cn("hidden flex-col gap-2 md:flex", isSidebarOpen ? "mt-6" : "mt-2 items-center")}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isSidebarOpen ? item.label : undefined}
              aria-label={!isSidebarOpen ? item.label : undefined}
              onClick={() => setActiveCollapsedGame(null)}
              className={cn(
                sidebarItemBaseClass,
                isSidebarOpen ? "gap-3 px-4" : "justify-center px-3",
                active
                  ? "border-purple-300/40 bg-gradient-to-r from-purple-500/30 to-cyan-500/25 text-white shadow-[0_0_24px_rgba(168,85,247,0.22)]"
                  : sidebarItemIdleClass,
              )}
            >
              <Icon className="size-4 shrink-0" />
              {isSidebarOpen ? item.label : null}
            </Link>
          );
        })}
      </nav>

      {isSidebarOpen ? (
        <nav className="mt-4 grid grid-cols-2 gap-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-medium text-white/80 transition-all duration-200",
                  active
                    ? "border-purple-300/40 bg-gradient-to-r from-purple-500/30 to-cyan-500/25 text-white shadow-[0_0_24px_rgba(168,85,247,0.22)]"
                    : "border-transparent bg-white/5 hover:border-white/12 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      <div className={cn("hidden md:block", isSidebarOpen ? "mt-2" : "mt-6")}>
        {isSidebarOpen ? (
          <div className="space-y-2">
            {gameTree.map((game) => (
              <div key={game.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => toggleGameSection(game.id)}
                  className={cn(
                    sidebarItemBaseClass,
                    "justify-between gap-3 px-4 text-left",
                    expandedGames[game.id] ? sidebarItemExpandedClass : sidebarItemIdleClass,
                  )}
                  aria-expanded={expandedGames[game.id]}
                  aria-controls={`${game.id}-versions`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={cn("h-5 w-1 shrink-0 rounded-full", game.tones.line)} />
                    <p className="min-w-0 flex-1 whitespace-nowrap text-sm font-medium text-white">
                      {game.label}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center justify-center text-white/55 transition-colors duration-200 hover:text-white">
                    {expandedGames[game.id] ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </span>
                </button>

                {expandedGames[game.id] ? (
                  <div id={`${game.id}-versions`} className="mt-3 space-y-2 pl-8">
                    {game.versions.map((version) => (
                      <div key={version} className="flex items-center gap-3">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: versionDotColors[version],
                            boxShadow: `0 0 12px ${versionDotColors[version]}88`,
                          }}
                        />
                        <Link
                          href={`/editor?game=${game.id}&version=${version}`}
                          className={cn(
                            "inline-flex shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.06em] shadow-[0_0_20px_rgba(255,255,255,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110",
                            game.tones.pill,
                            pathname === "/editor" ? "hover:border-white/24" : "",
                          )}
                        >
                          {VERSION_LABELS[version]}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {gameTree.map((game) => (
              <div key={game.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggleCollapsedGame(game.id)}
                  title={game.label}
                  aria-label={game.label}
                  aria-expanded={activeCollapsedGame === game.id}
                  aria-controls={`${game.id}-collapsed-versions`}
                  className={cn(
                    "flex w-full items-center justify-center whitespace-nowrap rounded-2xl border px-3 py-3 text-[11px] font-semibold tracking-[0.08em] transition-all duration-200",
                    game.tones.pill,
                    activeCollapsedGame === game.id
                      ? "scale-[1.02] border-white/28 shadow-[0_0_24px_rgba(255,255,255,0.12)]"
                      : "hover:border-white/24 hover:brightness-110",
                  )}
                >
                  {game.compactLabel}
                </button>

                {activeCollapsedGame === game.id ? (
                  <div
                    id={`${game.id}-collapsed-versions`}
                    className="absolute left-full top-1/2 z-30 ml-3 w-56 -translate-y-1/2 rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(25,18,72,0.96),rgba(9,8,36,0.94))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("h-6 w-1 shrink-0 rounded-full", game.tones.line)} />
                      <div className="min-w-0 flex-1">
                        <p className={cn("whitespace-nowrap text-sm font-semibold leading-6", game.tones.title)}>{game.label}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {game.versions.map((version) => (
                            <Link
                              key={version}
                              href={`/editor?game=${game.id}&version=${version}`}
                              onClick={() => setActiveCollapsedGame(null)}
                              className={cn(
                                "inline-flex shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.06em] shadow-[0_0_20px_rgba(255,255,255,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110",
                                game.tones.pill,
                                pathname === "/editor" ? "hover:border-white/24" : "",
                              )}
                            >
                              {VERSION_LABELS[version]}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
