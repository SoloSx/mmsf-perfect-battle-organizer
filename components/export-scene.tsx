"use client";

import { forwardRef } from "react";
import { findCardAssetByName } from "@/lib/assets";
import { getNormalizedMmsf3State } from "@/lib/mmsf3/build-state";
import { evaluateNoiseHand } from "@/lib/mmsf3/noise-hand";
import {
  getMmsf3BrotherVersionOption,
  getMmsf3GigaCardOption,
  getMmsf3MegaCardOption,
  getMmsf3NoiseOption,
  getMmsf3NoiseOptionByLabel,
  getMmsf3RezonCardOption,
  getMmsf3SssLevelOption,
  getMmsf3WhiteCardSetCards,
  getMmsf3WhiteCardSetOption,
  MMSF3_BROTHER_ROULETTE_POSITIONS,
} from "@/lib/mmsf3/roulette-data";
import { GAME_LABELS, getVersionRuleSet, VERSION_LABELS } from "@/lib/rules";
import type { BuildRecord } from "@/lib/types";

const BATTLE_CARD_FRAME_CLASS =
  "relative aspect-[4/3] overflow-hidden bg-white/8";
const EXPORT_CARD_TILE_LIMIT = 30;
const EXPORT_CARD_GRID_COLUMNS = 10;
const MMSF3_NOISE_PORTRAIT_PATHS: Record<string, string> = {
  "01": "/assets/mmsf3/noises/libra-noise.png",
  "02": "/assets/mmsf3/noises/corvus-noise.png",
  "03": "/assets/mmsf3/noises/cancer-noise.png",
  "04": "/assets/mmsf3/noises/gemini-noise.png",
  "05": "/assets/mmsf3/noises/ophiuchus-noise.png",
  "06": "/assets/mmsf3/noises/cygnus-noise.png",
  "07": "/assets/mmsf3/noises/ox-noise.png",
  "08": "/assets/mmsf3/noises/virgo-noise.png",
  "09": "/assets/mmsf3/noises/crown-noise.png",
  "0A": "/assets/mmsf3/noises/wolf-noise.png",
  "0B": "/assets/mmsf3/noises/burai-noise.png",
};

function getExportBackground(build: BuildRecord) {
  if (build.game === "mmsf3" && build.version === "red-joker") {
    return [
      "radial-gradient(circle at 18% 18%, rgba(255,118,163,0.22), transparent 24%)",
      "radial-gradient(circle at 62% 16%, rgba(255,228,138,0.18), transparent 18%)",
      "radial-gradient(circle at 80% 72%, rgba(255,82,82,0.18), transparent 24%)",
      "linear-gradient(120deg, rgba(43,8,21,0.96), rgba(111,18,52,0.82), rgba(111,26,102,0.76), rgba(18,12,40,0.96))",
    ].join(", ");
  }

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

  return "radial-gradient(circle at top left, rgba(255,255,255,0.16), transparent 34%), linear-gradient(120deg, rgba(30,64,175,0.92), rgba(91,33,182,0.72), rgba(15,23,42,0.96))";
}

