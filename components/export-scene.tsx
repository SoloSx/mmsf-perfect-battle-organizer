"use client";

import { forwardRef } from "react";
import { findCardAssetByName } from "@/lib/assets";
import { evaluateNoiseHand } from "@/lib/mmsf3-noise-hand";
import { MASTER_DATA } from "@/lib/seed-data";
import { GAME_LABELS, getVersionRuleSet, VERSION_LABELS } from "@/lib/rules";
import type { BuildRecord } from "@/lib/types";

const BATTLE_CARD_FRAME_CLASS =
  "relative aspect-[4/3] overflow-hidden bg-white/8";
const EXPORT_CARD_TILE_LIMIT = 30;
const EXPORT_CARD_GRID_COLUMNS = 10;

function getSpecialNotes(build: BuildRecord) {
  switch (build.game) {
    case "mmsf1":
      return [
        build.gameSpecificSections.mmsf1.versionFeature,
        build.gameSpecificSections.mmsf1.crossBrotherNotes,
        build.gameSpecificSections.mmsf1.notes,
      ].filter(Boolean);
    case "mmsf2":
      return [
        build.gameSpecificSections.mmsf2.tribeNotes,
        build.gameSpecificSections.mmsf2.bestCombo,
        build.gameSpecificSections.mmsf2.notes,
      ].filter(Boolean);
    case "mmsf3":
      return [
        build.gameSpecificSections.mmsf3.mergeNoiseTarget,
        build.gameSpecificSections.mmsf3.rouletteNotes,
        build.gameSpecificSections.mmsf3.notes,
      ].filter(Boolean);
  }
}

function getExportBackground(build: BuildRecord) {
  if (build.game === "mmsf2") {
    if (build.version === "shinobi") {
      return [
        "radial-gradient(circle at 18% 18%, rgba(22,163,74,0.24), transparent 24%)",
        "radial-gradient(circle at 58% 30%, rgba(190,242,100,0.16), transparent 18%)",
        "radial-gradient(circle at 72% 58%, rgba(34,197,94,0.22), transparent 24%)",
        "radial-gradient(circle at 84% 76%, rgba(21,128,61,0.28), transparent 24%)",
        "linear-gradient(118deg, rgba(2,15,10,0.98) 0%, rgba(7,34,24,0.96) 30%, rgba(16,82,62,0.76) 58%, rgba(8,27,20,0.96) 100%)",
      ].join(", ");
    }

    const tribeGlow =
      build.version === "dinosaur"
          ? "radial-gradient(circle at 84% 76%, rgba(249,115,22,0.28), transparent 24%)"
          : "radial-gradient(circle at 84% 76%, rgba(250,204,21,0.22), transparent 24%)";

    return [
      "radial-gradient(circle at 18% 18%, rgba(129,140,248,0.18), transparent 24%)",
      "radial-gradient(circle at 60% 32%, rgba(255,204,102,0.18), transparent 18%)",
      "radial-gradient(circle at 72% 58%, rgba(34,211,238,0.18), transparent 24%)",
      tribeGlow,
      "linear-gradient(118deg, rgba(1,6,23,0.98) 0%, rgba(7,18,70,0.96) 30%, rgba(13,84,116,0.76) 58%, rgba(11,18,58,0.96) 100%)",
    ].join(", ");
  }

  return "radial-gradient(circle at top left, rgba(255,255,255,0.16), transparent 34%), linear-gradient(120deg, rgba(127,29,29,0.92), rgba(91,33,182,0.72), rgba(15,23,42,0.96))";
}

function getExportAccentBackground(build: BuildRecord, rule: ReturnType<typeof getVersionRuleSet>) {
  if (build.game !== "mmsf2") {
    return `linear-gradient(135deg, ${rule.accent.from}, ${rule.accent.to})`;
  }

  switch (build.version) {
    case "berserker":
      return "linear-gradient(135deg, #ffe08a 0%, #ffb347 48%, #f97316 100%)";
    case "shinobi":
      return "linear-gradient(135deg, #d9f99d 0%, #86efac 34%, #22c55e 72%, #14532d 100%)";
    case "dinosaur":
      return "linear-gradient(135deg, #fde68a 0%, #fb923c 44%, #ef4444 100%)";
    default:
      return `linear-gradient(135deg, ${rule.accent.from}, ${rule.accent.to})`;
  }
}

function getMmsf3SystemSnapshotLines(build: BuildRecord) {
  const evaluation = evaluateNoiseHand(build.gameSpecificSections.mmsf3.noiseCardIds);
  const selectedCount = build.gameSpecificSections.mmsf3.noiseCardIds.filter(Boolean).length;
  const lines = [build.gameSpecificSections.mmsf3.noise || build.gameSpecificSections.mmsf3.nfb || "ノイズ情報未設定"];

  if (evaluation.errors.length > 0) {
    return [...lines, ...evaluation.errors];
  }

  if (selectedCount < 5) {
    lines.push(`ノイズドカード ${selectedCount}/5`);
  } else if (evaluation.bestHand) {
    lines.push(`ノイズハンド: ${evaluation.bestHand.label}`);
    lines.push(...evaluation.bestHand.bonusEffect.split("\n").map((effect) => `効果: ${effect}`));
  } else {
    lines.push("ノイズハンド: 役なし");
  }

  for (const card of evaluation.selectedCards) {
    lines.push(`${card.label} / ${card.cardEffect}`);
  }

  return lines;
}

