import { normalizeToken } from "@/lib/utils";
import type { Mmsf3BrotherRoulettePosition, Mmsf3BrotherRouletteSlotType, Mmsf3BrotherVersionId } from "@/lib/types";

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
  { key: "top_left", label: "左上①" },
  { key: "top_right", label: "右上②" },
  { key: "mid_left", label: "左中③" },
  { key: "mid_right", label: "右中④" },
  { key: "btm_left", label: "左下⑤" },
  { key: "btm_right", label: "右下⑥" },
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
  { value: "01", label: "プラズマガン,プラズマガン,エアスプレッド１,ビーストスイング１" },
  { value: "02", label: "ワイドソード,リカバリー３０,グランドウェーブ１,バリア" },
  { value: "03", label: "マッドバルカン１,ミニグレネード,ロングソード,キャノン" },
  { value: "04", label: "プラズマガン,インビジブル,グランドウェーブ１,ビーストスイング１" },
  { value: "05", label: "ディバイドライン,ロングソード,マッドバルカン１,リカバリー３０" },
  { value: "06", label: "インビジブル,グランドウェーブ１,ソード,マッドバルカン１" },
  { value: "07", label: "ビーストスイング１,キャノン,プラズマガン,グラビティプラス" },
  { value: "08", label: "ミニグレネード,ロングソード,ロングソード,リカバリー３０" },
  { value: "09", label: "プラズマガン,ワイドソード,グランドウェーブ１,グランドウェーブ１" },
  { value: "0A", label: "エアスプレッド１,マッドバルカン１,ビーストスイング１,エアスプレッド１" },
  { value: "0B", label: "フラッシュスピア１,フラッシュスピア１,マッドバルカン１,グラビティプラス" },
  { value: "0C", label: "ビーストスイング１,ビーストスイング１,エアスプレッド１,アタック＋１０" },
  { value: "0D", label: "グランドウェーブ１,マッドバルカン１,アタック＋１０,ビーストスイング１" },
  { value: "0E", label: "エアスプレッド２,ワイドウェーブ１,グラビティプラス,ディバイドライン" },
  { value: "0F", label: "ジェットアタック１,ジェットアタック１,グラビティプラス,リカバリー５０" },
  { value: "10", label: "ドリルアーム１,ドリルアーム１,アタック＋１０,ジェットアタック１" },
  { value: "11", label: "ワイドウェーブ１,シャークカッター１,シャークカッター１,ワイドウェーブ１" },
  { value: "12", label: "グランドウェーブ２,ギザホイール１,ギザホイール１,マヒプラス" },
  { value: "13", label: "アイススピニング１,アタック＋１０,ワイドウェーブ１,ワイドウェーブ１" },
  { value: "14", label: "シャークカッター１,マヒプラス,グラビティプラス,シャークカッター１" },
  { value: "15", label: "エアスプレッド３,プラスキャノン,ギザホイール２,ギザホイール２" },
  { value: "16", label: "エドギリブレード１,エドギリブレード１,ギザホイール２,マヒプラス" },
  { value: "17", label: "バブルフック１,ワイドウェーブ２,マヒプラス,バブルフック１" },
  { value: "18", label: "ビーストスイング２,ビーストスイング２,ドリルアーム１,プラスキャノン" },
  { value: "19", label: "アンガーファイア１,アンガーファイア１,ヒートアッパー２,ヒートアッパー２" },
  { value: "1A", label: "カウントボム１,ヒートアッパー２,アンガーファイア１,アタック＋１０" },
  { value: "1B", label: "パウダーシュート１,シュリシュリケン２,ローリングナッツ１,ダミースパイダー１" },
  { value: "1C", label: "ローリングナッツ１,ローリングナッツ１,パウダーシュート１,パウダーシュート１" },
  { value: "1D", label: "フラッシュスピア３,フラッシュスピア３,ステルスレーザー２,イナズマヘッド１" },
  { value: "1E", label: "ステルスレーザー２,マヒプラス,イナズマヘッド１,マミーハンド１" },
  { value: "1F", label: "ドリルアーム３,ハンマーウェポン１,ヘビーキャノン,タイフーンダンス" },
  { value: "20", label: "カウントボム２,マシーンフレイム１,ヒートアッパー３,アンガーファイア２" },
  { value: "21", label: "ビーストスイング３,ビーストスイング２,ダブルイーター,グレートアックス" },
  { value: "22", label: "ワイドウェーブ３,シャークカッター３,ワイドウェーブ２,シャークカッター３" },
  { value: "23", label: "カウントボム２,ヒートアッパー３,アンガーファイア３,アタックパネル" },
  { value: "24", label: "パウダーシュート３,シュリシュリケン２,ローリングナッツ３,ダミースパイダー３" },
  { value: "25", label: "フラッシュスピア３,イナズマヘッド２,フラッシュスピア３,ステルスレーザー２" },
  { value: "26", label: "ドリルアーム３,ドリルアーム２,マヒプラス,ハンマーウェポン３" },
  { value: "27", label: "ステルスレーザー３,マヒプラス,イナズマヘッド２,マミーハンド３" },
  { value: "28", label: "マシーンフレイム２,ヒートアッパー３,カウントボム３,アンガーファイア３" },
  { value: "29", label: "バブルフック３,バブルフック３,マヒプラス,ワイドウェーブ３" },
  { value: "2A", label: "シュリシュリケン３,ダミースパイダー３,ローリングナッツ３,ウッドスラッシュ" },
  { value: "2B", label: "フラッシュスピア３,ステルスレーザー３,イナズマヘッド３,エレキスラッシュ" },
  { value: "2C", label: "トルネードダンス,ウィンディアタック３,ドリルアーム３,ハンマーウェポン３" },
  { value: "2D", label: "プラズマガン,ステルスレーザー２,マミーハンド１,イナズマヘッド１" },
  { value: "2E", label: "グリーンインク,ダミースパイダー１,シュリシュリケン１,パウダーシュート２" },
  { value: "2F", label: "ホイッスル,ドリルアーム１,ドリルアーム２,ウィンディアタック１" },
  { value: "30", label: "バブルフック１,バブルフック１,フラッシュスピア２,イナズマヘッド２" },
  { value: "31", label: "ブラックインク,フラッシュスピア２,バブルフック１,マミーハンド２" },
  { value: "32", label: "ウィンディアタック１,ウィンディアタック１,ノイズドウィザード１,ノイズドウィザード２" },
  { value: "33", label: "ギザホイール２,グランドウェーブ２,シュリシュリケン１,アイススピニング１" },
  { value: "34", label: "ヘビーキャノン,ドリルアーム２,ヒートアッパー２,ヘビードーン１" },
  { value: "35", label: "ヒールウィザード１,バブルフック１,エレキスラッシュ,ダミースパイダー１" },
  { value: "36", label: "バリア,キャノン,キャノン,キャノン" },
  { value: "37", label: "ダブルイーター,ホイッスル,ビーストスイング３,グレートアックス" },
  { value: "38", label: "ローリングナッツ２,ローリングナッツ１,マシーンフレイム１,カウントボム３" },
  { value: "39", label: "アイスグレネード,アイスグレネード,シャークカッター２,ワイドウェーブ２" },
  { value: "3A", label: "エドギリブレード３,エドギリブレード３,エドギリブレード２,エドギリブレード１" },
  { value: "3B", label: "シンクロフック１,フリーズナックル,ヒートアッパー３,スタンナックル" },
  { value: "3C", label: "ファイア＋３０,マシーンフレイム３,アンガーファイア３,オックスファイアＶ２" },
  { value: "3D", label: "アクア＋３０,シャークカッター３,バブルフック３,ダイヤアイスバーンＶ２" },
  { value: "3E", label: "シュリシュリケン３,ワイドウェーブ３,ステルスレーザー３,スマイルコイン３" },
  { value: "3F", label: "マシーンフレイム３,ダバフレイム３,アンガーファイア３,ヒートアッパー３" },
  { value: "40", label: "アイススピニング３,ワイドウェーブ３,シャークカッター３,バブルフック３" },
  { value: "41", label: "スカルアロー３,スカルアロー３,ジェットアタック３,ハンマーウェポン３" },
  { value: "42", label: "ビーストスイング３,ビーストスイング３,ヒールウィザード３,デスサイズ３" },
  { value: "43", label: "トルネードダンス,エアスプレッド３,バルカンシード３,マッドバルカン３" },
  { value: "44", label: "パニッククラウド,パニッククラウド,フラッシュスピア３,パウダーシュート３" },
  { value: "45", label: "エレキスラッシュ,マミーハンド３,ダミースパイダー３,サンダーオブアース３" },
  { value: "46", label: "マシーンフレイム３,ホワイトメテオ,ヘビードーン３,カウントボム３" },
  { value: "47", label: "ミニグレネード,ソード,ワイドソード,ロングソード" },
  { value: "48", label: "ウィンディアタック３,トルネードダンス,コガラシ３,デスサイズ３" },
  { value: "49", label: "ソードファイター３,エレキスラッシュ,ウッドスラッシュ,ダンシングブレード３" },
  { value: "4A", label: "アイスグレネード,ワイドウェーブ３,シャークカッター３,フレイムアックス" },
  { value: "4B", label: "グレートアックス,ハンマーウェポン３,ドリルアーム３,ブレイクサーベル" },
  { value: "4C", label: "アンガーファイア３,カウントボム３,ボボボンボム３,ボボボンボム３" },
  { value: "4D", label: "エレキ＋３０,フラッシュスピア３,イナズマヘッド３,スペードマグネッツＶ３" },
  { value: "4E", label: "ウッド＋３０,コガラシ３,バルカンシード３,クラブストロングＶ３" },
  { value: "4F", label: "ブレイクサーベル,ドリルアーム３,ソードファイター３,アシッドエースＶ３" },
  { value: "50", label: "スタンナックル,フリーズナックル,ポイズンナックル,デストロイアッパー" },
  { value: "51", label: "フラッシュスピア２,シュリシュリケン２,ヒートアッパー２,シャークカッター２" },
  { value: "52", label: "ウッドスラッシュ,ダミースパイダー２,ステルスレーザー２,シュリシュリケン２" },
  { value: "53", label: "メテオライトバレッジ,グラビティプラス,ワイドウェーブ１,ビーストスイング１" },
  { value: "54", label: "アトミックブレイザー,アタック＋１０,ヒートアッパー１,ビーストスイング１" },
  { value: "55", label: "ビーストスイング１,グラビティプラス,アイススピニング１,ギザホイール１" },
  { value: "56", label: "ヒートアッパー２,アンガーファイア１,カウントボム２,ダバフレイム１" },
  { value: "57", label: "ワイドウェーブ３,シャークカッター２,ブルーインク,アイスグレネード" },
  { value: "58", label: "フラッシュスピア３,エレキスラッシュ,エレキスラッシュ,イナズマヘッド２" },
  { value: "59", label: "パウダーシュート３,バルカンシード１,シュリシュリケン３,バルカンシード３" },
  { value: "5A", label: "タイフーンダンス,トルネードダンス,ウィンディアタック３,デスサイズ２" },
  { value: "5B", label: "ヒートアッパー３,ハンマーウェポン３,ブレイクサーベル,ヘビードーン３" },
  { value: "5C", label: "グランドウェーブ３,ソードファイター１,ノイズドウィザード２,ドリルアーム３" },
  { value: "5D", label: "ダブルイーター,ヒールウィザード２,ビーストスイング３,ジャックコーヴァス" },
  { value: "5E", label: "ダブルイーター,バブルフック３,ワイドウェーブ３,クイーンヴァルゴ" },
  { value: "5F", label: "ハンマーウェポン３,ヒートアッパー３,グレートアックス,グレイブジョーカー" },
  { value: "60", label: "ブレイクサーベル,ステルスレーザー３,ギザホイール３,アシッドエース" },
];

