import { normalizeToken } from "@/lib/utils";
import type { Mmsf3BrotherRoulettePosition, Mmsf3BrotherRouletteSlot, Mmsf3BrotherRouletteSlotType, Mmsf3BrotherVersionId } from "@/lib/types";

export interface Mmsf3RouletteOption {
  value: string;
  label: string;
}

export const DEFAULT_MMSF3_WHITE_CARD_SET_ID = "00";
export const MMSF3_SSS_SLOT_COUNT = 3;
export const MMSF3_BROTHER_ROULETTE_SLOT_TYPE_OPTIONS: Array<{ value: Mmsf3BrotherRouletteSlotType; label: string }> = [
  { value: "brother", label: "ブラザー" },
  { value: "sss", label: "SSS" },
];
export const MMSF3_BROTHER_VERSION_OPTIONS: Array<{ value: Mmsf3BrotherVersionId; label: string }> = [
  { value: "black-ace", label: "ブラックエース" },
  { value: "red-joker", label: "レッドジョーカー" },
];
const MMSF3_SSS_SERVER_NAMES = [
  "オックス",
  "キャンサー",
  "ダイヤ",
  "オヒュカス",
  "クラウン",
  "ブラキオ",
  "ゴート",
  "キグナス",
  "ハープ",
  "クラブ",
  "アポロン",
  "ファントム",
  "レオ",
  "エンプティー",
  "ウルフ",
  "ジェミニ",
  "リブラ",
  "コーヴァス",
  "コンドル",
  "ムーン",
  "スペード",
  "オリガ",
  "ヴァルゴ",
  "ペガサス",
  "エース",
  "アンドロメダ",
  "ブライ",
  "ブルース",
  "ドラゴン",
  "ジョーカー",
  "ラ・ムー",
  "フォルテ",
] as const;

const MMSF3_SSS_GREEK_SERVER_NAMES = [
  "アルファ",
  "ベータ",
  "ガンマ",
  "デルタ",
  "イプシロン",
  "ゼータ",
  "イータ",
  "シータ",
  "イオタ",
  "カッパ",
  "ラムダ",
  "ミュー",
  "ニュー",
  "クサイ",
  "オミクロン",
  "パイ",
  "ロー",
  "シグマ",
  "タウ",
  "ユプシロン",
  "ファイ",
  "カイ",
  "プサイ",
  "オメガ",
] as const;

export const MMSF3_SSS_LEVEL_OPTIONS: Mmsf3RouletteOption[] = [
  ...MMSF3_SSS_SERVER_NAMES.map((name, index) => ({
    value: String(index + 1),
    label: `Lv.${index + 1}: ${name}`,
  })),
  ...MMSF3_SSS_GREEK_SERVER_NAMES.map((name, index) => ({
    value: `G${String(index + 1).padStart(2, "0")}`,
    label: `Lv.${index + 1}: ${name}`,
  })),
];

export const MMSF3_BROTHER_ROULETTE_POSITIONS: Array<{
  key: Mmsf3BrotherRoulettePosition;
  label: string;
}> = [
  { key: "top_left", label: "左上" },
  { key: "top_right", label: "右上" },
  { key: "mid_left", label: "左中" },
  { key: "mid_right", label: "右中" },
  { key: "btm_left", label: "左下" },
  { key: "btm_right", label: "右下" },
];

export const MMSF3_NOISE_OPTIONS: Mmsf3RouletteOption[] = [
  { value: "00", label: "初期" },
  { value: "01", label: "リブラ" },
  { value: "02", label: "コーヴァス" },
  { value: "03", label: "キャンサー" },
  { value: "04", label: "ジェミニ" },
  { value: "05", label: "オヒュカス" },
  { value: "06", label: "キグナス" },
  { value: "07", label: "オックス" },
  { value: "08", label: "ヴァルゴ" },
  { value: "09", label: "クラウン" },
  { value: "0A", label: "ウルフ" },
  { value: "0B", label: "ブライ" },
];

export const MMSF3_BROTHER_ROULETTE_NOISE_OPTIONS = MMSF3_NOISE_OPTIONS.filter((option) => option.value !== "0B");

export const MMSF3_REZON_CARD_OPTIONS: Mmsf3RouletteOption[] = [
  { value: "00", label: "バトル" },
  { value: "01", label: "ファイア" },
  { value: "02", label: "アクア" },
  { value: "03", label: "サンダー" },
  { value: "04", label: "ウッド" },
  { value: "05", label: "ソード" },
  { value: "06", label: "ブレイク" },
  { value: "07", label: "ガード" },
  { value: "08", label: "パラライズ" },
  { value: "09", label: "ファイナライズ" },
];

