import assert from "node:assert/strict";
import test from "node:test";
import {
  getMmsf2BlankCardTotalLimit,
  getMmsf2NormalCardTotalLimit,
  validateMmsf2FolderTotal,
  validateMmsf2FolderCards,
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

test("MMSF2 normal card total limit shrinks only by selected blank cards", () => {
  const starCards = [createCard("キャノン★1"), createCard("キャノン★2")];
  const blankCards = Array.from({ length: 10 }, (_, index) => createCard(`プラズマスプレッド${index}`));

  assert.equal(getMmsf2NormalCardTotalLimit(starCards, blankCards, 30), 20);
});

test("MMSF2 blank card total limit stays capped at 10 regardless of folder or star card count", () => {
  const folderCards = [createCard("キャノン", 18)];
  const starCards = [createCard("キャノン★1"), createCard("キャノン★2")];

  assert.equal(getMmsf2BlankCardTotalLimit(folderCards, starCards, 30), 10);
});

test("validateMmsf2FolderTotal ignores star cards in the 30-card total", () => {
  const folderCards = [createCard("キャノン", 21)];
  const starCards = [createCard("キャノン★1"), createCard("キャノン★2"), createCard("キャノン★3")];
  const blankCards = Array.from({ length: 10 }, (_, index) => createCard(`プラズマスプレッド${index}`));

  const result = validateMmsf2FolderTotal(folderCards, starCards, blankCards, 30);

  assert.ok(result.errors.includes("対戦構築カードは 20 枚までです。"));
  assert.ok(result.errors.includes("カード総数は 30 枚以内にしてください。"));
});

test("validateMmsf2FolderCards allows extra mega and giga cards from enhancement bonuses", () => {
  const result = validateMmsf2FolderCards(
    [
      createCard("オックスファイア", 1),
      createCard("オックスファイアEX", 1),
      createCard("オックスファイアSP", 1),
      createCard("オリガジェネラル", 1),
      createCard("オリガジェネラルEX", 1),
      createCard("オリガジェネラルSP", 1),
      createCard("ジェミニサンダー", 1),
      createCard("ブライブレイク", 1),
      createCard("サウザンドキック", 1),
    ],
    "berserker",
    { megaCards: 6, gigaCards: 3 },
  );

  assert.deepEqual(result.errors, []);
});
