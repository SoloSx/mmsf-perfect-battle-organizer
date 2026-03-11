"use client";

import { forwardRef } from "react";
import { findCardAssetByName } from "@/lib/assets";
import { getMmsf1EnhancementLabel, isMmsf1EnhancementEnabled } from "@/lib/mmsf1/enhancement";
import { normalizeMmsf1BrotherProfile } from "@/lib/mmsf1/brothers";
import { getNormalizedMmsf3State } from "@/lib/mmsf3/build-state";
import { evaluateNoiseHand } from "@/lib/mmsf3/noise-hand";
import { isMmsf3VersionDefaultAbility } from "@/lib/mmsf3/abilities";
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
import {
  getMmsf2EnhancementEffect,
  getMmsf2EnhancementLabel,
  getMmsf2EnhancementStatSummary,
} from "@/lib/mmsf2/enhancements";
import { isMmsf2VersionDefaultAbility, normalizeMmsf2AbilityEntries } from "@/lib/mmsf2/abilities";
import { GAME_LABELS, getVersionRuleSet, VERSION_LABELS } from "@/lib/rules";
import type { BuildRecord, VersionId } from "@/lib/types";

const BATTLE_CARD_FRAME_CLASS =
  "relative aspect-[4/3] overflow-hidden bg-white/8";
const EXPORT_CARD_TILE_LIMIT = 30;
const EXPORT_CARD_GRID_COLUMNS = 10;
const EXPORT_HALF_CARD_GRID_COLUMNS = 5;
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
const MMSF1_VERSION_ICON_PATHS: Record<"leo" | "pegasus" | "dragon", string> = {
  leo: "/assets/mmsf1/icons/fire-leo-icon.png",
  pegasus: "/assets/mmsf1/icons/ice-pegasus-icon.png",
  dragon: "/assets/mmsf1/icons/green-dragon-icon.png",
};
const MMSF1_BOKTAI_BROTHER_ICON_PATH = "/assets/mmsf1/icons/boktai-brother-icon.png";
const MMSF1_MISORA_BROTHER_ICON_PATH = "/assets/mmsf1/icons/misora-brother-icon.png";
const MMSF1_LUNA_BROTHER_ICON_PATH = "/assets/mmsf1/icons/luna-brother-icon.png";
const MMSF1_LM_SHIN_BROTHER_ICON_PATH = "/assets/mmsf1/icons/lm-shin-brother-icon.png";
const MMSF1_KIZAMARO_BROTHER_ICON_PATH = "/assets/mmsf1/icons/kizamaro-brother-icon.png";
const MMSF1_GONTA_BROTHER_ICON_PATH = "/assets/mmsf1/icons/gonta-brother-icon.png";
const MMSF3_NORMAL_ICON_PATH = "/assets/mmsf3/noises/normal-rockman-icon.svg";
const MMSF2_VERSION_ICON_PATHS: Record<"berserker" | "shinobi" | "dinosaur", string> = {
  berserker: "/assets/mmsf2/icons/berserker-icon.jpeg",
  shinobi: "/assets/mmsf2/icons/shinobi-icon.jpeg",
  dinosaur: "/assets/mmsf2/icons/dinosaur-icon.jpeg",
};
const MMSF2_NORMAL_ICON_PATH = "/assets/mmsf2/icons/normal-rockman-icon.jpeg";
const MMSF2_KOKOUNOKAKERA_ICON_PATH = "/assets/mmsf2/icons/kokounokakera.gif";

