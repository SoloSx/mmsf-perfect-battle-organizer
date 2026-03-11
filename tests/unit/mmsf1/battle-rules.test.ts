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

test("validateMmsf1FolderCards allows at most two mega/giga cards in the folder", () => {
  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("オックスファイアSP"), createCard("ペガサスマジックSP"), createCard("プラズマガン3", 3)],
      "pegasus",
    ).errors,
    [],
  );

  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("オックスファイアSP"), createCard("ペガサスマジックSP"), createCard("アンドロメダ")],
      "pegasus",
    ).errors,
    ["MMSF1 のメガ・ギガカードは合計2枚までです。"],
  );
});

test("validateMmsf1FolderCards allows up to six mega and six giga cards when enhancement is enabled", () => {
  assert.deepEqual(
    validateMmsf1FolderCards(
      [
        createCard("オックスファイアSP", 3),
        createCard("ペガサスマジックSP", 3),
        createCard("アンドロメダ", 6),
      ],
      "pegasus",
      "on",
    ).errors,
    [],
  );

  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("オックスファイアSP", 7)],
      "pegasus",
      "on",
    ).errors,
    ["MMSF1 の強化On時、メガカードは6枚までです。"],
  );

  assert.deepEqual(
    validateMmsf1FolderCards(
      [createCard("アンドロメダ", 7)],
      "pegasus",
      "on",
    ).errors,
    ["MMSF1 の強化On時、ギガカードは6枚までです。"],
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

test("validateMmsf1BrotherFavoriteCards allows at most two mega/giga cards in each brother FAV set", () => {
  assert.deepEqual(
    validateMmsf1BrotherFavoriteCards(
      [createBrother(["オックスファイアSP", "ペガサスマジックSP", "プラズマガン3", "ソード", "キャノン", "インビジブル"])],
      "pegasus",
    ).errors,
    [],
  );

  assert.deepEqual(
    validateMmsf1BrotherFavoriteCards(
      [createBrother(["オックスファイアSP", "ペガサスマジックSP", "アンドロメダ", "ソード", "キャノン", "インビジブル"])],
      "pegasus",
    ).errors,
    ["MMSF1 のブラザー FAV カードでメガ・ギガカードは合計2枚までです。"],
  );
});
