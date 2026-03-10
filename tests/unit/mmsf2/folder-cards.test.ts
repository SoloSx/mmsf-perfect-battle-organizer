import assert from "node:assert/strict";
import test from "node:test";
import {
  getMmsf2BlankCardDefinition,
  MMSF2_BLANK_CARD_DEFINITIONS,
  resolveMmsf2FolderCard,
  resolveMmsf2FolderCards,
} from "@/lib/mmsf2/folder-cards";
import { normalizeToken } from "@/lib/utils";

test("MMSF2 blank card definitions expose all 107 blank card entries", () => {
  assert.equal(MMSF2_BLANK_CARD_DEFINITIONS.length, 107);
  assert.equal(MMSF2_BLANK_CARD_DEFINITIONS[0]?.displayName, "S-1 プラズマスプレッド");
  assert.equal(MMSF2_BLANK_CARD_DEFINITIONS.at(-1)?.displayName, "G-18 ファントムスラッシュ");
});

test("blank card definitions normalize class type and duplicate key", () => {
  const definition = getMmsf2BlankCardDefinition("G-4 ジェミニサンダー");

  assert.ok(definition);
  assert.equal(definition.classType, "giga");
  assert.equal(definition.contentKey, "ジェミニサンダー");
  assert.equal(definition.duplicateKey, `blank:${normalizeToken("ジェミニサンダー")}`);
});

test("resolveMmsf2FolderCard normalizes normal, star, and blank entries into the same shape", () => {
  const normal = resolveMmsf2FolderCard({ id: "n1", name: "ジェミニサンダー", quantity: 1 }, "normal", "berserker");
  const star = resolveMmsf2FolderCard({ id: "s1", name: "キャノン★3", quantity: 1 }, "star", "berserker");
  const blank = resolveMmsf2FolderCard({ id: "b1", name: "G-4 ジェミニサンダー", quantity: 1 }, "blank", "berserker");

  assert.ok(normal);
  assert.equal(normal.classType, "giga");
  assert.equal(normal.contentKey, "ジェミニサンダー");
  assert.equal(normal.duplicateKey, `normal:giga:${normalizeToken("ジェミニサンダー")}`);

  assert.ok(star);
  assert.equal(star.classType, "standard");
  assert.equal(star.contentKey, "キャノン");
  assert.equal(star.duplicateKey, `star:standard:${normalizeToken("キャノン")}`);

  assert.ok(blank);
  assert.equal(blank.classType, "giga");
  assert.equal(blank.contentKey, "ジェミニサンダー");
  assert.equal(blank.duplicateKey, `blank:${normalizeToken("ジェミニサンダー")}`);
});

test("resolveMmsf2FolderCards separates unresolved entries", () => {
  const result = resolveMmsf2FolderCards(
    [{ id: "n1", name: "キャノン", quantity: 1, notes: "", isRegular: false }],
    [{ id: "s1", name: "キャノン★1", quantity: 1, notes: "", isRegular: false }],
    [{ id: "b1", name: "unknown blank", quantity: 1, notes: "", isRegular: false }],
    "berserker",
  );

  assert.equal(result.resolvedCards.length, 2);
  assert.deepEqual(result.unresolvedCards, [
    {
      entryId: "b1",
      entryKind: "blank",
      displayName: "unknown blank",
    },
  ]);
});
