import type { BuildCardEntry, VersionId } from "@/lib/types";
import { createId, normalizeToken, uniqueStrings } from "@/lib/utils";

type Mmsf2AbilityVersion = Extract<VersionId, "berserker" | "shinobi" | "dinosaur">;

type RawMmsf2AbilityOption = {
  id: string;
  name: string;
  cost: number;
  maxCount: number;
  sources: string[];
  effect: string;
  version: Mmsf2AbilityVersion | null;
};

export type Mmsf2AbilityOption = RawMmsf2AbilityOption & {
  label: string;
};

export const MMSF2_ABILITY_SOURCE_URL = "http://wily.xrea.jp/rockman/ryusei/ryusei2/item.htm#ability-wave";

const RAW_MMSF2_ABILITY_OPTIONS = String.raw`ＨＰ＋５０|80|ドンブラー湖１の電波（固定、赤いカニの下を掘る）\nヤエバリゾートの電波（レスキューボーナス）\nグルメタウンの電波（レスキューボーナス）\nゲレンデ１の電波（ランダム）\nゲレンデ２の電波（ランダム）\nドンブラー村の電波（ランダム）|最大ＨＰを５０増加|
ＨＰ＋５０|70|コダマタウンの電波（レスキューボーナス）\nリゾートホテルの電波（レスキューボーナス）\nゲレンデ１の電波（レスキューボーナス）\nゲレンデ２の電波（ランダム）|最大ＨＰを５０増加|
ＨＰ＋５０|60|びじゅつかんの電波（レスキューボーナス）\nスウィートルームの電波（レスキューボーナス）\nスバルのリビングの電波（レスキューボーナス）\nいいんちょうのへやの電波（レスキューボーナス）\nゴン太のへやの電波（レスキューボーナス）\nキザマロのへやの電波（レスキューボーナス）|最大ＨＰを５０増加|
ＨＰ＋５０|50|びじゅつかんの電波（レスキューボーナス）\nコダマタウンの電波（レスキューボーナス）|最大ＨＰを５０増加|
ＨＰ＋１００|150|ゴン太のへやの電波（ランダム）\nびじゅつかんの電波（ランダム）\nコダマタウンのスカイウェーブ（ランダム）\nドンブラー村のスカイウェーブ（ランダム）\nナンスカの電波（ランダム）|最大ＨＰを１００増加|
ＨＰ＋１００|135|ドンブラー湖１の電波（レスキューボーナス）\nドンブラー湖２の電波（固定、５つの石のある広場の左端を掘る）\nえいがかんの電波（レスキューボーナス）\nドンブラー村の電波（レスキューボーナス）\nドッシーのいりえの電波（レスキューボーナス）|最大ＨＰを１００増加|
ＨＰ＋１００|115|ナンスカいせき２の電波（レスキューボーナス）|最大ＨＰを１００増加|
ＨＰ＋１００|100|ナンスカの電波（レスキューボーナス）|最大ＨＰを１００増加|
ＨＰ＋２００|240|てんぼうだいの電波\n（そうがんきょうの電波で、デンパ君に\n「ＨＰ＋５０／８０」を渡した後）\nナンスカのスカイウェーブ（ランダム）\nナンスカいせき１の電波（ランダム）\nナンスカいせき２の電波（ランダム）|最大ＨＰを２００増加|
ＨＰ＋２００|225|人助け：「滑田　アイ」|最大ＨＰを２００増加|
ＨＰ＋２００|205|ナンスカのスカイウェーブ（レスキューボーナス）|最大ＨＰを２００増加|
ＨＰ＋２００|190|ナンスカのスカイウェーブ（レスキューボーナス）|最大ＨＰを２００増加|
ＨＰ＋３００|360|バミューダラビリンス（ランダム）\nムーたいりく（ランダム）\n裏コダマタウンの電波（ランダム）\n人助け：「オオゴワレ　マスヨ」|最大ＨＰを３００増加|
ＨＰ＋３００|330|ムーたいりく（レスキューボーナス）\nへいしの間（レスキューボーナス）|最大ＨＰを３００増加|
ＨＰ＋３００|300|裏コダマタウンの電波（レスキューボーナス）\n裏ＴＫタワー２の電波（レスキューボーナス）\n裏ドッシーのいりえの電波（レスキューボーナス）|最大ＨＰを３００増加|
ＨＰ＋３００|270|裏ドッシーのいりえの電波（固定）\n裏コダマタウンの電波（レスキューボーナス）\nじげんのハザマ１（レスキューボーナス）\n裏ナンスカのちじょうえの電波（レスキューボーナス）|最大ＨＰを３００増加|
ＨＰ＋４００|420|ムーたいりく（固定）\n裏ナンスカいせき２の電波（ランダム）|最大ＨＰを４００増加|
ＨＰ＋４００|400|裏コダマタウンの電波（レスキューボーナス）\nじげんのハザマ１（レスキューボーナス）\n裏ゲレンデ２の電波（レスキューボーナス）\n裏ナンスカのちじょうえの電波（レスキューボーナス）\n裏ドッシーのいりえの電波（レスキューボーナス）\n裏ナンスカいせき２の電波（レスキューボーナス）|最大ＨＰを４００増加|
ＨＰ＋４００|380|じげんのハザマ２（レスキューボーナス）|最大ＨＰを４００増加|
ＨＰ＋４００|360|じげんのハザマ２（レスキューボーナス）|最大ＨＰを４００増加|
ＨＰ＋５００|500|人助け：「牛島　ゴン太」|最大ＨＰを５００増加|
ＨＰ＋５００|460|じげんのハザマ２（レスキューボーナス）|最大ＨＰを５００増加|
ＨＰ＋５００|430|じげんのハザマ２（レスキューボーナス）|最大ＨＰを５００増加|
ＨＰ＋５００|300|暗号メール|最大ＨＰを５００増加|
アンダーシャツ|60|リゾートホテルの電波（固定）\nスウィートルームの電波（ランダム）\nゲレンデ１の電波（ランダム）|残りＨＰ以上のダメージを受けても、\nＨＰ１で耐える|
アンダーシャツ|50|コダマタウンの電波（レスキューボーナス）\nスバルのリビングの電波（レスキューボーナス）\nいいんちょうのへやの電波（レスキューボーナス）|残りＨＰ以上のダメージを受けても、\nＨＰ１で耐える|
アンダーシャツ|20|ドンブラー湖１の電波（レスキューボーナス）\nドンブラー湖２の電波（レスキューボーナス）\nドンブラー村の電波（レスキューボーナス）|残りＨＰ以上のダメージを受けても、\nＨＰ１で耐える|
アンダーシャツ|5|暗号メール|残りＨＰ以上のダメージを受けても、\nＨＰ１で耐える|
ファーストバリア|45|オシャレタンスの電波（固定）|バトルの最初からバリアを張った状態で\n戦闘開始する|
ファーストバリア|40|ショッピングプラザの電波（レスキューボーナス）\nドンブラー湖２の電波（レスキューボーナス）\nドンブラー村の電波（レスキューボーナス）\nドッシーのいりえの電波（レスキューボーナス）|バトルの最初からバリアを張った状態で\n戦闘開始する|
ファーストバリア|35||バトルの最初からバリアを張った状態で\n戦闘開始する|
ファーストバリア|30|ナンスカいせき２の電波（レスキューボーナス）|バトルの最初からバリアを張った状態で\n戦闘開始する|
フロートシューズ|240|クックドゥドゥルドゥの電波（固定）\nドンブラー湖２の電波\n（固定、ブラキオ・ウェーブと戦った広場の真ん中を掘る）|パネルの影響を受けない|
フロートシューズ|210|ドンブラー村のスカイウェーブ（レスキューボーナス）|パネルの影響を受けない|
フロートシューズ|190|コダマタウンのスカイウェーブ（レスキューボーナス）\nドンブラー村のスカイウェーブ（レスキューボーナス）\nナンスカのスカイウェーブ（レスキューボーナス）|パネルの影響を受けない|
リフレクト|280|バミューダラビリンス（固定）|ガードしたときに攻撃を少しだけ跳ね返す|
リフレクト|250|ムーたいりく（レスキューボーナス）|ガードしたときに攻撃を少しだけ跳ね返す|
リフレクト|210|裏ドンブラー湖の電波（レスキューボーナス）\n裏ＴＫタワー２の電波（レスキューボーナス）\n裏ドッシーのいりえの電波（レスキューボーナス）|ガードしたときに攻撃を少しだけ跳ね返す|
リフレクト|160|裏ドンブラー湖の電波（レスキューボーナス）\n裏ＴＫタワー２の電波（レスキューボーナス）|ガードしたときに攻撃を少しだけ跳ね返す|
スーパーアーマー|600|じげんのハザマ２（固定）|攻撃を受けたときにのけぞらなくなる|
メガクラス＋１|340|でんりゅうイワの電波（固定）\nしょくだいの電波（固定）\nナンスカいせき２の電波（固定）|フォルダに入れられるメガクラスバトルカードの\n枚数を１枚増やす|
メガクラス＋１|300|ドンブラー村のスカイウェーブ（レスキューボーナス）\nナンスカのスカイウェーブ（レスキューボーナス）|フォルダに入れられるメガクラスバトルカードの\n枚数を１枚増やす|
メガクラス＋１|260|裏ナンスカいせき２の電波（固定）\nムーたいりく（レスキューボーナス）|フォルダに入れられるメガクラスバトルカードの\n枚数を１枚増やす|
メガクラス＋１|170|暗号メール|フォルダに入れられるメガクラスバトルカードの\n枚数を１枚増やす|
ギガクラス＋１|500|モンショウの電波（固定）|フォルダに入れられるギガクラスバトルカードの\n枚数を１枚増やす|
ギガクラス＋１|460|じげんのハザマ２（レスキューボーナス）|フォルダに入れられるギガクラスバトルカードの\n枚数を１枚増やす|
ギガクラス＋１|440|じげんのハザマ２（レスキューボーナス）|フォルダに入れられるギガクラスバトルカードの\n枚数を１枚増やす|
ギガクラス＋１|250|暗号メール|フォルダに入れられるギガクラスバトルカードの\n枚数を１枚増やす|
チャージＶ|90|ロッポンドーヒルズの電波（キズナノトビラ１００）|チャージショットがヒットすると、\nその斜め後方にも誘爆する|
チャージＶ|80|ドンブラー湖１の電波（レスキューボーナス）\nドンブラー村の電波（レスキューボーナス）\nドッシーのいりえの電波（レスキューボーナス）|チャージショットがヒットすると、\nその斜め後方にも誘爆する|
チャージＶ|70||チャージショットがヒットすると、\nその斜め後方にも誘爆する|
チャージＶ|50|ナンスカちじょうえの電波（レスキューボーナス）|チャージショットがヒットすると、\nその斜め後方にも誘爆する|
チャージクロス|150|キャンサー・バブルの初戦に勝つ|チャージショットがヒットすると、\nその斜め前後にも誘爆する|
チャージクロス|130|ドンブラー湖２の電波（レスキューボーナス）\nドンブラー村の電波（レスキューボーナス）\nドッシーのいりえの電波（レスキューボーナス）|チャージショットがヒットすると、\nその斜め前後にも誘爆する|
チャージクロス|110|ナンスカの電波（レスキューボーナス）|チャージショットがヒットすると、\nその斜め前後にも誘爆する|
チャージＳ|180|裏ナンスカのちじょうえの電波（レスキューボーナス）\n裏ドッシーのいりえの電波（レスキューボーナス）|チャージショットがヒットすると、\nその周囲１マスにも誘爆する|
チャージＳ|160||チャージショットがヒットすると、\nその周囲１マスにも誘爆する|
チャージＳ|140|じげんのハザマ２（レスキューボーナス）\nナンスカいせき１の電波（レスキューボーナス）\nナンスカいせき２の電波（レスキューボーナス）|チャージショットがヒットすると、\nその周囲１マスにも誘爆する|
チャージグリーン|170|ナンスカのスカイウェーブ（レスキューボーナス）|チャージショットをヒットさせると、\nその場所をクサムラパネルにする|
チャージグリーン|150|ナンスカのスカイウェーブ（レスキューボーナス）|チャージショットをヒットさせると、\nその場所をクサムラパネルにする|
チャージグリーン|100|へいしの間（レスキューボーナス）|チャージショットをヒットさせると、\nその場所をクサムラパネルにする|
チャージアイス|170|オウのカンムリの電波：デンパくんから購入|チャージショットをヒットさせると、\nその場所を１／２の確率でアイスパネルにする|
チャージアイス|160|てんくうのだいかいだん（レスキューボーナス）|チャージショットをヒットさせると、\nその場所を１／２の確率でアイスパネルにする|
チャージアイス|130|裏ゲレンデ２の電波（レスキューボーナス）\n裏ナンスカのちじょうえの電波（レスキューボーナス）\n裏ＴＫタワー２の電波（レスキューボーナス）|チャージショットをヒットさせると、\nその場所を１／２の確率でアイスパネルにする|
チャージアイス|110|裏ゲレンデ２の電波（固定）|チャージショットをヒットさせると、\nその場所を１／２の確率でアイスパネルにする|
チャージＰ|150|フランクフルトやの電波：電波商人から購入|チャージショットをヒットさせると、\n１／２の確率でマヒさせ、かつその場所を\nパラライズパネルにする|
チャージＰ|140|ナンスカいせき１の電波（レスキューボーナス）|チャージショットをヒットさせると、\n１／２の確率でマヒさせ、かつその場所を\nパラライズパネルにする|
チャージＰ|110|ドンブラー村のスカイウェーブ（レスキューボーナス）|チャージショットをヒットさせると、\n１／２の確率でマヒさせ、かつその場所を\nパラライズパネルにする|
チャージＰ|50|暗号メール|チャージショットをヒットさせると、\n１／２の確率でマヒさせ、かつその場所を\nパラライズパネルにする|
チャージゼツエン|150|人助け：「シズム・オボレルノ」|チャージショットをヒットさせると、\nその場所をゼツエンパネルにする|
チャージゼツエン|140|コダマタウンのスカイウェーブ（レスキューボーナス）\nドンブラー村のスカイウェーブ（レスキューボーナス）|チャージショットをヒットさせると、\nその場所をゼツエンパネルにする|
チャージゼツエン|120|ムーたいりく（レスキューボーナス）\nへいしの間（レスキューボーナス）|チャージショットをヒットさせると、\nその場所をゼツエンパネルにする|
チャージゼツエン|90|ムーたいりく（レスキューボーナス）\nへいしの間（レスキューボーナス）|チャージショットをヒットさせると、\nその場所をゼツエンパネルにする|
チャージポイズン|220|オリヒメのアジトの電波：御簾を調べると|チャージショットをヒットさせると、\nその場所を毒沼パネルにする|
チャージポイズン|200|じげんのハザマ１（レスキューボーナス）\n裏ＴＫタワー２の電波（レスキューボーナス）|チャージショットをヒットさせると、\nその場所を毒沼パネルにする|
チャージポイズン|180|じげんのハザマ２（レスキューボーナス）|チャージショットをヒットさせると、\nその場所を毒沼パネルにする|
チャージポイズン|70|暗号メール|チャージショットをヒットさせると、\nその場所を毒沼パネルにする|
イナズマケン|30|初期装備|バトルの最初からサンダーベルセルクに\n変身して戦闘開始する|berserker
フウマシュリケン|30|初期装備|バトルの最初からグリーンシノビに\n変身して戦闘開始する|shinobi
キョウリュウセキ|30|初期装備|バトルの最初からファイアダイナソーに\n変身して戦闘開始する|dinosaur
ファーストオーラ|250|じげんのハザマ２\n（ブライＳＸに勝つと開く扉）|バトルの最初からオーラを張った状態で\n戦闘開始する|
オートロックオン|600|じげんのハザマ２|常にロックオンをしている状態になる|
サイドセレクト|600|じげんのハザマ２|カスタム画面でカードを横並びでも選べるようになる|
クイックゲージ|500|じげんのハザマ１\n（左の四角い場所の隅に見えない通路があり、その先）\n（要オープンロック）|カスタムゲージの溜まる速度が速くなる|
ユーモアワード|1|ドンブラー村\nキズナリョクが５００以上の時に\nアイスクリーム屋の人に話しかけるともらえる|装備するとＬボタンでウォーロックと会話する内容が\nおもしろくなる|
ユーモアバスター|1|イヌごやの電波：電波商人から購入|装備するとロックバスターの音が犬の鳴き声になる\n通常弾：ワン！　チャージショット：バウ！！|`;