export const MMSF3_WHITE_CARD_SET_OPTIONS: Mmsf3RouletteOption[] = [
  { value: "00", label: "なし" },
  { value: "01", label: "プラズマガン,プラズマガン,エアスプレッド1,ビートスイング1" },
  { value: "02", label: "ワイドソード,リカバリー30,グランドウェーブ1,バリア" },
  { value: "03", label: "マッドバルカン1,ミニグレネード,ロングソード,キャノン" },
  { value: "04", label: "プラズマガン,インビジブル,グランドウェーブ1,ビーストスイング1" },
  { value: "05", label: "ディバイドライン,ロングソード,マッドバルカン1,リカバリー30" },
  { value: "06", label: "インビジブル,グランドウェーブ1,ソード,マッドバルカン1" },
  { value: "07", label: "ビートスイング1,キャノン,プラズマガン,グラビティプラス" },
  { value: "08", label: "ミニグレネード,ロングソード,ロングソード,リカバリー30" },
  { value: "09", label: "プラズマガン,ワイドソード,グランドウェーブ1,グランドウェーブ1" },
  { value: "0A", label: "エアスプレッド1,マッドバルカン1,ビートスイング1,エアスプレッド1" },
  { value: "0B", label: "フラッシュスピア1,フラッシュスピア1,マッドバルカン1,グラビティプラス" },
  { value: "0C", label: "ビートスイング1,ビートスイング1,エアスプレッド1,アタック+10" },
  { value: "0D", label: "グランドウェーブ1,マッドバルカン1,アタック+10,ビートスイング1" },
  { value: "0E", label: "エアスプレッド2,ワイドウェーブ1,グラビティプラス,ディバイドライン" },
  { value: "0F", label: "ジェットアタック1,ジェットアタック1,グラビティプラス,リカバリー50" },
  { value: "10", label: "ドリルアーム1,ドリルアーム1,アタック+10,ジェットアタック1" },
  { value: "11", label: "ワイドウェーブ1,シャークカッター1,シャークカッター1,ワイドウェーブ1" },
  { value: "12", label: "グランドウェーブ2,ギザホイール1,ギザホイール1,マヒプラス" },
  { value: "13", label: "アイススピニング1,アタック+10,ワイドウェーブ1,ワイドウェーブ1" },
  { value: "14", label: "シャークカッター1,マヒプラス,グラビティプラス,シャークカッター1" },
  { value: "15", label: "エアスプレッド3,プラスキャノン,ギザホイール2,ギザホイール2" },
  { value: "16", label: "エドギリブレード1,エドギリブレード1,ギザホイール2,マヒプラス" },
  { value: "17", label: "バブルフック1,ワイドウェーブ2,マヒプラス,バブルフック1" },
  { value: "18", label: "ビートスイング2,ビートスイング2,ドリルアーム1,プラスキャノン" },
  { value: "19", label: "アンガーファイア1,アンガーファイア1,ヒートアッパー2,ヒートアッパー2" },
  { value: "1A", label: "カウントボム1,ヒートアッパー2,アンガーファイア1,アタック+10" },
  { value: "1B", label: "パウダーシュート1,シュリシュリケン2,ローリングナッツ1,ダミースパイダー1" },
  { value: "1C", label: "ローリングナッツ1,ローリングナッツ1,パウダーシュート1,パウダーシュート1" },
  { value: "1D", label: "フラッシュスピア3,フラッシュスピア3,ステルスレーザー2,イナズマヘッド1" },
  { value: "1E", label: "ステルスレーザー2,マヒプラス,イナズマヘッド1,マミーハンド1" },
  { value: "1F", label: "ドリルアーム3,ハンマーウェポン1,ヘビーキャノン,タイフーンダンス" },
  { value: "20", label: "カウントボム2,マシーンフレイム1,ヒートアッパー3,アンガーファイア2" },
  { value: "21", label: "ビートスイング3,ビートスイング2,ダブルイーター,グレートアックス" },
  { value: "22", label: "ワイドウェーブ3,シャークカッター3,ワイドウェーブ2,シャークカッター3" },
  { value: "23", label: "カウントボム2,ヒートアッパー3,アンガーファイア3,アタックパネル" },
  { value: "24", label: "パウダーシュート3,シュリシュリケン2,ローリングナッツ3,ダミースパイダー3" },
  { value: "25", label: "フラッシュスピア3,イナズマヘッド2,フラッシュスピア3,ステルスレーザー2" },
  { value: "26", label: "ドリルアーム3,ドリルアーム2,マヒプラス,ハンマーウェポン3" },
  { value: "27", label: "ステルスレーザー3,マヒプラス,イナズマヘッド2,マミーハンド3" },
  { value: "28", label: "マシーンフレイム2,ヒートアッパー3,カウントボム3,アンガーファイア3" },
  { value: "29", label: "バブルフック3,バブルフック3,マヒプラス,ワイドウェーブ3" },
  { value: "2A", label: "シュリシュリケン3,ダミースパイダー3,ローリングナッツ3,ウッドスラッシュ" },
  { value: "2B", label: "フラッシュスピア3,ステルスレーザー3,イナズマヘッド3,エレキスラッシュ" },
  { value: "2C", label: "トルネードダンス,ウィンディアタック3,ドリルアーム3,ハンマーウェポン3" },
  { value: "2D", label: "プラズマガン,ステルスレーザー2,マミーハンド1,イナズマヘッド1" },
  { value: "2E", label: "グリーンインク,ダミースパイダー1,シュリシュリケン1,パウダーシュート2" },
  { value: "2F", label: "ホイッスル,ドリルアーム1,ドリルアーム2,ウィンディアタック1" },
  { value: "30", label: "バブルフック1,バブルフック1,フラッシュスピア2,イナズマヘッド2" },
  { value: "31", label: "ブラックインク,フラッシュスピア2,バブルフック1,マミーハンド2" },
  { value: "32", label: "ウィンディアタック1,ウィンディアタック1,ノイズウィザード1,ノイズウィザード2" },
  { value: "33", label: "ギザホイール2,グランドウェーブ2,シュリシュリケン1,アイススピニング1" },
  { value: "34", label: "ヘビーキャノン,ドリルアーム2,ヒートアッパー2,ヘビードーン1" },
  { value: "35", label: "ヒールウィザード1,バブルフック1,エレキスラッシュ,ダミースパイダー1" },
  { value: "36", label: "バリア,キャノン,キャノン,キャノン" },
  { value: "37", label: "ダブルイーター,ホイッスル,ビーストスイング3,グレートアックス" },
  { value: "38", label: "ローリングナッツ2,ローリングナッツ1,マシーンフレイム1,カウントボム3" },
  { value: "39", label: "アイスグレネード,アイスグレネード,シャークカッター2,ワイドウェーブ2" },
  { value: "3A", label: "エドギリブレード3,エドギリブレード3,エドギリブレード2,エドギリブレード1" },
  { value: "3B", label: "シンクロフック1,フリーズナックル,ヒートアッパー3,スタンナックル" },
  { value: "3C", label: "ファイア+30,マシーンフレイム3,アンガーファイア3,オックスファイアV2" },
  { value: "3D", label: "アクア+30,シャークカッター3,バブルフック3,ダイヤアイスバーンV2" },
  { value: "3E", label: "シュリシュリケン3,ワイドウェーブ3,ステルスレーザー3,スマイルコイン3" },
  { value: "3F", label: "マシーンフレイム3,ダバフレイム3,アンガーファイア3,ヒートアッパー3" },
  { value: "40", label: "アイススピニング3,ワイドウェーブ3,シャークカッター3,バブルフック3" },
  { value: "41", label: "スカルアロー3,スカルアロー3,ジェットアタック3,ハンマーウェポン3" },
  { value: "42", label: "ビートスイング3,ビートスイング3,ヒールウィザード3,デスサイズ3" },
  { value: "43", label: "トルネードダンス,エアスプレッド3,バルカンシード3,マッドバルカン3" },
  { value: "44", label: "パニッククラウド,パニッククラウド,フラッシュスピア3,パウダーシュート3" },
  { value: "45", label: "エレキスラッシュ,マミーハンド3,ダミースパイダー3,サンダーオブアース3" },
  { value: "46", label: "マシーンフレイム3,ホワイトメテオ,ヘビードーン3,カウントボム3" },
  { value: "47", label: "ミニグレネード,ソード,ワイドソード,ロングソード" },
  { value: "48", label: "ウィンディアタック3,トルネードダンス,コガラシ3,デスサイズ3" },
  { value: "49", label: "ソードファイター3,エレキスラッシュ,ウッドスラッシュ,ダンシングブレード3" },
  { value: "4A", label: "アイスグレネード,ワイドウェーブ3,シャークカッター3,フレイムアックス" },
  { value: "4B", label: "グレートアックス,ハンマーウェポン3,ドリルアーム3,ブレイクサーベル" },
  { value: "4C", label: "アンガーファイア3,カウントボム3,ボボボンボム3,ボボボンボム3" },
  { value: "4D", label: "エレキ+30,フラッシュスピア3,イナズマヘッド3,スペードマグネッツV3" },
  { value: "4E", label: "ウッド+30,コガラシ3,バルカンシード3,クラブストロングV3" },
  { value: "4F", label: "ブレイクサーベル,ドリルアーム3,ソードファイター3,アシッドエースV3" },
  { value: "50", label: "スタンナックル,フリーズナックル,ポイズンナックル,デストロイアッパー" },
  { value: "51", label: "フラッシュスピア2,シュリシュリケン2,ヒートアッパー2,シャークカッター2" },
  { value: "52", label: "ウッドスラッシュ,ダミースパイダー2,ステルスレーザー2,シュリシュリケン2" },
  { value: "53", label: "メテオライトB,グラビティプラス,ワイドウェーブ1,ビートスイング1" },
  { value: "54", label: "Aブレイザー,アタック+10,ヒートアッパー1,ビートスイング1" },
  { value: "55", label: "ビートスイング1,グラビティプラス,アイススピニング1,ギザホイール1" },
  { value: "56", label: "ヒートアッパー2,アンガーファイア1,カウントボム2,ダバフレイム1" },
  { value: "57", label: "ワイドウェーブ3,シャークカッター2,ブルーインク,アイスグレネード" },
  { value: "58", label: "フラッシュスピア3,エレキスラッシュ,エレキスラッシュ,イナズマヘッド2" },
  { value: "59", label: "パウダーシュート3,バルカンシード1,シュリシュリケン3,バルカンシード2" },
  { value: "5A", label: "タイフーンダンス,トルネードダンス,ウィンディアタック3,デスサイズ2" },
  { value: "5B", label: "ヒートアッパー3,ハンマーウェポン3,ブレイクサーベル,ヘビードーン3" },
  { value: "5C", label: "グランドウェーブ3,ソードファイター1,ノイズドウィザード2,ドリルアーム3" },
  { value: "5D", label: "ダブルイーター,ヒールウィザード2,ビートスイング3,ジャックコーヴァス" },
  { value: "5E", label: "ダブルイーター,バブルフック,ワイドウェーブ3,クイーンヴァルゴ" },
  { value: "5F", label: "ハンマーウェポン3,ヒートアッパー3,グレートアックス,グレイブジョーカー" },
  { value: "60", label: "ブレイクサーベル,ステルスレーザー3,ギザホイール3,アシッドエース" },
];

