import type { GameId, VersionId, VersionRuleSet } from "@/lib/types";

export const GAME_LABELS: Record<GameId, string> = {
  mmsf1: "流星のロックマン1",
  mmsf2: "流星のロックマン2",
  mmsf3: "流星のロックマン3",
};

export const VERSION_LABELS: Record<VersionId, string> = {
  pegasus: "ペガサス",
  leo: "レオ",
  dragon: "ドラゴン",
  berserker: "ベルセルク",
  shinobi: "シノビ",
  dinosaur: "ダイナソー",
  "black-ace": "ブラックエース",
  "red-joker": "レッドジョーカー",
};

export const VERSIONS_BY_GAME: Record<GameId, VersionId[]> = {
  mmsf1: ["pegasus", "leo", "dragon"],
  mmsf2: ["berserker", "shinobi", "dinosaur"],
  mmsf3: ["black-ace", "red-joker"],
};

export const VERSION_RULES: Record<VersionId, VersionRuleSet> = {
  pegasus: {
    game: "mmsf1",
    version: "pegasus",
    label: "ペガサス",
    description: "流星1の氷・飛行寄り版。ウォーロック装備とブラザーバンド情報を中心に管理する。",
    folderLimit: 30,
    notes: ["ウォーロック装備は1つだけ選択。", "クロスブラザーバンド由来のメモ欄を持つ。"],
    limits: {},
    accent: { from: "#67e8f9", to: "#818cf8" },
  },
  leo: {
    game: "mmsf1",
    version: "leo",
    label: "レオ",
    description: "流星1の炎寄り版。版差メモとウォーロック装備を明示する。",
    folderLimit: 30,
    notes: ["ウォーロック装備は1つだけ選択。", "ブラザーバンドはゲーム内・リアルの両方をメモできる。"],
    limits: {},
    accent: { from: "#fb7185", to: "#f97316" },
  },
  dragon: {
    game: "mmsf1",
    version: "dragon",
    label: "ドラゴン",
    description: "流星1の電気寄り版。版差メモとクロスブラザーバンド情報を残せる。",
    folderLimit: 30,
    notes: ["ウォーロック装備は1つだけ選択。", "カード・入手元・戦法を共通管理する。"],
    limits: {},
    accent: { from: "#facc15", to: "#38bdf8" },
  },
  berserker: {
    game: "mmsf2",
    version: "berserker",
    label: "ベルセルク",
    description: "流星2のトライブ構築を管理する。ブラザー種別とキズナ、ベストコンボを保持する。",
    folderLimit: 30,
    notes: ["ベストコンボ欄を持つ。", "トライブ関連のメモ欄とレジェンド/ブランクカード欄を分離する。"],
    limits: {
      legendCards: 6,
      blankCards: 6,
      waveCommandCards: 6,
    },
    accent: { from: "#f97316", to: "#ef4444" },
  },
  shinobi: {
    game: "mmsf2",
    version: "shinobi",
    label: "シノビ",
    description: "流星2のトライブ構築を管理する。ブラザー種別とキズナ、ベストコンボを保持する。",
    folderLimit: 30,
    notes: ["レジェンドカードとブランクカードの候補を分けて保存する。", "ウォーロック装備と入手元メモを保持する。"],
    limits: {
      legendCards: 6,
      blankCards: 6,
      waveCommandCards: 6,
    },
    accent: { from: "#38bdf8", to: "#22c55e" },
  },
  dinosaur: {
    game: "mmsf2",
    version: "dinosaur",
    label: "ダイナソー",
    description: "流星2のトライブ構築を管理する。トライブ関連とベストコンボを軸に編集する。",
    folderLimit: 30,
    notes: ["キズナ目標値を数値で管理する。", "限定配信ブラザーやオートブラザーのメモも保存できる。"],
    limits: {
      legendCards: 6,
      blankCards: 6,
      waveCommandCards: 6,
    },
    accent: { from: "#84cc16", to: "#f97316" },
  },
  "black-ace": {
    game: "mmsf3",
    version: "black-ace",
    label: "ブラックエース",
    description: "流星3のノイズ・ブラザー・レゾン管理を行う。ブラックエース向けのノイズ傾向を明示する。",
    folderLimit: 30,
    notes: [
      "ホワイトカードは固定セットから選択。",
      "メガカードは最大5枠、ギガカードは最大1枠。",
      "ブライノイズ時はリアルブラザーとライバルノイズを空にする。",
    ],
    limits: {
      megaCards: 5,
      gigaCards: 1,
      brothers: 6,
    },
    accent: { from: "#a855f7", to: "#38bdf8" },
  },
  "red-joker": {
    game: "mmsf3",
    version: "red-joker",
    label: "レッドジョーカー",
    description: "流星3のノイズ・ブラザー・レゾン管理を行う。レッドジョーカー向けのノイズ傾向を明示する。",
    folderLimit: 30,
    notes: [
      "ホワイトカードは固定セットから選択。",
      "メガカードは最大5枠、ギガカードは最大1枠。",
      "チーム人数とレゾン共有メモを分けて保持する。",
    ],
    limits: {
      megaCards: 5,
      gigaCards: 1,
      brothers: 6,
    },
    accent: { from: "#fb7185", to: "#f97316" },
  },
};

export function getDefaultVersionForGame(game: GameId) {
  return VERSIONS_BY_GAME[game][0];
}

export function getVersionRuleSet(version: VersionId) {
  return VERSION_RULES[version];
}