function buildAbilityDisplayLabel(name: string, cost: number) {
  return `${name}/${cost}`;
}

function matchesVersion(option: Pick<RawMmsf2AbilityOption, "version">, version?: VersionId) {
  if (!option.version || !version) {
    return true;
  }

  return option.version === version;
}

function getOptionsByName(name: string, version?: VersionId) {
  const options = abilityByNormalizedName.get(normalizeToken(name)) ?? [];
  return options.filter((option) => matchesVersion(option, version));
}

function getMmsf2VersionDefaultAbilityName(version?: VersionId) {
  switch (version) {
    case "berserker":
      return "イナズマケン";
    case "shinobi":
      return "フウマシュリケン";
    case "dinosaur":
      return "キョウリュウセキ";
    default:
      return null;
  }
}

function isMmsf2VersionDefaultAbilityName(name: string) {
  return name === "イナズマケン" || name === "フウマシュリケン" || name === "キョウリュウセキ";
}

const rawAbilityOptions: RawMmsf2AbilityOption[] = RAW_MMSF2_ABILITY_OPTIONS.split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line, index) => {
    const [name, rawCost, rawSource, rawEffect, rawVersion = ""] = line.split("|");
    return {
      id: `mmsf2-ability-${String(index + 1).padStart(3, "0")}`,
      name,
      cost: Number(rawCost),
      maxCount: 1,
      sources: rawSource ? [rawSource.replace(/\\n/g, "\n")] : [],
      effect: rawEffect.replace(/\\n/g, "\n"),
      version: (rawVersion || null) as Mmsf2AbilityVersion | null,
    };
  });