export const MMSF3_GIGA_CARD_OPTIONS: Mmsf3RouletteOption[] = [
  { value: "0C4", label: "ウィングブレード" },
  { value: "0C5", label: "ダークネスホール" },
  { value: "0C6", label: "サウザンドキック" },
  { value: "0C7", label: "ブレイクカウントボム" },
  { value: "0C8", label: "ムーリジェクション" },
  { value: "0C9", label: "Gメテオレイザー" },
  { value: "0CA", label: "デストロイミサイル" },
  { value: "0CB", label: "バスターマックス" },
  { value: "0CC", label: "オックスタックル" },
  { value: "0CD", label: "ドッペルミラー" },
  { value: "0CE", label: "メテオオブクリムゾン" },
  { value: "183", label: "ペガサスマジックGX" },
  { value: "184", label: "レオキングダムGX" },
  { value: "185", label: "ドラゴンスカイGX" },
  { value: "186", label: "ゴルゴンアイ" },
  { value: "187", label: "ジェミニサンダー" },
  { value: "188", label: "ブライブレイク" },
  { value: "189", label: "ナダレダイコ" },
  { value: "18A", label: "フライングインパクト" },
  { value: "18B", label: "ゲキリュウウェーブ" },
  { value: "18C", label: "ライトオブセイント" },
  { value: "18D", label: "ペインヘルフレイム" },
];
const MMSF3_GIGA_CARD_REQUIRED_VERSION_BY_VALUE: Partial<Record<string, Mmsf3BrotherVersionId>> = {
  "0C4": "black-ace",
  "0C5": "black-ace",
  "0C6": "black-ace",
  "0C7": "black-ace",
  "0C8": "black-ace",
  "0C9": "red-joker",
  "0CA": "red-joker",
  "0CB": "red-joker",
  "0CC": "red-joker",
  "0CD": "red-joker",
};