export const ExportScene = forwardRef<HTMLDivElement, { build: BuildRecord }>(({ build }, ref) => {
  const rule = getVersionRuleSet(build.version);
  const cardTiles = build.commonSections.cards.reduce<Array<{ name: string; isRegular: boolean }>>((tiles, entry) => {
    if (tiles.length >= EXPORT_CARD_TILE_LIMIT) {
      return tiles;
    }

    const name = entry.name.trim();
    const quantity = Number.isFinite(entry.quantity) ? Math.max(0, Math.trunc(entry.quantity)) : 0;
    const copiesToAdd = Math.min(quantity, EXPORT_CARD_TILE_LIMIT - tiles.length);

    if (!name || copiesToAdd === 0) {
      return tiles;
    }

    for (let index = 0; index < copiesToAdd; index += 1) {
      tiles.push({ name, isRegular: entry.isRegular && index === 0 });
    }

    return tiles;
  }, []);
  const abilities = build.commonSections.abilities.map((entry) => entry.name).filter(Boolean).slice(0, 8);
  const brothers = build.commonSections.brothers.map((entry) => entry.name).filter(Boolean).slice(0, 6);
  const notes = [...MASTER_DATA.versionHighlights[build.version], ...getSpecialNotes(build)].slice(0, 6);
  const mmsf3SystemSnapshotLines = build.game === "mmsf3" ? getMmsf3SystemSnapshotLines(build) : [];

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-[36px] border border-white/12 text-white"
      style={{
        width: "1200px",
        minHeight: "675px",
        background: getExportBackground(build),
      }}
    >
      <div className="grid min-h-[675px] grid-cols-[320px_1fr] gap-6 p-10">
        <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-black/25 p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <div
            className="absolute inset-x-0 top-0 h-48 opacity-70"
            style={{
              background: getExportAccentBackground(build, rule),
              clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)",
            }}
          />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">{GAME_LABELS[build.game]}</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">{VERSION_LABELS[build.version]}</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                {build.title || "名称未設定の構築"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">Strategy</p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {build.commonSections.overview || build.commonSections.strategyNote || "概要メモはまだ入力されていません。"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {build.commonSections.tags.length > 0 ? (
                  build.commonSections.tags.slice(0, 6).map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="chip">戦法タグ未設定</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <section className="rounded-[30px] border border-white/12 bg-black/20 p-5 shadow-[0_0_40px_rgba(0,0,0,0.18)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80">Battle Cards</h3>
              <span className="text-xs text-white/55">{cardTiles.length} tiles</span>
            </div>
            <div
              className="grid gap-0"
              style={{
                gridTemplateColumns: `repeat(${EXPORT_CARD_GRID_COLUMNS}, minmax(0, 1fr))`,
              }}
            >
              {cardTiles.length > 0 ? (
                cardTiles.map((cardTile, index) => {
                  const asset = findCardAssetByName(build.game, cardTile.name, build.version);
                  return (
                    <div
                      key={`${cardTile.name}-${index}`}
                      className={BATTLE_CARD_FRAME_CLASS}
                      data-regular-card={cardTile.isRegular ? "true" : undefined}
                    >
                      {asset ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.localPath} alt={cardTile.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-end bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(15,23,42,0.5))] p-2">
                          <span className="line-clamp-3 text-[10px] font-semibold leading-4 text-white/92">{cardTile.name}</span>
                        </div>
                      )}
                      {cardTile.isRegular ? (
                        <div
                          aria-hidden="true"
                          data-regular-card-overlay="true"
                          className="pointer-events-none absolute inset-0 box-border border-[5px] border-red-600 shadow-[0_0_18px_rgba(220,38,38,0.95)]"
                        />
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div
                  className="rounded-2xl border border-dashed border-white/18 px-4 py-12 text-center text-sm text-white/55"
                  style={{
                    gridColumn: `span ${EXPORT_CARD_GRID_COLUMNS}`,
                  }}
                >
                  カードがまだ入力されていません。
                </div>
              )}
            </div>
          </section>

          <div className="grid grid-cols-[1.1fr_0.9fr] gap-6">
            <section className="rounded-[30px] border border-white/12 bg-black/20 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80">Abilities & Notes</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[24px] bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">Abilities</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-white/82">
                    {abilities.length > 0 ? (
                      abilities.map((item) => <li key={item}>• {item}</li>)
                    ) : (
                      <li>• アビリティ未設定</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-[24px] bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">Special Rules</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-white/82">
                    {notes.length > 0 ? notes.map((note) => <li key={note}>• {note}</li>) : <li>• 版固有メモ未設定</li>}
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/12 bg-black/20 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80">Brother & System</h3>
              <div className="mt-4 space-y-4">
                <div className="rounded-[24px] bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">Brothers</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-white/82">
                    {brothers.length > 0 ? brothers.map((item) => <li key={item}>• {item}</li>) : <li>• ブラザー未設定</li>}
                  </ul>
                </div>
                <div className="rounded-[24px] bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">System Snapshot</p>
                  {build.game === "mmsf3" ? (
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-white/82">
                      {mmsf3SystemSnapshotLines.map((line, index) => (
                        <li key={`${line}-${index}`}>• {line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-white/82">
                      {build.game === "mmsf1" && (build.gameSpecificSections.mmsf1.warRockWeapon || "ウォーロック装備未設定")}
                      {build.game === "mmsf2" &&
                        (build.gameSpecificSections.mmsf2.bestCombo || build.gameSpecificSections.mmsf2.tribeNotes || "トライブ情報未設定")}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
});

ExportScene.displayName = "ExportScene";
