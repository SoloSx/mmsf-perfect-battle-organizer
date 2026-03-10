import { VERSION_LABELS } from "@/lib/rules";
import type { BrotherKind, BrotherProfile, VersionId } from "@/lib/types";

type Mmsf1BrotherKindOption = {
  value: BrotherKind;
  label: string;
};

const MMSF1_BROTHER_KIND_OPTIONS: Mmsf1BrotherKindOption[] = [
  { value: "story", label: "ゲーム内ブラザー" },
  { value: "event", label: "データ配信" },
  { value: "real", label: "リアルブラザー" },
  { value: "boktai", label: "ボクタイ" },
];

const NAMES_BY_KIND: Record<BrotherKind, string[]> = {
  story: ["響 ミソラ", "白金 ルナ", "牛島ゴン太", "最小院 キザマロ"],
  auto: [],
  real: ["ペガサス", "レオ", "ドラゴン"],
  event: ["LM・シン"],
  boktai: ["ボクタイ"],
};

type Mmsf1MainVersionId = Extract<VersionId, "pegasus" | "leo" | "dragon">;
type Mmsf1BrotherVersionValue = Mmsf1MainVersionId | "boktai" | "LM・シン";

const REAL_BROTHER_VERSION_BY_NAME: Record<string, Mmsf1MainVersionId> = {
  ペガサス: "pegasus",
  レオ: "leo",
  ドラゴン: "dragon",
};

const FIXED_FAVORITE_CARDS_BY_NAME: Record<string, string[]> = {
  "響 ミソラ": ["ホタルゲリ3", "ゴーストパルス3", "チェインバブル3", "リカバリー300", "ペガサスマジックSP", "ハープノートSP"],
  "白金 ルナ": ["ジャンボハンマー3", "バルカンシード3", "ベルセルクソード3", "タイボクザン", "ドラゴンスカイSP", "オヒュカスクイーンSP"],
  牛島ゴン太: ["フリーズナックル", "カウントボム3", "モアイフォール2", "モエリング3", "レオキングダムSP", "オックスファイアSP"],
  "最小院 キザマロ": ["トリップソング", "マジクリスタル3", "グラビティステージ", "キャンサーバブルSP", "ウルフフォレストSP", "クラウンサンダーSP"],
  "LM・シン": ["レーダーミサイル3", "インビジブル", "リカバリー300", "ペガサスマジックSP", "レオキングダムSP", "ドラゴンスカイSP"],
  ボクタイ: ["タイヨウジュウＶ３", "アンコクケンＶ３", "アーシュラＶ３", "トーベＶ３", "オトフリートＶ３", "リザＶ３"],
};

const UNIQUE_BROTHER_NAMES = new Set([...NAMES_BY_KIND.story, "LM・シン"]);

export const MMSF1_BROTHER_KIND_SELECT_OPTIONS = MMSF1_BROTHER_KIND_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export const MMSF1_BROTHER_NAMES = Object.values(NAMES_BY_KIND).flat();

export function getMmsf1BrotherKindLabel(kind: BrotherKind) {
  return MMSF1_BROTHER_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? "ゲーム内ブラザー";
}

export function getMmsf1BrotherKindByName(name: string): BrotherKind | null {
  const trimmedName = name.trim();

  for (const [kind, names] of Object.entries(NAMES_BY_KIND) as [BrotherKind, string[]][]) {
    if (names.includes(trimmedName)) {
      return kind;
    }
  }

  return null;
}

export function getMmsf1BrotherForcedVersion(name: string, currentVersion: Mmsf1MainVersionId): Mmsf1BrotherVersionValue | null {
  const trimmedName = name.trim();

  if (NAMES_BY_KIND.story.includes(trimmedName)) {
    return currentVersion;
  }

  if (trimmedName === "LM・シン") {
    return "LM・シン";
  }

  if (trimmedName === "ボクタイ") {
    return "boktai";
  }

  return REAL_BROTHER_VERSION_BY_NAME[trimmedName] ?? null;
}

export function getMmsf1BrotherVersionLabel(version: string) {
  if (version === "LM・シン") {
    return "LM・シン";
  }

  if (version === "boktai") {
    return "ボクタイ";
  }

  return VERSION_LABELS[version as VersionId] ?? version;
}

export function getMmsf1BrotherNameOptions(kind: BrotherKind) {
  return (NAMES_BY_KIND[kind] ?? []).map((name) => ({ value: name, label: name }));
}

export function getDefaultMmsf1BrotherName(kind: BrotherKind) {
  const names = NAMES_BY_KIND[kind] ?? [];
  return names.length === 1 ? names[0] : "";
}

export function normalizeMmsf1BrotherProfile(entry: BrotherProfile, currentVersion: Mmsf1MainVersionId): BrotherProfile {
  const name = entry.name.trim();
  const kind = getMmsf1BrotherKindByName(name) ?? entry.kind ?? "story";
  const forcedVersion = getMmsf1BrotherForcedVersion(name, currentVersion);
  const fixedFavoriteCards = FIXED_FAVORITE_CARDS_BY_NAME[name] ?? null;

  return {
    ...entry,
    name,
    kind,
    rezonCard: forcedVersion ?? (entry.rezonCard ?? ""),
    favoriteCards: fixedFavoriteCards ? [...fixedFavoriteCards] : entry.favoriteCards,
  };
}

export function isMmsf1UniqueBrotherName(name: string) {
  return UNIQUE_BROTHER_NAMES.has(name.trim());
}

export function getMmsf1BrotherFixedFavoriteCards(name: string) {
  return [...(FIXED_FAVORITE_CARDS_BY_NAME[name.trim()] ?? [])];
}

export function isMmsf1BrotherFavoriteCardsLocked(name: string) {
  return name.trim() in FIXED_FAVORITE_CARDS_BY_NAME;
}

export function getDuplicateMmsf1UniqueBrotherNames(entries: BrotherProfile[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const entry of entries) {
    const name = entry.name.trim();
    if (!isMmsf1UniqueBrotherName(name)) {
      continue;
    }

    if (seen.has(name)) {
      duplicates.add(name);
      continue;
    }

    seen.add(name);
  }

  return [...duplicates];
}