function getExportAccentBackground(build: BuildRecord, rule: ReturnType<typeof getVersionRuleSet>) {
  if (build.game === "mmsf3" && build.version === "red-joker") {
    return "linear-gradient(135deg, #ff8fb1 0%, #ff2f68 34%, #ffcc4d 74%, #ff5a36 100%)";
  }

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

function getExportHeroPanelBackground(build: BuildRecord) {
  void build;
  return "rgba(0,0,0,0.25)";
}

function getMmsf3SystemSnapshotLines(build: BuildRecord) {
  const state = getNormalizedMmsf3State(build);
  const evaluation = evaluateNoiseHand(state.noiseCardIds);
  const selectedCount = state.noiseCardIds.filter(Boolean).length;
  const lines = [state.noise || "ノイズ情報未設定"];

  if (state.playerRezonCard) {
    lines.push(`レゾンカード: ${state.playerRezonCard}`);
  }

  if (evaluation.errors.length > 0) {
    return [...lines, ...evaluation.errors];
  }

  for (const card of evaluation.selectedCards) {
    lines.push(card.label);
  }

  return lines;
}

function getMmsf1SystemSnapshotLines(build: BuildRecord) {
  const s = build.gameSpecificSections.mmsf1;
  const lines: string[] = [s.warRockWeapon || "ウォーロック装備未設定"];
  if (s.brotherBandMode) lines.push(s.brotherBandMode);
  if (s.versionFeature) lines.push(s.versionFeature);
  if (s.crossBrotherNotes) lines.push(s.crossBrotherNotes);
  return lines;
}

function getMmsf2EnhancementLabel(value: string) {
  const map: Record<string, string> = {
    berserker: "ベルセルク",
    shinobi: "シノビ",
    dinosaur: "ダイナソー",
    burai: "ブライ",
  };
  return map[value] ?? null;
}

function getMmsf2SystemSnapshotLines(build: BuildRecord) {
  const s = build.gameSpecificSections.mmsf2;
  const enhancementLabel = getMmsf2EnhancementLabel(s.enhancement);
  const lines: string[] = [enhancementLabel ? `強化: ${enhancementLabel}` : "強化なし"];
  if (s.warRockWeapon) lines.push(s.warRockWeapon);
  return lines;
}

function getMmsf3WhiteCardNames(build: BuildRecord) {
  const state = getNormalizedMmsf3State(build);
  const whiteCardLabel = getMmsf3WhiteCardSetOption(state.whiteCardSetId)?.label ?? "";

  if (!whiteCardLabel || whiteCardLabel === "なし") {
    return [];
  }

  return whiteCardLabel
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getMmsf3BrotherRouletteLines(build: BuildRecord) {
  const state = getNormalizedMmsf3State(build);

  return state.brotherRouletteSlots
    .map((slot) => {
      const positionLabel = MMSF3_BROTHER_ROULETTE_POSITIONS.find((position) => position.key === slot.position)?.label ?? slot.position;
      if (slot.slotType === "sss") {
        const sssLabel = getMmsf3SssLevelOption(slot.sssLevel)?.label;
        return sssLabel ? `${positionLabel}: SSS / ${sssLabel}` : `${positionLabel}: SSS`;
      }

      const whiteCardLabel = getMmsf3WhiteCardSetOption(slot.whiteCardSetId)?.label;
      const parts = [
        getMmsf3BrotherVersionOption(slot.version)?.label,
        getMmsf3NoiseOption(slot.noise)?.label,
        getMmsf3RezonCardOption(slot.rezon)?.label,
        whiteCardLabel && whiteCardLabel !== "なし" ? whiteCardLabel : "",
        getMmsf3GigaCardOption(slot.gigaCard)?.label,
        getMmsf3MegaCardOption(slot.megaCard)?.label,
      ].filter(Boolean);

      return parts.length > 0 ? `${positionLabel}: ${parts.join(" / ")}` : null;
    })
    .filter((line): line is string => Boolean(line));
}

function getMmsf3BrotherVisualSummary(build: BuildRecord) {
  const state = getNormalizedMmsf3State(build);
  const noisePortraits: Array<{ path: string; label: string }> = [];
  const sssEntries: Array<{ positionLabel: string; sssLabel: string; isGreek: boolean }> = [];
  const whiteCardGroups: string[][] = [];
  const sideCardNames: string[] = [];

  for (const slot of state.brotherRouletteSlots) {
    const positionLabel =
      MMSF3_BROTHER_ROULETTE_POSITIONS.find((p) => p.key === slot.position)?.label ?? slot.position;

    if (slot.slotType === "sss") {
      const sssLabel = getMmsf3SssLevelOption(slot.sssLevel)?.label ?? "";
      if (sssLabel) {
        sssEntries.push({ positionLabel, sssLabel, isGreek: slot.sssLevel.startsWith("G") });
      }
      continue;
    }

    const noiseValue =
      getMmsf3NoiseOption(slot.noise)?.value ??
      getMmsf3NoiseOptionByLabel(slot.noise)?.value ??
      "";
    const portraitPath = MMSF3_NOISE_PORTRAIT_PATHS[noiseValue] ?? "";
    const noiseLabel = getMmsf3NoiseOption(slot.noise)?.label ?? slot.noise;
    if (portraitPath) {
      noisePortraits.push({ path: portraitPath, label: noiseLabel });
    }

    const slotWhiteCards = getMmsf3WhiteCardSetCards(slot.whiteCardSetId);
    if (slotWhiteCards.length > 0) {
      const setKey = slotWhiteCards.join(",");
      if (!whiteCardGroups.some((g) => g.join(",") === setKey)) {
        whiteCardGroups.push(slotWhiteCards);
      }
    }

    const gigaLabel = getMmsf3GigaCardOption(slot.gigaCard)?.label;
    if (gigaLabel && !sideCardNames.includes(gigaLabel)) {
      sideCardNames.push(gigaLabel);
    }

    const megaLabel = getMmsf3MegaCardOption(slot.megaCard)?.label;
    if (megaLabel && !sideCardNames.includes(megaLabel)) {
      sideCardNames.push(megaLabel);
    }
  }

  return { noisePortraits, sssEntries, whiteCardGroups, sideCardNames };
}

function getMmsf3NoisePortraitPath(build: BuildRecord) {
  if (build.game !== "mmsf3") {
    return "";
  }

  const state = getNormalizedMmsf3State(build);
  const normalizedNoiseValue =
    getMmsf3NoiseOption(state.noise)?.value ??
    getMmsf3NoiseOptionByLabel(state.noise.replace(/ノイズ$/, ""))?.value ??
    getMmsf3NoiseOptionByLabel(state.noise)?.value ??
    "";

  return MMSF3_NOISE_PORTRAIT_PATHS[normalizedNoiseValue] ?? "";
}

function getMmsf3NoiseLabel(build: BuildRecord) {
  if (build.game !== "mmsf3") {
    return "";
  }

  const state = getNormalizedMmsf3State(build);
  return (
    getMmsf3NoiseOption(state.noise)?.label ??
    getMmsf3NoiseOptionByLabel(state.noise.replace(/ノイズ$/, ""))?.label ??
    getMmsf3NoiseOptionByLabel(state.noise)?.label ??
    state.noise
  );
}

export const ExportScene = forwardRef<HTMLDivElement, { build: BuildRecord }>(({ build }, ref) => {
  const rule = getVersionRuleSet(build.version);
  const versionLabel = VERSION_LABELS[build.version];
  const titleClassName =
    build.game === "mmsf3" && build.version === "red-joker"
      ? "mt-3 text-[2rem] leading-none font-black tracking-[-0.04em] whitespace-nowrap"
      : "mt-3 text-4xl leading-none font-black tracking-tight whitespace-nowrap";
  const noisePortraitClassName =
    build.game === "mmsf3" && build.version === "red-joker"
      ? "absolute left-[196px] top-[64px] h-[55px] w-[74px] object-contain"
      : "absolute left-0 top-[96px] h-[55px] w-[74px] object-contain";
  const heroPanelClassName =
    build.game === "mmsf3" && build.version === "red-joker"
      ? "relative overflow-hidden rounded-[32px] border border-white/15 p-8 pr-12 shadow-[0_0_40px_rgba(0,0,0,0.3)]"
      : "relative overflow-hidden rounded-[32px] border border-white/15 p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)]";
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
  const brothers =
    build.game === "mmsf3"
      ? getMmsf3BrotherRouletteLines(build).slice(0, 6)
      : build.commonSections.brothers.map((entry) => entry.name).filter(Boolean).slice(0, 6);
  const mmsf3SystemSnapshotLines = build.game === "mmsf3" ? getMmsf3SystemSnapshotLines(build) : [];
  const mmsf1SystemSnapshotLines = build.game === "mmsf1" ? getMmsf1SystemSnapshotLines(build) : [];
  const mmsf2SystemSnapshotLines = build.game === "mmsf2" ? getMmsf2SystemSnapshotLines(build) : [];
  const mmsf2StarCards = build.game === "mmsf2" ? build.gameSpecificSections.mmsf2.starCards.map((entry) => entry.name).filter(Boolean) : [];
  const mmsf3WhiteCardNames = build.game === "mmsf3" ? getMmsf3WhiteCardNames(build).slice(0, 4) : [];
  const mmsf3NoisePortraitPath = getMmsf3NoisePortraitPath(build);
  const mmsf3NoiseLabel = getMmsf3NoiseLabel(build);
  const mmsf3BrotherVisualSummary = build.game === "mmsf3" ? getMmsf3BrotherVisualSummary(build) : null;

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-[36px] text-white"
      style={{
        width: "1200px",
        minHeight: "675px",
        background: getExportBackground(build),
      }}
    >
      <div className="grid min-h-[675px] grid-cols-[320px_1fr] gap-6 p-10">
        <div
          className={heroPanelClassName}
          style={{ background: getExportHeroPanelBackground(build) }}
        >
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
              <h2 className={titleClassName}>{versionLabel}</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                {build.title || "名称未設定の構築"}
              </p>
              {mmsf3NoisePortraitPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mmsf3NoisePortraitPath}
                  alt={`${mmsf3NoiseLabel || "ノイズ"}ノイズ`}
                  className={noisePortraitClassName}
                />
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">Rockman</p>
                <ul className="mt-2 space-y-1 text-sm leading-5 text-white/80">
                  {build.game === "mmsf3" &&
                    mmsf3SystemSnapshotLines.map((line, index) => (
                      <li key={`${line}-${index}`}>• {line}</li>
                    ))}
                  {build.game === "mmsf1" &&
                    mmsf1SystemSnapshotLines.map((line, index) => (
                      <li key={`${line}-${index}`}>• {line}</li>
                    ))}
                  {build.game === "mmsf2" &&
                    mmsf2SystemSnapshotLines.map((line, index) => (
                      <li key={`${line}-${index}`}>• {line}</li>
                    ))}
                </ul>
              </div>
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">Abilities</p>
                <ul className="mt-2 space-y-1 text-sm leading-5 text-white/80">
                  {abilities.length > 0 ? (
                    abilities.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li>• アビリティ未設定</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-[30px] border border-white/12 bg-black/20 p-5 shadow-[0_0_40px_rgba(0,0,0,0.18)]">
            <div className="mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80">Battle Cards</h3>
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
            {mmsf3WhiteCardNames.length > 0 ? (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/70">White Cards</p>
                <div
                  className="mt-2 grid gap-0"
                  style={{ gridTemplateColumns: `repeat(${EXPORT_CARD_GRID_COLUMNS}, minmax(0, 1fr))` }}
                >
                  {mmsf3WhiteCardNames.map((cardName, index) => {
                    const asset = findCardAssetByName(build.game, cardName, build.version);

                    return (
                      <div key={`${cardName}-${index}`} className={BATTLE_CARD_FRAME_CLASS}>
                        {asset ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={asset.localPath} alt={cardName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-end bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(15,23,42,0.5))] p-2">
                            <span className="line-clamp-3 text-[10px] font-semibold leading-4 text-white/92">{cardName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {mmsf2StarCards.length > 0 ? (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/70">Star Cards</p>
                <div
                  className="mt-2 grid gap-0"
                  style={{ gridTemplateColumns: `repeat(${EXPORT_CARD_GRID_COLUMNS}, minmax(0, 1fr))` }}
                >
                  {mmsf2StarCards.map((cardName, index) => {
                    const asset = findCardAssetByName(build.game, cardName, build.version);
                    return (
                      <div key={`star-${cardName}-${index}`} className={BATTLE_CARD_FRAME_CLASS}>
                        {asset ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={asset.localPath} alt={cardName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-end bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(15,23,42,0.5))] p-2">
                            <span className="line-clamp-3 text-[10px] font-semibold leading-4 text-white/92">{cardName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <section className="flex-1 rounded-[30px] border border-white/12 bg-black/20 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80">Brothers</h3>
              {mmsf3BrotherVisualSummary ? (
                <div className="mt-4 space-y-3">
                  {/* Row 1: Noise portraits (square, height = battle card height) + Side cards */}
                  {(mmsf3BrotherVisualSummary.noisePortraits.length > 0 || mmsf3BrotherVisualSummary.sideCardNames.length > 0) && (
                    <div className="flex">
                      {mmsf3BrotherVisualSummary.noisePortraits.map((portrait, index) => (
                        <div
                          key={`${portrait.label}-${index}`}
                          className="relative aspect-square shrink-0 overflow-hidden"
                          style={{ width: `${(100 / EXPORT_CARD_GRID_COLUMNS) * 0.75}%` }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={portrait.path}
                            alt={portrait.label}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      {mmsf3BrotherVisualSummary.sideCardNames.length > 0 && (() => {
                        const cellPct = 100 / EXPORT_CARD_GRID_COLUMNS;
                        const portraitPct = mmsf3BrotherVisualSummary.noisePortraits.length * cellPct * 0.75;
                        const firstGroupLen = mmsf3BrotherVisualSummary.whiteCardGroups[0]?.length ?? 0;
                        const targetPct = firstGroupLen > 0 ? (firstGroupLen + 1) * cellPct : portraitPct + cellPct;
                        const spacerPct = Math.max(cellPct, targetPct - portraitPct);
                        return <div className="shrink-0" style={{ width: `${spacerPct}%` }} />;
                      })()}
                      {mmsf3BrotherVisualSummary.sideCardNames.map((cardName, index) => {
                        const asset = findCardAssetByName(build.game, cardName, build.version);
                        return (
                          <div
                            key={`side-${cardName}-${index}`}
                            className={`${BATTLE_CARD_FRAME_CLASS} shrink-0`}
                            style={{ width: `${100 / EXPORT_CARD_GRID_COLUMNS}%` }}
                          >
                            {asset ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={asset.localPath} alt={cardName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-end bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(15,23,42,0.5))] p-2">
                                <span className="line-clamp-3 text-[10px] font-semibold leading-4 text-white/92">{cardName}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Row 2: White card sets grouped per brother */}
                  {mmsf3BrotherVisualSummary.whiteCardGroups.length > 0 && (
                    <div className="flex">
                      {mmsf3BrotherVisualSummary.whiteCardGroups.map((group, groupIndex) => [
                        groupIndex > 0 ? (
                          <div key={`wc-spacer-${groupIndex}`} className="shrink-0" style={{ width: `${100 / EXPORT_CARD_GRID_COLUMNS}%` }} />
                        ) : null,
                        ...group.map((cardName, cardIndex) => {
                          const asset = findCardAssetByName(build.game, cardName, build.version);
                          return (
                            <div
                              key={`wc-${groupIndex}-${cardName}-${cardIndex}`}
                              className={`${BATTLE_CARD_FRAME_CLASS} shrink-0`}
                              style={{ width: `${100 / EXPORT_CARD_GRID_COLUMNS}%` }}
                            >
                              {asset ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={asset.localPath} alt={cardName} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-end bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(15,23,42,0.5))] p-2">
                                  <span className="line-clamp-3 text-[10px] font-semibold leading-4 text-white/92">{cardName}</span>
                                </div>
                              )}
                            </div>
                          );
                        }),
                      ])}
                    </div>
                  )}
                  {/* Row 3: SSS badges */}
                  {mmsf3BrotherVisualSummary.sssEntries.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {mmsf3BrotherVisualSummary.sssEntries.map((entry, index) => (
                        <span
                          key={`${entry.positionLabel}-${index}`}
                          className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white ${entry.isGreek ? "bg-orange-500/70" : "bg-blue-600/60"}`}
                        >
                          {entry.sssLabel}
                        </span>
                      ))}
                    </div>
                  )}
                  {mmsf3BrotherVisualSummary.noisePortraits.length === 0 &&
                    mmsf3BrotherVisualSummary.sideCardNames.length === 0 &&
                    mmsf3BrotherVisualSummary.whiteCardGroups.length === 0 &&
                    mmsf3BrotherVisualSummary.sssEntries.length === 0 && (
                    <p className="text-sm text-white/60">ブラザールーレット未設定</p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <ul className="space-y-2 text-sm leading-6 text-white/82">
                    {brothers.length > 0
                      ? brothers.map((item) => <li key={item}>• {item}</li>)
                      : <li>• ブラザー未設定</li>}
                  </ul>
                </div>
              )}
          </section>
        </div>
      </div>
    </div>
  );
});

ExportScene.displayName = "ExportScene";
