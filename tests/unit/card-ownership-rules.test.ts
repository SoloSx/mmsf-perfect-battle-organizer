import assert from "node:assert/strict";
import test from "node:test";
import { validateLimitedCardOwnership } from "@/lib/card-ownership-rules";
import type { GameId } from "@/lib/types";

function createCard(name: string, quantity = 1) {
  return {
    id: `${name}-${quantity}`,
    name,
    quantity,
    notes: "",
    isRegular: false,
  };
}

function getErrors(game: GameId, cards: ReturnType<typeof createCard>[]) {
  return validateLimitedCardOwnership(game, cards).errors;
}

test("validateLimitedCardOwnership rejects MMSF1 version giga cards above one copy", () => {
  assert.deepEqual(getErrors("mmsf1", [createCard("ジェミニサンダー", 2)]), ['カード「ジェミニサンダー」は1枚までです。']);
});

test("validateLimitedCardOwnership rejects MMSF1 distribution giga cards above one copy", () => {
  assert.deepEqual(getErrors("mmsf1", [createCard("アンドロメダ", 2)]), ['カード「アンドロメダ」は1枚までです。']);
});

test("validateLimitedCardOwnership rejects MMSF2 version giga cards above one copy", () => {
  assert.deepEqual(getErrors("mmsf2", [createCard("ジェミニサンダー", 2)]), ['カード「ジェミニサンダー」は1枚までです。']);
});

test("validateLimitedCardOwnership rejects MMSF3 version giga and distribution cards above one copy", () => {
  assert.deepEqual(getErrors("mmsf3", [createCard("Ｇメテオレーザー", 2)]), ['カード「Ｇメテオレーザー」は1枚までです。']);
  assert.deepEqual(getErrors("mmsf3", [createCard("アシッドイリーガル", 2)]), ['カード「アシッドイリーガル」は1枚までです。']);
});

test("validateLimitedCardOwnership does not restrict other cards", () => {
  assert.deepEqual(getErrors("mmsf1", [createCard("プラズマガン3", 3), createCard("オックスファイアSP", 2)]), []);
  assert.deepEqual(getErrors("mmsf3", [createCard("アシッドエース", 2)]), []);
});
