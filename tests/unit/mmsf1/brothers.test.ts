import assert from "node:assert/strict";
import test from "node:test";
import {
  getDuplicateMmsf1UniqueBrotherNames,
  getMmsf1BrotherFixedFavoriteCards,
  getMmsf1BrotherKindByName,
  getMmsf1BrotherForcedVersion,
  getDefaultMmsf1BrotherName,
  getMmsf1BrotherNameOptions,
  MMSF1_BROTHER_KIND_SELECT_OPTIONS,
  MMSF1_BROTHER_NAMES,
  normalizeMmsf1BrotherProfile,
} from "@/lib/mmsf1/brothers";

test("MMSF1 brother options include all CHIPCOM brother categories", () => {
  assert.deepEqual(
    MMSF1_BROTHER_KIND_SELECT_OPTIONS.map((option) => option.label),
    ["ゲーム内ブラザー", "データ配信", "リアルブラザー", "ボクタイ"],
  );
  assert.ok(MMSF1_BROTHER_NAMES.includes("LM・シン"));
  assert.ok(MMSF1_BROTHER_NAMES.includes("ボクタイ"));
});

test("MMSF1 brother names resolve correctly by kind", () => {
  assert.deepEqual(
    getMmsf1BrotherNameOptions("story").map((option) => option.value),
    ["響 ミソラ", "白金 ルナ", "牛島ゴン太", "最小院 キザマロ"],
  );
  assert.deepEqual(getMmsf1BrotherNameOptions("real").map((option) => option.value), ["ペガサス", "レオ", "ドラゴン"]);
  assert.equal(getDefaultMmsf1BrotherName("event"), "LM・シン");
  assert.equal(getDefaultMmsf1BrotherName("boktai"), "ボクタイ");
  assert.equal(getMmsf1BrotherKindByName("LM・シン"), "event");
  assert.equal(getMmsf1BrotherKindByName("ボクタイ"), "boktai");
  assert.equal(getMmsf1BrotherForcedVersion("白金 ルナ", "leo"), "leo");
  assert.equal(getMmsf1BrotherForcedVersion("ボクタイ", "leo"), "boktai");
  assert.equal(getMmsf1BrotherForcedVersion("LM・シン", "pegasus"), "LM・シン");
  assert.equal(getMmsf1BrotherForcedVersion("レオ", "pegasus"), "leo");
  assert.equal(getMmsf1BrotherFixedFavoriteCards("LM・シン").length, 6);
  assert.equal(getMmsf1BrotherFixedFavoriteCards("ボクタイ")[0], "タイヨウジュウＶ３");
});

test("normalizeMmsf1BrotherProfile locks forced versions for story and boktai brothers", () => {
  const misora = normalizeMmsf1BrotherProfile(
    { id: "a", name: "響 ミソラ", kind: "story", favoriteCards: [], rezonCard: "", notes: "" },
    "dragon",
  );
  const boktai = normalizeMmsf1BrotherProfile(
    { id: "b", name: "ボクタイ", kind: "boktai", favoriteCards: [], rezonCard: "", notes: "" },
    "pegasus",
  );

  assert.equal(misora.rezonCard, "dragon");
  assert.deepEqual(
    misora.favoriteCards,
    ["ホタルゲリ3", "ゴーストパルス3", "チェインバブル3", "リカバリー300", "ペガサスマジックSP", "ハープノートSP"],
  );
  assert.equal(boktai.rezonCard, "boktai");
  assert.deepEqual(
    boktai.favoriteCards,
    ["タイヨウジュウＶ３", "アンコクケンＶ３", "アーシュラＶ３", "トーベＶ３", "オトフリートＶ３", "リザＶ３"],
  );
});

test("getDuplicateMmsf1UniqueBrotherNames only flags story and LM duplicates", () => {
  assert.deepEqual(
    getDuplicateMmsf1UniqueBrotherNames([
      { id: "1", name: "LM・シン", kind: "event", favoriteCards: [], rezonCard: "", notes: "" },
      { id: "2", name: "LM・シン", kind: "event", favoriteCards: [], rezonCard: "", notes: "" },
      { id: "3", name: "ペガサス", kind: "real", favoriteCards: [], rezonCard: "", notes: "" },
      { id: "4", name: "ペガサス", kind: "real", favoriteCards: [], rezonCard: "", notes: "" },
    ]),
    ["LM・シン"],
  );
});