export const MMSF2_ABILITY_OPTIONS = rawAbilityOptions.map((entry) => ({
  ...entry,
  label: buildAbilityDisplayLabel(entry.name, entry.cost),
}));

export const MMSF2_ABILITY_NAMES = uniqueStrings(MMSF2_ABILITY_OPTIONS.map((option) => option.name));

const abilityByLabel = new Map<string, Mmsf2AbilityOption>();
const abilityByNormalizedLabel = new Map<string, Mmsf2AbilityOption>();
const abilityByNormalizedName = new Map<string, Mmsf2AbilityOption[]>();
const abilityByNameAndCost = new Map<string, Mmsf2AbilityOption>();

for (const option of MMSF2_ABILITY_OPTIONS) {
  abilityByLabel.set(option.label, option);
  abilityByLabel.set(`${option.name}/${option.cost}`, option);
  abilityByNormalizedLabel.set(normalizeToken(option.label), option);

  const normalizedName = normalizeToken(option.name);
  const byName = abilityByNormalizedName.get(normalizedName) ?? [];
  byName.push(option);
  abilityByNormalizedName.set(normalizedName, byName);
  abilityByNameAndCost.set(`${normalizedName}::${option.cost}`, option);
}

for (const options of abilityByNormalizedName.values()) {
  options.sort((left, right) => left.cost - right.cost);
}