function getExportBackground(build: BuildRecord) {
  if (build.game === "mmsf1" && build.version === "pegasus") {
    return [
      "radial-gradient(circle at 16% 16%, rgba(255,255,255,0.24), transparent 24%)",
      "radial-gradient(circle at 42% 18%, rgba(196,181,253,0.22), transparent 20%)",
      "radial-gradient(circle at 72% 52%, rgba(96,165,250,0.24), transparent 24%)",
      "radial-gradient(circle at 84% 78%, rgba(250,204,21,0.24), transparent 24%)",
      "linear-gradient(118deg, rgba(18,12,56,0.98) 0%, rgba(37,99,235,0.92) 28%, rgba(76,29,149,0.82) 56%, rgba(30,64,175,0.78) 76%, rgba(250,204,21,0.68) 100%)",
    ].join(", ");
  }

  if (build.game === "mmsf1" && build.version === "leo") {
    return [
      "radial-gradient(circle at 16% 16%, rgba(255,230,138,0.24), transparent 24%)",
      "radial-gradient(circle at 38% 18%, rgba(248,113,113,0.22), transparent 20%)",
      "radial-gradient(circle at 70% 52%, rgba(234,88,12,0.24), transparent 24%)",
      "radial-gradient(circle at 84% 78%, rgba(168,85,247,0.18), transparent 24%)",
      "linear-gradient(118deg, rgba(35,8,10,0.98) 0%, rgba(96,24,27,0.92) 24%, rgba(180,57,22,0.82) 52%, rgba(81,36,122,0.74) 74%, rgba(10,38,67,0.86) 100%)",
    ].join(", ");
  }

  if (build.game === "mmsf1" && build.version === "dragon") {
    return [
      "radial-gradient(circle at 16% 16%, rgba(167,243,208,0.24), transparent 24%)",
      "radial-gradient(circle at 42% 18%, rgba(74,222,128,0.22), transparent 20%)",
      "radial-gradient(circle at 72% 52%, rgba(45,212,191,0.24), transparent 24%)",
      "radial-gradient(circle at 84% 78%, rgba(250,204,21,0.24), transparent 24%)",
      "linear-gradient(118deg, rgba(4,28,24,0.98) 0%, rgba(7,74,62,0.94) 26%, rgba(5,150,105,0.84) 54%, rgba(21,128,61,0.78) 74%, rgba(15,23,42,0.88) 100%)",
    ].join(", ");
  }

  if (build.game === "mmsf3" && build.version === "red-joker") {
    return [
      "radial-gradient(circle at 18% 18%, rgba(255,118,163,0.22), transparent 24%)",
      "radial-gradient(circle at 62% 16%, rgba(255,228,138,0.18), transparent 18%)",
      "radial-gradient(circle at 80% 72%, rgba(255,82,82,0.18), transparent 24%)",
      "linear-gradient(120deg, rgba(43,8,21,0.96), rgba(111,18,52,0.82), rgba(111,26,102,0.76), rgba(18,12,40,0.96))",
    ].join(", ");
  }

  if (build.game === "mmsf2") {
    if (build.version === "berserker") {
      return [
        "radial-gradient(circle at 16% 16%, rgba(255,255,255,0.24), transparent 24%)",
        "radial-gradient(circle at 44% 18%, rgba(226,232,240,0.24), transparent 20%)",
        "radial-gradient(circle at 72% 54%, rgba(59,130,246,0.22), transparent 24%)",
        "radial-gradient(circle at 84% 80%, rgba(250,204,21,0.28), transparent 24%)",
        "linear-gradient(118deg, rgba(5,10,24,0.98) 0%, rgba(20,32,70,0.94) 30%, rgba(70,85,110,0.82) 56%, rgba(160,174,192,0.76) 78%, rgba(245,158,11,0.7) 100%)",
      ].join(", ");
    }

    if (build.version === "shinobi") {
      return [
        "radial-gradient(circle at 16% 16%, rgba(250,204,21,0.24), transparent 24%)",
        "radial-gradient(circle at 52% 18%, rgba(163,230,53,0.22), transparent 20%)",
        "radial-gradient(circle at 70% 52%, rgba(56,189,248,0.22), transparent 24%)",
        "radial-gradient(circle at 84% 78%, rgba(14,165,233,0.26), transparent 24%)",
        "linear-gradient(118deg, rgba(4,16,20,0.98) 0%, rgba(10,54,64,0.94) 28%, rgba(31,119,109,0.82) 55%, rgba(139,191,47,0.72) 76%, rgba(245,158,11,0.66) 100%)",
      ].join(", ");
    }

    if (build.version === "dinosaur") {
      return [
        "radial-gradient(circle at 16% 18%, rgba(254,240,138,0.24), transparent 24%)",
        "radial-gradient(circle at 48% 16%, rgba(251,146,60,0.24), transparent 20%)",
        "radial-gradient(circle at 72% 48%, rgba(249,115,22,0.24), transparent 24%)",
        "radial-gradient(circle at 84% 78%, rgba(220,38,38,0.28), transparent 24%)",
        "linear-gradient(118deg, rgba(30,12,4,0.98) 0%, rgba(91,33,4,0.94) 28%, rgba(154,52,18,0.86) 54%, rgba(194,65,12,0.78) 74%, rgba(255,214,102,0.7) 100%)",
      ].join(", ");
    }

    const tribeGlow =
      "radial-gradient(circle at 84% 76%, rgba(250,204,21,0.22), transparent 24%)";

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
  if (build.game === "mmsf1" && build.version === "pegasus") {
    return "linear-gradient(135deg, #f8fafc 0%, #60a5fa 28%, #4f46e5 62%, #facc15 100%)";
  }

  if (build.game === "mmsf1" && build.version === "leo") {
    return "linear-gradient(135deg, #fde68a 0%, #fb923c 24%, #ef4444 58%, #1d4ed8 100%)";
  }

  if (build.game === "mmsf1" && build.version === "dragon") {
    return "linear-gradient(135deg, #bbf7d0 0%, #4ade80 28%, #14b8a6 62%, #facc15 100%)";
  }

  if (build.game === "mmsf3" && build.version === "red-joker") {
    return "linear-gradient(135deg, #ff8fb1 0%, #ff2f68 34%, #ffcc4d 74%, #ff5a36 100%)";
  }

  if (build.game !== "mmsf2") {
    return `linear-gradient(135deg, ${rule.accent.from}, ${rule.accent.to})`;
  }

  switch (build.version) {
    case "berserker":
      return "linear-gradient(135deg, #f8fafc 0%, #94a3b8 28%, #1d4ed8 58%, #facc15 100%)";
    case "shinobi":
      return "linear-gradient(135deg, #facc15 0%, #a3e635 24%, #22c55e 48%, #38bdf8 76%, #0f766e 100%)";
    case "dinosaur":
      return "linear-gradient(135deg, #fde68a 0%, #fb923c 26%, #f97316 52%, #dc2626 100%)";
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
  const lines = [state.noise || "ノイズ情報未設定"];

  if (state.playerRezonCard) {
    lines.push(`レゾンカード: ${state.playerRezonCard}`);
  }

  if (evaluation.errors.length > 0) {
    return [...lines, ...evaluation.errors];
  }

  if (!evaluation.bestHand && evaluation.rolelessBugEffects.length > 0) {
    lines.push(...evaluation.rolelessBugEffects.map((effect) => `バグ: ${effect}`));
  }

  for (const card of evaluation.selectedCards) {
    lines.push(card.label);
  }

  return lines;
}

function getMmsf1SystemSnapshotLines(build: BuildRecord) {
  const s = build.gameSpecificSections.mmsf1;
  const lines: string[] = [s.warRockWeapon || "ウォーロック装備未設定"];

  if (isMmsf1EnhancementEnabled(s.enhancement)) {
    lines.unshift(
      `強化: ${getMmsf1EnhancementLabel(s.enhancement)}`,
      "スキャナー効果: Lv99",
      "HP+990 / A+4 / R+4 / C+4 / Gauge+4 / Mega+4 / Giga+4",
      "アンダーシャツ / スーパーアーマー / ファーストバリア / フロートシューズ",
    );
  }

  if (s.brotherBandMode) lines.push(s.brotherBandMode);
  if (s.versionFeature) lines.push(s.versionFeature);
  if (s.crossBrotherNotes) lines.push(s.crossBrotherNotes);
  return lines;
}

function getMmsf2SystemSnapshotLines(build: BuildRecord) {
  const s = build.gameSpecificSections.mmsf2;
  const enhancementLabel = getMmsf2EnhancementLabel(s.enhancement);
  const enhancementStatSummary = getMmsf2EnhancementStatSummary(s.enhancement);
  const lines: string[] = [enhancementLabel ? `強化: ${enhancementLabel}` : "強化なし"];
  if (enhancementStatSummary) lines.push(enhancementStatSummary);
  if (s.warRockWeapon) lines.push(s.warRockWeapon);
  return lines;
}

function getExportAbilityLines(build: BuildRecord) {
  const selectedAbilities = build.commonSections.abilities.map((entry) => entry.name).filter(Boolean);

  if (build.game !== "mmsf2") {
    return selectedAbilities;
  }

  const enhancementEffect = getMmsf2EnhancementEffect(build.gameSpecificSections.mmsf2.enhancement);
  if (!enhancementEffect) {
    return selectedAbilities;
  }

  return [...enhancementEffect.grantedAbilities, ...selectedAbilities];
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

  const hasVersionDefaultAbility = build.commonSections.abilities.some((entry) =>
    isMmsf3VersionDefaultAbility(entry.name, build.version),
  );

  if (!hasVersionDefaultAbility) {
    return MMSF3_NORMAL_ICON_PATH;
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

  const hasVersionDefaultAbility = build.commonSections.abilities.some((entry) =>
    isMmsf3VersionDefaultAbility(entry.name, build.version),
  );

  if (!hasVersionDefaultAbility) {
    return "ロックマン";
  }

  const state = getNormalizedMmsf3State(build);
  return (
    getMmsf3NoiseOption(state.noise)?.label ??
    getMmsf3NoiseOptionByLabel(state.noise.replace(/ノイズ$/, ""))?.label ??
    getMmsf3NoiseOptionByLabel(state.noise)?.label ??
    state.noise
  );
}

function getMmsf2VersionIconPath(build: BuildRecord) {
  if (build.game !== "mmsf2") {
    return "";
  }

  const normalizedAbilities = normalizeMmsf2AbilityEntries(
    build.commonSections.abilities,
    build.version,
    build.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled,
  );
  const hasVersionFixedAbility = normalizedAbilities.some((entry) => isMmsf2VersionDefaultAbility(entry.name, build.version));

  if (!hasVersionFixedAbility) {
    return MMSF2_NORMAL_ICON_PATH;
  }

  if (build.version === "berserker" || build.version === "shinobi" || build.version === "dinosaur") {
    return MMSF2_VERSION_ICON_PATHS[build.version];
  }

  return MMSF2_NORMAL_ICON_PATH;
}

function getMmsf1VersionIconPath(build: BuildRecord) {
  if (build.game !== "mmsf1") {
    return "";
  }

  if (build.version === "leo" || build.version === "pegasus" || build.version === "dragon") {
    return MMSF1_VERSION_ICON_PATHS[build.version];
  }

  return "";
}

function getMmsf2VersionIconLabel(build: BuildRecord) {
  if (build.game !== "mmsf2") {
    return "";
  }

  const normalizedAbilities = normalizeMmsf2AbilityEntries(
    build.commonSections.abilities,
    build.version,
    build.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled,
  );

  if (normalizedAbilities.some((entry) => isMmsf2VersionDefaultAbility(entry.name, build.version))) {
    return versionLabelToTribe(VERSION_LABELS[build.version] ?? "");
  }

  return "ノーマルロックマン";
}

function versionLabelToTribe(label: string) {
  return label;
}

function getMmsf1BrotherVisualSummary(build: BuildRecord) {
  if (build.game !== "mmsf1") {
    return { versionIcons: [], favoriteCardGroups: [] as string[][] };
  }

  const normalizedBrothers = build.commonSections.brothers.map((entry) =>
    normalizeMmsf1BrotherProfile(entry, build.version as Extract<VersionId, "pegasus" | "leo" | "dragon">),
  );

  const versionIcons = normalizedBrothers.flatMap((entry) => {
    if (entry.name === "響 ミソラ") {
      return [{ version: "misora", label: "響 ミソラ", path: MMSF1_MISORA_BROTHER_ICON_PATH }];
    }

    if (entry.name === "白金 ルナ") {
      return [{ version: "luna", label: "白金 ルナ", path: MMSF1_LUNA_BROTHER_ICON_PATH }];
    }

    if (entry.name === "LM・シン") {
      return [{ version: "lm-shin", label: "LM・シン", path: MMSF1_LM_SHIN_BROTHER_ICON_PATH }];
    }

    if (entry.name === "最小院 キザマロ") {
      return [{ version: "kizamaro", label: "最小院 キザマロ", path: MMSF1_KIZAMARO_BROTHER_ICON_PATH }];
    }

    if (entry.name === "牛島ゴン太") {
      return [{ version: "gonta", label: "牛島ゴン太", path: MMSF1_GONTA_BROTHER_ICON_PATH }];
    }

    if (entry.rezonCard === "boktai") {
      return [{ version: "boktai", label: "ボクタイ", path: MMSF1_BOKTAI_BROTHER_ICON_PATH }];
    }

    if (entry.rezonCard === "pegasus" || entry.rezonCard === "leo" || entry.rezonCard === "dragon") {
      return [{
        version: entry.rezonCard,
        label: VERSION_LABELS[entry.rezonCard],
        path: MMSF1_VERSION_ICON_PATHS[entry.rezonCard],
      }];
    }

    return [];
  });

  const favoriteCardGroups: string[][] = [];
  for (const entry of normalizedBrothers) {
    const group = entry.favoriteCards.map((cardName) => cardName.trim()).filter(Boolean);
    if (group.length === 0) {
      continue;
    }

    const groupKey = group.join(",");
    if (!favoriteCardGroups.some((existingGroup) => existingGroup.join(",") === groupKey)) {
      favoriteCardGroups.push(group);
    }
  }

  return { versionIcons, favoriteCardGroups };
}

function getMmsf2BrotherVisualSummary(build: BuildRecord) {
  if (build.game !== "mmsf2") {
    return { versionIcons: [], favoriteCardGroups: [] as string[][] };
  }

  const versionIcons = build.commonSections.brothers
    .map((entry) => entry.rezonCard)
    .filter((value): value is "berserker" | "shinobi" | "dinosaur" => value === "berserker" || value === "shinobi" || value === "dinosaur")
    .map((version) => ({
      version,
      label: VERSION_LABELS[version],
      path: MMSF2_VERSION_ICON_PATHS[version],
    }));

  const favoriteCardGroups: string[][] = [];
  for (const entry of build.commonSections.brothers) {
    const group = entry.favoriteCards.map((cardName) => cardName.trim()).filter(Boolean);
    if (group.length === 0) {
      continue;
    }

    const groupKey = group.join(",");
    if (!favoriteCardGroups.some((existingGroup) => existingGroup.join(",") === groupKey)) {
      favoriteCardGroups.push(group);
    }
  }

  return { versionIcons, favoriteCardGroups };
}

export const ExportScene = forwardRef<HTMLDivElement, { build: BuildRecord }>(({ build }, ref) => {
  const rule = getVersionRuleSet(build.version);
  const versionLabel = VERSION_LABELS[build.version];
  const titleClassName =
    build.game === "mmsf3" && build.version === "red-joker"
      ? "mt-3 text-[2rem] leading-none font-black tracking-[-0.04em] whitespace-nowrap"
      : "mt-3 text-4xl leading-none font-black tracking-tight whitespace-nowrap";
  const noisePortraitClassName =
    build.game === "mmsf1" || build.game === "mmsf2" || (build.game === "mmsf3" && build.version === "red-joker")
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

    const markedCopies =
      build.game === "mmsf1" || build.game === "mmsf2"
        ? Math.max(0, Math.min(copiesToAdd, Math.trunc(entry.favoriteCount ?? (entry.isRegular ? 1 : 0))))
        : entry.isRegular
          ? 1
          : 0;

    for (let index = 0; index < copiesToAdd; index += 1) {
      tiles.push({ name, isRegular: index < markedCopies });
    }

    return tiles;
  }, []);
  const abilities = getExportAbilityLines(build);
  const brothers =
    build.game === "mmsf3"
      ? getMmsf3BrotherRouletteLines(build).slice(0, 6)
      : build.commonSections.brothers.map((entry) => entry.name).filter(Boolean).slice(0, 6);
  const mmsf3SystemSnapshotLines = build.game === "mmsf3" ? getMmsf3SystemSnapshotLines(build) : [];
  const mmsf1SystemSnapshotLines = build.game === "mmsf1" ? getMmsf1SystemSnapshotLines(build) : [];
  const mmsf2SystemSnapshotLines = build.game === "mmsf2" ? getMmsf2SystemSnapshotLines(build) : [];
  const mmsf2StarCards = build.game === "mmsf2" ? build.gameSpecificSections.mmsf2.starCards.map((entry) => entry.name).filter(Boolean) : [];
  const mmsf2BlankCards = build.game === "mmsf2" ? build.gameSpecificSections.mmsf2.blankCards.map((entry) => entry.name).filter(Boolean) : [];
  const mmsf3WhiteCardNames = build.game === "mmsf3" ? getMmsf3WhiteCardNames(build).slice(0, 4) : [];
  const mmsf1VersionIconPath = getMmsf1VersionIconPath(build);
  const mmsf3NoisePortraitPath = getMmsf3NoisePortraitPath(build);
  const mmsf3NoiseLabel = getMmsf3NoiseLabel(build);
  const mmsf3BrotherVisualSummary = build.game === "mmsf3" ? getMmsf3BrotherVisualSummary(build) : null;
  const mmsf1BrotherVisualSummary = build.game === "mmsf1" ? getMmsf1BrotherVisualSummary(build) : null;
  const mmsf2VersionIconPath = getMmsf2VersionIconPath(build);
  const mmsf2VersionIconLabel = getMmsf2VersionIconLabel(build);
  const mmsf2BrotherVisualSummary = build.game === "mmsf2" ? getMmsf2BrotherVisualSummary(build) : null;

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
              {build.game === "mmsf1" && mmsf1VersionIconPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mmsf1VersionIconPath}
                  alt={versionLabel}
                  className={noisePortraitClassName}
                />
              ) : null}
              {build.game === "mmsf2" && mmsf2VersionIconPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mmsf2VersionIconPath}
                  alt={mmsf2VersionIconLabel}
                  className={noisePortraitClassName}
                />
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/70">Rockman</p>
                <ul className="mt-2 space-y-0.5 text-[11px] leading-4 text-white/80">
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
              {build.game !== "mmsf1" && (
                <div className="rounded-[28px] border border-white/12 bg-white/8 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/70">Abilities</p>
                  <ul className="mt-2 space-y-0.5 text-[11px] leading-4 text-white/80">
                    {abilities.length > 0 ? (
                      abilities.map((item) => <li key={item}>• {item}</li>)
                    ) : (
                      <li>• アビリティ未設定</li>
                    )}
                  </ul>
                </div>
              )}
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
            {mmsf2StarCards.length > 0 || mmsf2BlankCards.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {mmsf2BlankCards.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/70">Blank Cards</p>
                    <div
                      className="mt-2 grid gap-0"
                      style={{ gridTemplateColumns: `repeat(${EXPORT_HALF_CARD_GRID_COLUMNS}, minmax(0, 1fr))` }}
                    >
                      {mmsf2BlankCards.map((cardName, index) => {
                        const asset = findCardAssetByName(build.game, cardName, build.version);

                        return (
                          <div key={`blank-${cardName}-${index}`} className={BATTLE_CARD_FRAME_CLASS}>
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
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/70">Star Cards</p>
                    <div
                      className="mt-2 grid gap-0"
                      style={{ gridTemplateColumns: `repeat(${EXPORT_HALF_CARD_GRID_COLUMNS}, minmax(0, 1fr))` }}
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
                  {build.game === "mmsf2" ? (
                    build.gameSpecificSections.mmsf2.kokouNoKakera ? (
                      <div
                        className={`${BATTLE_CARD_FRAME_CLASS} shrink-0`}
                        style={{ width: `${100 / EXPORT_CARD_GRID_COLUMNS}%` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={MMSF2_KOKOUNOKAKERA_ICON_PATH} alt="ここうのカケラ" className="h-full w-full object-cover" />
                      </div>
                    ) : mmsf2BrotherVisualSummary &&
                      (mmsf2BrotherVisualSummary.versionIcons.length > 0 || mmsf2BrotherVisualSummary.favoriteCardGroups.length > 0) ? (
                      <div className="space-y-3">
                        {mmsf2BrotherVisualSummary.versionIcons.length > 0 ? (
                          <div className="flex flex-wrap gap-0">
                            {mmsf2BrotherVisualSummary.versionIcons.map((item, index) => (
                              <div
                                key={`${item.version}-${index}`}
                                className="relative aspect-square shrink-0 overflow-hidden"
                                style={{ width: `${(100 / EXPORT_CARD_GRID_COLUMNS) * 0.75}%` }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.path} alt={item.label} className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {mmsf2BrotherVisualSummary.favoriteCardGroups.length > 0 ? (
                          <div className="space-y-2">
                            {mmsf2BrotherVisualSummary.favoriteCardGroups.map((group, groupIndex) => (
                              <div key={`mmsf2-fav-${groupIndex}`} className="flex">
                                {group.map((cardName, cardIndex) => {
                                  const asset = findCardAssetByName(build.game, cardName, build.version);
                                  return (
                                    <div
                                      key={`mmsf2-fav-${groupIndex}-${cardName}-${cardIndex}`}
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
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-white/60">ブラザー未設定</p>
                    )
                  ) : build.game === "mmsf1" ? (
                    mmsf1BrotherVisualSummary &&
                    (mmsf1BrotherVisualSummary.versionIcons.length > 0 || mmsf1BrotherVisualSummary.favoriteCardGroups.length > 0) ? (
                      <div className="space-y-3">
                        {mmsf1BrotherVisualSummary.versionIcons.length > 0 ? (
                          <div className="flex flex-wrap gap-0">
                            {mmsf1BrotherVisualSummary.versionIcons.map((item, index) => (
                              <div
                                key={`${item.version}-${index}`}
                                className="relative aspect-square shrink-0 overflow-hidden"
                                style={{ width: `${(100 / EXPORT_CARD_GRID_COLUMNS) * 0.75}%` }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.path} alt={item.label} className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {mmsf1BrotherVisualSummary.favoriteCardGroups.length > 0 ? (
                          <div className="space-y-2">
                            {mmsf1BrotherVisualSummary.favoriteCardGroups.map((group, groupIndex) => (
                              <div key={`mmsf1-fav-${groupIndex}`} className="flex">
                                {group.map((cardName, cardIndex) => {
                                  const asset = findCardAssetByName(build.game, cardName, build.version);
                                  return (
                                    <div
                                      key={`mmsf1-fav-${groupIndex}-${cardName}-${cardIndex}`}
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
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : <p className="text-sm text-white/60">ブラザー未設定</p>
                  ) : (
                    <ul className="space-y-2 text-sm leading-6 text-white/82">
                      {brothers.length > 0
                        ? brothers.map((item) => <li key={item}>• {item}</li>)
                        : <li>• ブラザー未設定</li>}
                    </ul>
                  )}
                </div>
              )}
          </section>
        </div>
      </div>
    </div>
  );
});

ExportScene.displayName = "ExportScene";
