import assert from "node:assert/strict";
import test from "node:test";
import {
  getMmsf2BlankCardTotalLimit,
  getMmsf2NormalCardTotalLimit,
  validateMmsf2FolderTotal,
} from "@/lib/mmsf2/battle-rules";

function createCard(name: string, quantity = 1) {
  return {
    id: `${name}-${quantity}`,
    name,
    quantity,
    notes: "",
    isRegular: false,
  };
}

test("MMSF2 normal card total limit shrinks by selected star and blank cards", () => {
  const starCards = [createCard("キャノン★1"), createCard("キャノン★2")];
  const blankCards = Array.from({ length: 10 }, (_, index) => createCard(`プラズマスプレッド${index}`));

  assert.equal(getMmsf2NormalCardTotalLimit(starCards, blankCards, 30), 18);
});

test("MMSF2 blank card total limit shrinks by selected folder and star cards", () => {
  const folderCards = [createCard("キャノン", 18)];
  const starCards = [createCard("キャノン★1"), createCard("キャノン★2")];

  assert.equal(getMmsf2BlankCardTotalLimit(folderCards, starCards, 30), 10);
});

test("validateMmsf2FolderTotal rejects folder cards beyond the remaining slots after blank selection", () => {
  const folderCards = [createCard("キャノン", 21)];
  const blankCards = Array.from({ length: 10 }, (_, index) => createCard(`プラズマスプレッド${index}`));

  const result = validateMmsf2FolderTotal(folderCards, [], blankCards, 30);

  assert.ok(result.errors.includes("対戦構築カードは 20 枚までです。"));
  assert.ok(result.errors.includes("カード総数は 30 枚以内にしてください。"));
});