export const MMSF3_MEGA_CARD_OPTIONS: Mmsf3RouletteOption[] = [
  { value: "097", label: "スペードマグネッツ" },
  { value: "098", label: "スペードマグネッツV2" },
  { value: "099", label: "スペードマグネッツV3" },
  { value: "168", label: "スペードマグネッツX" },
  { value: "09A", label: "ダイヤモンドアイス" },
  { value: "09B", label: "ダイヤモンドアイスV2" },
  { value: "09C", label: "ダイヤモンドアイスV3" },
  { value: "169", label: "ダイヤモンドアイスX" },
  { value: "09D", label: "クラブストロング" },
  { value: "09E", label: "クラブストロングV2" },
  { value: "09F", label: "クラブストロングV3" },
  { value: "16A", label: "クラブストロングX" },
  { value: "0A0", label: "クイーンヴァルゴ" },
  { value: "0A1", label: "クイーンヴァルゴV2" },
  { value: "0A2", label: "クイーンヴァルゴV3" },
  { value: "16B", label: "クイーンヴァルゴX" },
  { value: "0A3", label: "ジャックコーヴァス" },
  { value: "0A4", label: "ジャックコーヴァスV2" },
  { value: "0A5", label: "ジャックコーヴァスV3" },
  { value: "16C", label: "ジャックコーヴァスX" },
  { value: "0A6", label: "グレイブジョーカー" },
  { value: "0A7", label: "グレイブジョーカーV2" },
  { value: "0A8", label: "グレイブジョーカーV3" },
  { value: "16D", label: "グレイブジョーカーX" },
  { value: "0A9", label: "アシッドエース" },
  { value: "0AA", label: "アシッドエースV2" },
  { value: "0AB", label: "アシッドエースV3" },
  { value: "16E", label: "アシッドエースX" },
  { value: "0AC", label: "オックスファイア" },
  { value: "0AD", label: "オックスファイアV2" },
  { value: "0AE", label: "オックスファイアV3" },
  { value: "16F", label: "オックスファイアX" },
  { value: "0AF", label: "キグナスウィング" },
  { value: "0B0", label: "キグナスウィングV2" },
  { value: "0B1", label: "キグナスウィングV3" },
  { value: "170", label: "キグナスウィングX" },
  { value: "0B2", label: "ウルフフォレスト" },
  { value: "0B3", label: "ウルフフォレストV2" },
  { value: "0B4", label: "ウルフフォレストV3" },
  { value: "171", label: "ウルフフォレストX" },
  { value: "0B5", label: "ファントムブラック" },
  { value: "0B6", label: "ファントムブラックV2" },
  { value: "0B7", label: "ファントムブラックV3" },
  { value: "172", label: "ファントムブラックX" },
  { value: "0B8", label: "ブライ" },
  { value: "0D9", label: "ブライV2" },
  { value: "0BA", label: "ブライV3" },
  { value: "173", label: "ブライX" },
  { value: "0BB", label: "ムーンディザスター" },
  { value: "0BC", label: "ムーンディザスターV2" },
  { value: "0BD", label: "ムーンディザスターV3" },
  { value: "174", label: "ムーンディザスターX" },
  { value: "0BE", label: "アポロンフレイム" },
  { value: "0BF", label: "アポロンフレイムV2" },
  { value: "0C0", label: "アポロンフレイムV3" },
  { value: "175", label: "アポロンフレイムX" },
  { value: "0C1", label: "シリウス" },
  { value: "0C2", label: "シリウスV2" },
  { value: "0C3", label: "シリウスV3" },
  { value: "176", label: "シリウスX" },
  { value: "159", label: "リブラバランス" },
  { value: "15A", label: "リブラバランスV2" },
  { value: "15B", label: "リブラバランスV3" },
  { value: "17E", label: "リブラバランスX" },
  { value: "14D", label: "オヒュカスクイーン" },
  { value: "14E", label: "オヒュカスクイーンV2" },
  { value: "14F", label: "オヒュカスクイーンV3" },
  { value: "17A", label: "オヒュカスクイーンX" },
  { value: "150", label: "ジェミニスパーク" },
  { value: "151", label: "ジェミニスパークV2" },
  { value: "152", label: "ジェミニスパークV3" },
  { value: "17B", label: "ジェミニスパークX" },
  { value: "153", label: "キャンサーバブル" },
  { value: "154", label: "キャンサーバブルV2" },
  { value: "155", label: "キャンサーバブルV3" },
  { value: "17C", label: "キャンサーバブルX" },
  { value: "15C", label: "クラウンサンダー" },
  { value: "15D", label: "クラウンサンダーV2" },
  { value: "15E", label: "クラウンサンダーV3" },
  { value: "17F", label: "クラウンサンダーX" },
  { value: "144", label: "イエティブリザード" },
  { value: "145", label: "イエティブリザードV2" },
  { value: "146", label: "イエティブリザードV3" },
  { value: "177", label: "イエティブリザードX" },
  { value: "147", label: "ブラキオウェーブ" },
  { value: "148", label: "ブラキオウェーブV2" },
  { value: "149", label: "ブラキオウェーブV3" },
  { value: "178", label: "ブラキオウェーブX" },
  { value: "14A", label: "コンドルジオグラフ" },
  { value: "14B", label: "コンドルジオグラフV2" },
  { value: "14C", label: "コンドルジオグラフV3" },
  { value: "179", label: "コンドルジオグラフX" },
  { value: "156", label: "オリガジェネラル" },
  { value: "157", label: "オリガジェネラルV2" },
  { value: "158", label: "オリガジェネラルV3" },
  { value: "17D", label: "オリガジェネラルX" },
  { value: "15F", label: "アクシスジェット" },
  { value: "160", label: "アクシスジェットV2" },
  { value: "161", label: "アクシスジェットV3" },
  { value: "180", label: "アクシスジェットX" },
  { value: "162", label: "Bアイスハンマー" },
  { value: "163", label: "BアイスハンマーV2" },
  { value: "164", label: "BアイスハンマーV3" },
  { value: "181", label: "BアイスハンマーX" },
  { value: "165", label: "ストロングスイング" },
  { value: "166", label: "ストロングスイングV2" },
  { value: "167", label: "ストロングスイングV3" },
  { value: "182", label: "ストロングスイングX" },
  { value: "0CF", label: "アシッドイリーガル" },
];

