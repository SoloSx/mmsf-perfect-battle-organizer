type Mmsf1WarRockWeaponEntry = {
  name: string;
  sources: string[];
};

const MMSF1_WAR_ROCK_WEAPONS: Mmsf1WarRockWeaponEntry[] = [
  { name: "スルドイキバ", sources: ["初期装備"] },
  { name: "ヒキサクツメ", sources: ["かがくかんの電波"] },
  { name: "ヤマアラシノハリ", sources: ["暗号メール"] },
  { name: "ベアーリング", sources: ["キザマロのへやの電波"] },
  { name: "コブラノキバ", sources: ["ぎじうちゅう: ビジライザーをかけると見えるナビから 2000ゼニーで買う"] },
  { name: "フラッシュアイ", sources: ["しょうめんげんかんの電波"] },
  { name: "ハヤテノウデワ", sources: ["1-Aの電脳: 「シンクロフック2」と交換"] },
  { name: "パワーリング", sources: ["BIGWAVE: BIGWAVEの電波からレジの中に入り、サーフボードを調べる"] },
  { name: "アクマノヒトミ", sources: ["暗号メール"] },
  { name: "マシンガンクロー", sources: ["5-Aの電脳: プログラム君から 4000ゼニーで買う"] },
  { name: "パラライザー", sources: ["103デパートおくじょうの電波"] },
  { name: "バブルハンド", sources: ["暗号メール"] },
  { name: "ハンマーグローブ", sources: ["ごみしょりじょうの電脳"] },
  { name: "ゼニーサーチング", sources: ["103デパート屋上: 亜熱帯展のチケット販売機を調べる"] },
  { name: "コレクトバイザー", sources: ["うちゅうふくの電脳"] },
  { name: "ゲンワクノカオリ", sources: ["ステーションの電脳2"] },
  { name: "カイザーナックル", sources: ["うちゅうくうかんの電波3: 「こどくのココロ」で開く扉から来たところ"] },
  { name: "マジックブレス", sources: ["暗号メール"] },
  { name: "エグゼブラスター", sources: ["ダブルスロットのエグゼイベントで入手"] },
  { name: "ＦＭブレスレット", sources: ["ボクタイ"] },
  { name: "リュウセイパワー", sources: ["ボクタイ"] },
];

const sourcesByName = new Map(MMSF1_WAR_ROCK_WEAPONS.map((item) => [item.name, item.sources] as const));

export const MMSF1_WAR_ROCK_WEAPON_NAMES = MMSF1_WAR_ROCK_WEAPONS.map((item) => item.name);

export function getMmsf1WarRockWeaponSources(name: string) {
  return [...(sourcesByName.get(name.trim()) ?? [])];
}

export function isMmsf1WarRockWeapon(name: string) {
  return sourcesByName.has(name.trim());
}