export function getMmsf2AbilityByLabel(label: string, version?: VersionId) {
  const trimmed = label.trim();
  if (!trimmed) {
    return null;
  }

  const directMatch = abilityByLabel.get(trimmed) ?? abilityByNormalizedLabel.get(normalizeToken(trimmed));
  if (!directMatch) {
    return getOptionsByName(trimmed, version)[0] ?? null;
  }

  return matchesVersion(directMatch, version) ? directMatch : null;
}

export function getMmsf2AbilityByNameAndCost(name: string, cost: number, version?: VersionId) {
  const option = abilityByNameAndCost.get(`${normalizeToken(name.trim())}::${cost}`) ?? null;
  return option && matchesVersion(option, version) ? option : null;
}

export function getMmsf2AbilityNameSuggestions(version?: VersionId) {
  return MMSF2_ABILITY_OPTIONS.filter((option) => matchesVersion(option, version)).map((option) => option.label);
}

export function getMmsf2AbilityPointLimit(kokouNoKakera: boolean) {
  return kokouNoKakera ? 400 : 1300;
}

export function getMmsf2VersionDefaultAbilityLabel(version?: VersionId) {
  const defaultName = getMmsf2VersionDefaultAbilityName(version);
  return defaultName ? getOptionsByName(defaultName, version)[0]?.label ?? null : null;
}