export const MMSF3_MEGA_CARD_LABELS = MMSF3_MEGA_CARD_OPTIONS.map((option) => option.label);
export const MMSF3_GIGA_CARD_LABELS = MMSF3_GIGA_CARD_OPTIONS.map((option) => option.label);

const noiseOptionsByValue = new Map(MMSF3_NOISE_OPTIONS.map((option) => [option.value, option] as const));
const noiseOptionsByToken = new Map(MMSF3_NOISE_OPTIONS.map((option) => [normalizeToken(option.label), option] as const));
const rezonCardOptionsByValue = new Map(MMSF3_REZON_CARD_OPTIONS.map((option) => [option.value, option] as const));
const rezonCardOptionsByToken = new Map(MMSF3_REZON_CARD_OPTIONS.map((option) => [normalizeToken(option.label), option] as const));
const sssLevelOptionsByValue = new Map(MMSF3_SSS_LEVEL_OPTIONS.map((option) => [option.value, option] as const));
const whiteCardSetOptionsById = new Map(MMSF3_WHITE_CARD_SET_OPTIONS.map((option) => [option.value, option] as const));
const megaCardOptionsByValue = new Map(MMSF3_MEGA_CARD_OPTIONS.map((option) => [option.value, option] as const));
const gigaCardOptionsByValue = new Map(MMSF3_GIGA_CARD_OPTIONS.map((option) => [option.value, option] as const));
const megaCardOptionsByToken = new Map(MMSF3_MEGA_CARD_OPTIONS.map((option) => [normalizeToken(option.label), option] as const));
const gigaCardOptionsByToken = new Map(MMSF3_GIGA_CARD_OPTIONS.map((option) => [normalizeToken(option.label), option] as const));
const megaCardNameTokens = new Set(MMSF3_MEGA_CARD_OPTIONS.map((option) => normalizeToken(option.label)));
const gigaCardNameTokens = new Set(MMSF3_GIGA_CARD_OPTIONS.map((option) => normalizeToken(option.label)));
const brotherRouletteNoiseOptionValues = new Set(MMSF3_BROTHER_ROULETTE_NOISE_OPTIONS.map((option) => option.value));
const brotherVersionOptionsByValue = new Map(MMSF3_BROTHER_VERSION_OPTIONS.map((option) => [option.value, option] as const));