export const MMSF3_GIGA_CARD_OPTIONS: Mmsf3RouletteOption[] = [
  { value: "0C4", label: "ウィングブレード" },
  { value: "0C5", label: "ダークネスホール" },
  { value: "0C6", label: "サウザンドキック" },
  { value: "0C7", label: "ブレイクカウントボム" },
  { value: "0C8", label: "ムーリジェクション" },
  { value: "0C9", label: "Ｇメテオレーザー" },
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

export const MMSF3_MEGA_CARD_OPTIONS: Mmsf3RouletteOption[] = [
  { value: "097", label: "スペードマグネッツ" },
  { value: "098", label: "スペードマグネッツＶ２" },
  { value: "099", label: "スペードマグネッツＶ３" },
  { value: "168", label: "スペードマグネッツＸ" },
  { value: "09A", label: "ダイヤモンドアイス" },
  { value: "09B", label: "ダイヤモンドアイスV2" },
  { value: "09C", label: "ダイヤモンドアイスV3" },
  { value: "169", label: "ダイヤモンドアイスX" },
  { value: "09D", label: "クラブストロング" },
  { value: "09E", label: "クラブストロングＶ２" },
  { value: "09F", label: "クラブストロングＶ３" },
  { value: "16A", label: "クラブストロングＸ" },
  { value: "0A0", label: "クイーンヴァルゴ" },
  { value: "0A1", label: "クイーンヴァルゴＶ２" },
  { value: "0A2", label: "クイーンヴァルゴＶ３" },
  { value: "16B", label: "クイーンヴァルゴＸ" },
  { value: "0A3", label: "ジャックコーヴァス" },
  { value: "0A4", label: "ジャックコーヴァスＶ２" },
  { value: "0A5", label: "ジャックコーヴァスＶ３" },
  { value: "16C", label: "ジャックコーヴァスＸ" },
  { value: "0A6", label: "グレイブジョーカー" },
  { value: "0A7", label: "グレイブジョーカーＶ２" },
  { value: "0A8", label: "グレイブジョーカーＶ３" },
  { value: "16D", label: "グレイブジョーカーＸ" },
  { value: "0A9", label: "アシッドエース" },
  { value: "0AA", label: "アシッドエースＶ２" },
  { value: "0AB", label: "アシッドエースＶ３" },
  { value: "16E", label: "アシッドエースＸ" },
  { value: "0AC", label: "オックスファイア" },
  { value: "0AD", label: "オックスファイアＶ２" },
  { value: "0AE", label: "オックスファイアＶ３" },
  { value: "16F", label: "オックスファイアＸ" },
  { value: "0AF", label: "キグナスウィング" },
  { value: "0B0", label: "キグナスウィングＶ２" },
  { value: "0B1", label: "キグナスウィングＶ３" },
  { value: "170", label: "キグナスウィングＸ" },
  { value: "0B2", label: "ウルフフォレスト" },
  { value: "0B3", label: "ウルフフォレストＶ２" },
  { value: "0B4", label: "ウルフフォレストＶ３" },
  { value: "171", label: "ウルフフォレストＸ" },
  { value: "0B5", label: "ファントムブラック" },
  { value: "0B6", label: "ファントムブラックＶ２" },
  { value: "0B7", label: "ファントムブラックＶ３" },
  { value: "172", label: "ファントムブラックＸ" },
  { value: "0B8", label: "ブライ" },
  { value: "0D9", label: "ブライＶ２" },
  { value: "0BA", label: "ブライＶ３" },
  { value: "173", label: "ブライＸ" },
  { value: "0BB", label: "ムーンディザスター" },
  { value: "0BC", label: "ムーンディザスターＶ２" },
  { value: "0BD", label: "ムーンディザスターＶ３" },
  { value: "174", label: "ムーンディザスターＸ" },
  { value: "0BE", label: "アポロンフレイム" },
  { value: "0BF", label: "アポロンフレイムＶ２" },
  { value: "0C0", label: "アポロンフレイムＶ３" },
  { value: "175", label: "アポロンフレイムＸ" },
  { value: "0C1", label: "シリウス" },
  { value: "0C2", label: "シリウスＶ２" },
  { value: "0C3", label: "シリウスＶ３" },
  { value: "176", label: "シリウスＸ" },
  { value: "159", label: "リブラバランス" },
  { value: "15A", label: "リブラバランスＶ２" },
  { value: "15B", label: "リブラバランスＶ３" },
  { value: "17E", label: "リブラバランスＸ" },
  { value: "14D", label: "オヒュカスクイーン" },
  { value: "14E", label: "オヒュカスクイーンＶ２" },
  { value: "14F", label: "オヒュカスクイーンＶ３" },
  { value: "17A", label: "オヒュカスクイーンＸ" },
  { value: "150", label: "ジェミニスパーク" },
  { value: "151", label: "ジェミニスパークＶ２" },
  { value: "152", label: "ジェミニスパークＶ３" },
  { value: "17B", label: "ジェミニスパークＸ" },
  { value: "153", label: "キャンサーバブル" },
  { value: "154", label: "キャンサーバブルＶ２" },
  { value: "155", label: "キャンサーバブルＶ３" },
  { value: "17C", label: "キャンサーバブルＸ" },
  { value: "15C", label: "クラウンサンダー" },
  { value: "15D", label: "クラウンサンダーＶ２" },
  { value: "15E", label: "クラウンサンダーＶ３" },
  { value: "17F", label: "クラウンサンダーＸ" },
  { value: "144", label: "イエティブリザード" },
  { value: "145", label: "イエティブリザードＶ２" },
  { value: "146", label: "イエティブリザードＶ３" },
  { value: "177", label: "イエティブリザードＸ" },
  { value: "147", label: "ブラキオウェーブ" },
  { value: "148", label: "ブラキオウェーブＶ２" },
  { value: "149", label: "ブラキオウェーブＶ３" },
  { value: "178", label: "ブラキオウェーブＸ" },
  { value: "14A", label: "コンドルジオグラフ" },
  { value: "14B", label: "コンドルジオグラフＶ２" },
  { value: "14C", label: "コンドルジオグラフＶ３" },
  { value: "179", label: "コンドルジオグラフＸ" },
  { value: "156", label: "オリガジェネラル" },
  { value: "157", label: "オリガジェネラルＶ２" },
  { value: "158", label: "オリガジェネラルＶ３" },
  { value: "17D", label: "オリガジェネラルＸ" },
  { value: "15F", label: "アクシスジェット" },
  { value: "160", label: "アクシスジェットＶ２" },
  { value: "161", label: "アクシスジェットＶ３" },
  { value: "180", label: "アクシスジェットＸ" },
  { value: "162", label: "Ｂアイスハンマー" },
  { value: "163", label: "ＢアイスハンマーＶ２" },
  { value: "164", label: "ＢアイスハンマーＶ３" },
  { value: "181", label: "ＢアイスハンマーＸ" },
  { value: "165", label: "ストロングスイング" },
  { value: "166", label: "ストロングスイングＶ２" },
  { value: "167", label: "ストロングスイングＶ３" },
  { value: "182", label: "ストロングスイングＸ" },
  { value: "0CF", label: "アシッドイリーガル" },
];

const noiseOptionsByValue = new Map(MMSF3_NOISE_OPTIONS.map((option) => [option.value, option] as const));
const noiseOptionsByToken = new Map(MMSF3_NOISE_OPTIONS.map((option) => [normalizeToken(option.label), option] as const));
const brotherVersionOptionsByValue = new Map(MMSF3_BROTHER_VERSION_OPTIONS.map((option) => [option.value, option] as const));
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