export function isMmsf2VersionDefaultAbility(label: string, version?: VersionId) {
  const ability = getMmsf2AbilityByLabel(label, version);
  return ability ? ability.name === getMmsf2VersionDefaultAbilityName(version) : false;
}

export function getMmsf2AbilitySources(label: string, version?: VersionId) {
  return getMmsf2AbilityByLabel(label, version)?.sources ?? [];
}

export function normalizeMmsf2AbilityEntry(entry: BuildCardEntry, version?: VersionId): BuildCardEntry {
  const rawName = entry.name.trim();
  const byLabel = getMmsf2AbilityByLabel(rawName, version);

  if (byLabel) {
    return { ...entry, name: byLabel.label, quantity: byLabel.cost };
  }

  const byNameAndCost = getMmsf2AbilityByNameAndCost(rawName, entry.quantity, version);
  if (byNameAndCost) {
    return { ...entry, name: byNameAndCost.label, quantity: byNameAndCost.cost };
  }

  const byName = getOptionsByName(rawName, version);
  if (byName.length > 0) {
    return { ...entry, name: byName[0].label, quantity: byName[0].cost };
  }

  return entry;
}

export function normalizeMmsf2AbilityEntries(entries: BuildCardEntry[], version?: VersionId, defaultTribeAbilityEnabled = false) {
  const normalizedEntries = entries.map((entry) => normalizeMmsf2AbilityEntry(entry, version));
  const defaultAbilityName = getMmsf2VersionDefaultAbilityName(version);
  const keptEntries = normalizedEntries.filter((entry) => {
    const abilityName = getMmsf2AbilityByLabel(entry.name, version)?.name ?? entry.name.trim();
    return !isMmsf2VersionDefaultAbilityName(abilityName) || abilityName === defaultAbilityName;
  });

  if (!defaultAbilityName) {
    return keptEntries;
  }

  const existingDefaultEntry = keptEntries.find((entry) => getMmsf2AbilityByLabel(entry.name, version)?.name === defaultAbilityName);
  const nonDefaultEntries = keptEntries.filter((entry) => getMmsf2AbilityByLabel(entry.name, version)?.name !== defaultAbilityName);
  if (!defaultTribeAbilityEnabled) {
    return existingDefaultEntry ? [existingDefaultEntry, ...nonDefaultEntries] : nonDefaultEntries;
  }

  const defaultAbility = getOptionsByName(defaultAbilityName, version)[0];
  if (!defaultAbility) {
    return nonDefaultEntries;
  }

  return [
    existingDefaultEntry ?? {
      id: createId(),
      name: defaultAbility.label,
      quantity: defaultAbility.cost,
      notes: "",
      isRegular: false,
    },
    ...nonDefaultEntries,
  ];
}