function normalizeRouletteValue(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMmsf3BrotherVersion(value: string | null | undefined): Mmsf3BrotherVersionId | "" {
  const normalizedValue = normalizeRouletteValue(value);
  return brotherVersionOptionsByValue.has(normalizedValue as Mmsf3BrotherVersionId)
    ? (normalizedValue as Mmsf3BrotherVersionId)
    : "";
}

function createEmptyBrotherRouletteSlot(position: Mmsf3BrotherRoulettePosition): Mmsf3BrotherRouletteSlot {
  return {
    position,
    slotType: "brother",
    sssLevel: "",
    version: "",
    noise: "",
    rezon: "",
    whiteCardSetId: "",
    gigaCard: "",
    megaCard: "",
  };
}

function hasBrotherSlotDetails(slot: Partial<Mmsf3BrotherRouletteSlot> | undefined) {
  return [
    slot?.version,
    slot?.noise,
    slot?.rezon,
    normalizeRouletteValue(slot?.whiteCardSetId) === DEFAULT_MMSF3_WHITE_CARD_SET_ID ? "" : slot?.whiteCardSetId,
    slot?.gigaCard,
    slot?.megaCard,
  ].some((value) => normalizeRouletteValue(value).length > 0);
}

function hasBrotherRouletteSelection(slots: Partial<Mmsf3BrotherRouletteSlot>[] | undefined) {
  return (slots ?? []).some((slot) =>
    slot?.slotType === "sss" || normalizeRouletteValue(slot?.sssLevel).length > 0 || hasBrotherSlotDetails(slot),
  );
}

export function getMmsf3SelectedSssLevelsFromBrotherRouletteSlots(slots: Mmsf3BrotherRouletteSlot[]) {
  return slots
    .filter((slot) => slot.slotType === "sss")
    .map((slot) => normalizeRouletteValue(slot.sssLevel))
    .filter((value) => sssLevelOptionsByValue.has(value))
    .slice(0, MMSF3_SSS_SLOT_COUNT);
}

export function getMmsf3ConfiguredSssSlotCount(slots: Mmsf3BrotherRouletteSlot[]) {
  return slots.filter((slot) => slot.slotType === "sss").length;
}

export function clearMmsf3BrotherSelectionsForBuraNoise(slots: Mmsf3BrotherRouletteSlot[]) {
  return normalizeMmsf3BrotherRouletteSlots(slots).map<Mmsf3BrotherRouletteSlot>((slot) =>
    slot.slotType === "sss"
      ? slot
      : {
          ...slot,
          version: "",
          noise: "",
          rezon: "",
          whiteCardSetId: "",
          gigaCard: "",
          megaCard: "",
        },
  );
}

export function buildDefaultMmsf3BrotherRouletteSlots() {
  return MMSF3_BROTHER_ROULETTE_POSITIONS.map((position) => createEmptyBrotherRouletteSlot(position.key));
}

export function normalizeMmsf3BrotherRouletteSlots(
  slots: Partial<Mmsf3BrotherRouletteSlot>[] | undefined,
  legacy?: {
    whiteCardSetId?: string;
    gigaCards?: string[];
    megaCards?: string[];
    rezonCards?: string[];
    sssLevels?: string[];
  },
) {
  const hasCurrentSssSchema = (slots ?? []).some((slot) => "slotType" in (slot ?? {}) || "sssLevel" in (slot ?? {}));
  const slotsByPosition = new Map(
    (slots ?? [])
      .filter((slot): slot is Partial<Mmsf3BrotherRouletteSlot> & Pick<Mmsf3BrotherRouletteSlot, "position"> => {
        return Boolean(slot?.position && MMSF3_BROTHER_ROULETTE_POSITIONS.some((position) => position.key === slot.position));
      })
      .map((slot) => [slot.position, slot] as const),
  );

  const normalizedSlots: Mmsf3BrotherRouletteSlot[] = MMSF3_BROTHER_ROULETTE_POSITIONS.map(({ key }) => {
    const current = slotsByPosition.get(key);
    const normalizedSssLevel = normalizeRouletteValue(current?.sssLevel);
    const slotType: Mmsf3BrotherRouletteSlotType =
      current?.slotType === "sss" || (!current?.slotType && normalizedSssLevel)
        ? "sss"
        : "brother";

    if (slotType === "sss") {
      return {
        position: key,
        slotType,
        sssLevel: sssLevelOptionsByValue.has(normalizedSssLevel) ? normalizedSssLevel : "",
        version: "",
        noise: "",
        rezon: "",
        whiteCardSetId: "",
        gigaCard: "",
        megaCard: "",
      };
    }

    return {
      position: key,
      slotType,
      sssLevel: "",
      version: normalizeMmsf3BrotherVersion(current?.version),
      noise: normalizeRouletteValue(current?.noise),
      rezon: normalizeRouletteValue(current?.rezon),
      whiteCardSetId: normalizeRouletteValue(current?.whiteCardSetId),
      gigaCard: normalizeRouletteValue(current?.gigaCard),
      megaCard: normalizeRouletteValue(current?.megaCard),
    };
  });
  const hasExplicitSlotSelection = hasBrotherRouletteSelection(slots);
  const migratedSlots = hasExplicitSlotSelection ? normalizedSlots : buildDefaultMmsf3BrotherRouletteSlots();

  if (!hasExplicitSlotSelection) {
    const legacyWhiteCardSetId = normalizeRouletteValue(legacy?.whiteCardSetId);
    const legacyRezonCard = legacy?.rezonCards?.find((value) => normalizeRouletteValue(value)) ?? "";
    const legacyMegaCards = legacy?.megaCards?.map((value) => value.trim()).filter(Boolean) ?? [];
    const legacyGigaCards = legacy?.gigaCards?.map((value) => value.trim()).filter(Boolean) ?? [];
    const topLeftSlot = migratedSlots[0];

    if (legacyWhiteCardSetId && legacyWhiteCardSetId !== DEFAULT_MMSF3_WHITE_CARD_SET_ID && isKnownMmsf3WhiteCardSet(legacyWhiteCardSetId)) {
      topLeftSlot.whiteCardSetId = legacyWhiteCardSetId;
    }

    const legacyRezonOption = getMmsf3RezonCardOptionByLabel(legacyRezonCard);
    if (legacyRezonOption) {
      topLeftSlot.rezon = legacyRezonOption.value;
    }

    legacyMegaCards.slice(0, migratedSlots.length).forEach((name, index) => {
      const option = getMmsf3MegaCardOptionByLabel(name);
      if (option) {
        migratedSlots[index].megaCard = option.value;
      }
    });

    legacyGigaCards.slice(0, migratedSlots.length).forEach((name, index) => {
      const option = getMmsf3GigaCardOptionByLabel(name);
      if (option) {
        migratedSlots[index].gigaCard = option.value;
      }
    });
  }

  if (!hasCurrentSssSchema && getMmsf3ConfiguredSssSlotCount(migratedSlots) === 0) {
    const legacySssLevels = normalizeMmsf3SssLevels(legacy?.sssLevels);
    const availableSlots = migratedSlots.filter((slot) => slot.slotType !== "sss" && !hasBrotherSlotDetails(slot));

    legacySssLevels
      .filter(Boolean)
      .slice(0, MMSF3_SSS_SLOT_COUNT)
      .forEach((level, index) => {
        const targetSlot = availableSlots[index];
        if (!targetSlot) {
          return;
        }

        targetSlot.slotType = "sss";
        targetSlot.sssLevel = level;
        targetSlot.noise = "";
        targetSlot.rezon = "";
        targetSlot.whiteCardSetId = "";
        targetSlot.gigaCard = "";
        targetSlot.megaCard = "";
      });
  }

  return migratedSlots;
}

export function getMmsf3BrotherRouletteSelectionErrors(slots: Mmsf3BrotherRouletteSlot[]) {
  const errors: string[] = [];
  const sssSlotCount = getMmsf3ConfiguredSssSlotCount(slots);

  if (sssSlotCount > MMSF3_SSS_SLOT_COUNT) {
    errors.push(`SSS は ${MMSF3_SSS_SLOT_COUNT} 枠までです。`);
  }

  for (const slot of slots) {
    const label = MMSF3_BROTHER_ROULETTE_POSITIONS.find((position) => position.key === slot.position)?.label ?? slot.position;

    if (slot.slotType === "sss") {
      if (slot.sssLevel && !sssLevelOptionsByValue.has(slot.sssLevel)) {
        errors.push(`${label} のSSSが不正です。`);
      }
      continue;
    }

    if (slot.noise && !brotherRouletteNoiseOptionValues.has(slot.noise)) {
      errors.push(`${label} のマージノイズが不正です。`);
    }
    if (slot.version && !brotherVersionOptionsByValue.has(slot.version)) {
      errors.push(`${label} のバージョンが不正です。`);
    }
    if (slot.rezon && !rezonCardOptionsByValue.has(slot.rezon)) {
      errors.push(`${label} のレゾンカードが不正です。`);
    }
    if (slot.whiteCardSetId && !whiteCardSetOptionsById.has(slot.whiteCardSetId)) {
      errors.push(`${label} のホワイトカードが不正です。`);
    }
    if (slot.gigaCard && !gigaCardOptionsByValue.has(slot.gigaCard)) {
      errors.push(`${label} のギガカードが不正です。`);
    } else if (slot.gigaCard && slot.version && !isMmsf3GigaCardAllowedInVersion(slot.gigaCard, slot.version)) {
      const gigaCardLabel = getMmsf3GigaCardOption(slot.gigaCard)?.label ?? slot.gigaCard;
      const versionLabel = getMmsf3BrotherVersionOption(slot.version)?.label ?? slot.version;
      errors.push(`${label} のギガカード「${gigaCardLabel}」は${versionLabel}では設定できません。`);
    }
    if (slot.megaCard && !megaCardOptionsByValue.has(slot.megaCard)) {
      errors.push(`${label} のメガカードが不正です。`);
    }
  }

  return errors;
}

export function normalizeMmsf3SssLevels(levels: string[] | undefined) {
  return Array.from({ length: MMSF3_SSS_SLOT_COUNT }, (_, index) => {
    const value = normalizeRouletteValue(levels?.[index]);
    return sssLevelOptionsByValue.has(value) ? value : "";
  });
}

export function getMmsf3SssSelectionErrors(levels: string[]) {
  return levels.flatMap((value, index) =>
    value && !sssLevelOptionsByValue.has(value) ? [`SSS ${String(index + 1).padStart(2, "0")} のレベルが不正です。`] : [],
  );
}

export function getMmsf3SssLevelOption(value: string) {
  return sssLevelOptionsByValue.get(value);
}

export function getMmsf3NoiseOption(value: string) {
  return noiseOptionsByValue.get(value);
}

export function getMmsf3BrotherVersionOption(value: string) {
  return brotherVersionOptionsByValue.get(value as Mmsf3BrotherVersionId);
}

export function getMmsf3NoiseOptionByLabel(label: string) {
  return noiseOptionsByToken.get(normalizeToken(label));
}

export function getMmsf3RezonCardOption(value: string) {
  return rezonCardOptionsByValue.get(value);
}

export function getMmsf3RezonCardOptionByLabel(label: string) {
  return rezonCardOptionsByToken.get(normalizeToken(label));
}

export function getMmsf3WhiteCardSetOption(id: string) {
  return whiteCardSetOptionsById.get(id);
}

export function getMmsf3MegaCardOption(value: string) {
  return megaCardOptionsByValue.get(value);
}

export function getMmsf3MegaCardOptionByLabel(label: string) {
  return megaCardOptionsByToken.get(normalizeToken(label));
}

export function getMmsf3GigaCardOption(value: string) {
  return gigaCardOptionsByValue.get(value);
}

export function getMmsf3GigaCardOptionByLabel(label: string) {
  return gigaCardOptionsByToken.get(normalizeToken(label));
}

export function getMmsf3RequiredVersionForGigaCard(value: string) {
  return MMSF3_GIGA_CARD_REQUIRED_VERSION_BY_VALUE[value] ?? null;
}

export function isMmsf3GigaCardAllowedInVersion(value: string, version: Mmsf3BrotherVersionId) {
  const requiredVersion = getMmsf3RequiredVersionForGigaCard(value);
  return requiredVersion === null || requiredVersion === version;
}

export function getMmsf3GigaCardOptionsForVersion(version?: Mmsf3BrotherVersionId | "") {
  if (!version) {
    return MMSF3_GIGA_CARD_OPTIONS;
  }

  return MMSF3_GIGA_CARD_OPTIONS.filter((option) => isMmsf3GigaCardAllowedInVersion(option.value, version));
}

export function getMmsf3WhiteCardSetCards(id: string) {
  const option = getMmsf3WhiteCardSetOption(id);
  if (!option || option.label === "なし") {
    return [];
  }

  return option.label.split(",").map((card) => card.trim()).filter(Boolean);
}

export function isKnownMmsf3WhiteCardSet(id: string) {
  return whiteCardSetOptionsById.has(id);
}

export function isKnownMmsf3MegaRouletteCard(name: string) {
  return megaCardNameTokens.has(normalizeToken(name));
}

export function isKnownMmsf3GigaRouletteCard(name: string) {
  return gigaCardNameTokens.has(normalizeToken(name));
}
