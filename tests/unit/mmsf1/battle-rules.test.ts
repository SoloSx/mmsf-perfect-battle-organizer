import assert from "node:assert/strict";
import test from "node:test";
import { validateMmsf1BrotherFavoriteCards, validateMmsf1FolderCards } from "@/lib/mmsf1/battle-rules";
import type { BrotherProfile, BuildCardEntry } from "@/lib/types";

function createCard(name: string, quantity = 1): BuildCardEntry {
  return { id: name, name, quantity, notes: "", isRegular: false, favoriteCount: 0 };
}

function createBrother(favoriteCards: string[]): BrotherProfile {
  return {
    id: "brother",
    name: "ブラザー",
    kind: "real",
    favoriteCards,
    rezonCard: "",
    notes: "",
  };
}

function createNamedBrother(name: string, favoriteCards: string[] = []): BrotherProfile {
  return {
    id: name,
    name,
    kind: "story",
    favoriteCards,
    rezonCard: "",
    notes: "",
  };
}

test("validateMmsf1FolderCards allows up to five mega cards and one giga card in the folder", () => {
  assert.deepEqual(
    validateMmsf1FolderCards(
      [
        createCard("オックスファイアSP"),
        createCard("ペガサスマジックSP"),
        createCard("レオキングダムSP"),
        createCard("ドラゴンスカイSP"),
        createCard("ハープノートSP"),
        createCard("アンドロメダ"),
      ],
      "pegasus",
    ).errors,
    [],
  );

  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("オックスファイアSP", 6)],
      "pegasus",
    ).errors,
    ["MMSF1 のメガカードは5枚までです。"],
  );

  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("アンドロメダ", 2)],
      "pegasus",
    ).errors,
    ["MMSF1 のギガカードは1枚までです。"],
  );
});

test("validateMmsf1FolderCards allows up to nine mega and five giga cards when enhancement is enabled", () => {
  assert.deepEqual(
    validateMmsf1FolderCards(
      [
        createCard("オックスファイアSP", 3),
        createCard("ペガサスマジックSP", 3),
        createCard("レオキングダムSP", 3),
        createCard("アンドロメダ", 5),
      ],
      "pegasus",
      "on",
    ).errors,
    [],
  );

  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("オックスファイアSP", 10)],
      "pegasus",
      "on",
    ).errors,
    ["MMSF1 の強化On時、メガカードは9枚までです。"],
  );

  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("アンドロメダ", 6)],
      "pegasus",
      "on",
    ).errors,
    ["MMSF1 の強化On時、ギガカードは5枚までです。"],
  );
});

test("validateMmsf1FolderCards applies brother bonuses for Kizamaro and LM Shin", () => {
  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("オックスファイアSP", 6)],
      "pegasus",
      "",
      [createNamedBrother("最小院 キザマロ")],
    ).errors,
    [],
  );

  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("アンドロメダ", 2)],
      "pegasus",
      "",
      [createNamedBrother("LM・シン")],
    ).errors,
    [],
  );

  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("オックスファイアSP", 7)],
      "pegasus",
      "",
      [createNamedBrother("最小院 キザマロ")],
    ).errors,
    ["MMSF1 のメガカードは6枚までです。"],
  );

  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("アンドロメダ", 3)],
      "pegasus",
      "",
      [createNamedBrother("LM・シン")],
    ).errors,
    ["MMSF1 のギガカードは2枚までです。"],
  );
});

test("validateMmsf1FolderCards allows standard cards only up to three copies", () => {
  assert.deepEqual(
    validateMmsf1FolderCards([createCard("プラズマガン3", 3), createCard("ソード", 2)], "pegasus").errors,
    [],
  );

  assert.deepEqual(
    validateMmsf1FolderCards([createCard("プラズマガン3", 4)], "pegasus").errors,
    ["MMSF1 の通常カード「プラズマガン3」は3枚までです。"],
  );
});

test("validateMmsf1BrotherFavoriteCards allows up to five mega cards and one giga card in each brother FAV set", () => {
  assert.deepEqual(
    validateMmsf1BrotherFavoriteCards(
      [createBrother(["オックスファイアSP", "ペガサスマジックSP", "レオキングダムSP", "ドラゴンスカイSP", "ハープノートSP", "アンドロメダ"])],
      "pegasus",
    ).errors,
    [],
  );

  assert.deepEqual(
    validateMmsf1BrotherFavoriteCards(
      [createBrother(["オックスファイアSP", "ペガサスマジックSP", "レオキングダムSP", "ドラゴンスカイSP", "ハープノートSP", "リブラバランスSP"])],
      "pegasus",
    ).errors,
    ["MMSF1 のブラザー FAV カードでメガカードは5枚までです。"],
  );

  assert.deepEqual(
    validateMmsf1BrotherFavoriteCards(
      [createBrother(["オックスファイアSP", "ペガサスマジックSP", "レオキングダムSP", "ドラゴンスカイSP", "アンドロメダ", "アンドロメダ"])],
      "pegasus",
    ).errors,
    ["MMSF1 のブラザー FAV カードでギガカードは1枚までです。"],
  );
});
