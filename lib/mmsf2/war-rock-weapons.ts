type Mmsf2WarRockWeaponEntry = {
  name: string;
  sources: string[];
};

const MMSF2_WAR_ROCK_WEAPONS: Mmsf2WarRockWeaponEntry[] = [
  { name: "スルドイキバ", sources: ["初期装備"] },
  { name: "クイックリング", sources: ["あんごうメール: 「アイサツがわりに ウェーブバトルだ!!」"] },
  { name: "タンガロアピアス", sources: ["リゾートホテル(青)"] },
  { name: "コブラノキバ", sources: ["ユキダルマの電波(青)"] },
  { name: "バーストグローブ", sources: ["びじゅつかんの電波"] },
  { name: "フラッシュアイ", sources: ["ドンブラー村の電波: キズナ力350以上の扉(青)"] },
  { name: "ゼファーウィング", sources: ["ドッシーのいりえ: 滝の裏辺り"] },
  { name: "バブルハンド", sources: ["コダマタウンのスカイウェーブ(紫)"] },
  { name: "ミラージュアイ", sources: ["あんごうメール: 「クーッロウォ」"] },
  { name: "マシンガンクロー", sources: ["こだいトンボの電波(青)"] },
  { name: "ゼニーサーチング", sources: ["ナンスカちじょうえの電波: 壁のハンバーガー"] },
  { name: "パラライザー", sources: ["ナンスカちじょうえの電波(青)"] },
  { name: "タイタングローブ", sources: ["ムーのぞうの電波(青)"] },
  { name: "ホワイトブレス", sources: ["ムーのぞうの電波", "ショップ: 6000z"] },
  { name: "コレクトバイザー", sources: ["ナンスカちじょうえの電波: 車のような電波君から(キズナリョク350以上)"] },
  { name: "ブラッディクロー", sources: ["あんごうメール: 「スターキャリアーで ロックマンをきょうかしろ!」"] },
  { name: "カイザーナックル", sources: ["ゆりかごの間(青)"] },
  { name: "マジックブレス", sources: ["じげんのハザマ2(青): 全依頼解決で開く扉"] },
  { name: "FMブレスレット", sources: ["じげんのハザマ2(青): Sコンプの扉の先 隠し通路"] },
  { name: "リュウセイパワー", sources: ["ナンスカの電波(青): キズナ力600以上の扉"] },
  { name: "エグゼブラスター", sources: ["エグゼWスロットの日記全て入手後に届く熱斗のメールに添付"] },
];

const sourcesByName = new Map(MMSF2_WAR_ROCK_WEAPONS.map((item) => [item.name, item.sources] as const));

export const MMSF2_WAR_ROCK_WEAPON_NAMES = MMSF2_WAR_ROCK_WEAPONS.map((item) => item.name);

export function getMmsf2WarRockWeaponSources(name: string) {
  return [...(sourcesByName.get(name.trim()) ?? [])];
}

export function isMmsf2WarRockWeapon(name: string) {
  return sourcesByName.has(name.trim());
}
