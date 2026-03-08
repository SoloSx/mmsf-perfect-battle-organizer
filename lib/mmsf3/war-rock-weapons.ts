import type { SearchableSelectOption } from "@/components/searchable-select-input";

type Mmsf3WarRockWeaponEntry = {
  name: string;
  sources: string[];
  tracked?: boolean;
};

const MMSF3_WAR_ROCK_WEAPONS: Mmsf3WarRockWeaponEntry[] = [
  { name: "スルドイキバ", sources: ["初期装備"], tracked: false },
  { name: "タンガロアピアス", sources: ["こものとだなの電脳(固定)"] },
  { name: "カゲシバリノツメ", sources: ["とくせつステージ デンパくんから3000ゼニーで買う"] },
  { name: "クイックリング", sources: ["かんきょうシステムの電脳3(固定)"] },
  { name: "スイリュウノキバ", sources: ["シーサーじょう(固定、要オープンロック)"] },
  { name: "シップウノピアス", sources: ["スピカモール デンパくんから5000ゼニーで買う"] },
  { name: "パラライズウィング", sources: ["WAXAニホンしぶ(固定、要オープンロック)"] },
  { name: "マシンガンクロー", sources: ["きょうたくのノイズ"] },
  {
    name: "ゼニーディサイド",
    sources: ["ニホンのコスモウェーブ1 デンパくんから6000ゼニーで買う"],
  },
  { name: "タイタングローブ", sources: ["クリムゾンマシンの電脳2(固定)"] },
  { name: "センコウノウデワ", sources: ["ノイズウェーブ2(固定)"] },
  { name: "カイザーナックル", sources: ["メテオサーバー3(固定)"] },
  { name: "バグライズクロー", sources: ["暗号コード"] },
  { name: "ゲンワクノヒトミ", sources: ["人助け: 「コレク タロウ」"] },
  { name: "インパクトブレス", sources: ["ブラックホールサーバー2(固定、シリウスを倒すと開く扉の先)"] },
  { name: "コレクターアイ", sources: ["小がたアンテナの電脳(固定)"] },
  { name: "コズミックレイブ", sources: ["ブラックホールサーバー2(全てのRボスを12秒以内で倒すと開く扉の先)"] },
  { name: "ナイトスピリット", sources: ["ノイズウェーブ6(固定)"] },
  { name: "ホワイトファング", sources: ["ノイズウェーブ5(キズナリョク500以上で開く扉の先)"] },
  { name: "ギャクフウノツメ", sources: ["暗号コード"] },
  { name: "デンジャーリング", sources: ["暗号コード"] },
  { name: "エグゼブラスターEX", sources: ["暗号コード"] },
];

const options = MMSF3_WAR_ROCK_WEAPONS.map((item) => ({
  value: item.name,
  label: item.name,
})) satisfies SearchableSelectOption[];

const sourcesByName = new Map(MMSF3_WAR_ROCK_WEAPONS.map((item) => [item.name, item.sources] as const));
const trackedByName = new Map(MMSF3_WAR_ROCK_WEAPONS.map((item) => [item.name, item.tracked !== false] as const));

export const MMSF3_WAR_ROCK_WEAPON_OPTIONS = options;

export function getMmsf3WarRockWeaponSources(name: string) {
  return [...(sourcesByName.get(name.trim()) ?? [])];
}

export function isMmsf3WarRockWeapon(name: string) {
  return sourcesByName.has(name.trim());
}

export function isMmsf3WarRockWeaponSourceTracked(name: string) {
  return trackedByName.get(name.trim()) ?? false;
}