export function getMmsf2AbilitySelectionErrors(
  entries: BuildCardEntry[],
  kokouNoKakera: boolean,
  version?: VersionId,
  defaultTribeAbilityEnabled = false,
) {
  const selectedEntries = normalizeMmsf2AbilityEntries(entries, version, defaultTribeAbilityEnabled).filter((entry) => entry.name.trim());
  const errors: string[] = [];
  const unknownEntries = selectedEntries.filter((entry) => !getMmsf2AbilityByLabel(entry.name, version));
  const totalCost = selectedEntries.reduce((sum, entry) => sum + (Number.isFinite(entry.quantity) ? entry.quantity : 0), 0);
  const limit = getMmsf2AbilityPointLimit(kokouNoKakera);

  if (unknownEntries.length > 0) {
    errors.push("未対応のアビリティ項目があります。");
  }

  if (totalCost > limit) {
    errors.push(`アビリティの合計Pは ${limit} 以下にしてください。`);
  }

  return { errors, totalCost, limit };
}

export function getMmsf2AbilityOptionsForSlot(entries: BuildCardEntry[], index: number, version?: VersionId) {
  const currentLabel = entries[index]?.name.trim() ?? "";
  const selectedCounts = new Map<string, number>();

  entries.forEach((entry, entryIndex) => {
    const label = entry.name.trim();
    if (!label || entryIndex === index || label === currentLabel) {
      return;
    }

    selectedCounts.set(label, (selectedCounts.get(label) ?? 0) + 1);
  });

  return MMSF2_ABILITY_OPTIONS.filter((option) => {
    if (!matchesVersion(option, version)) {
      return false;
    }

    return (selectedCounts.get(option.label) ?? 0) < option.maxCount;
  });
}
