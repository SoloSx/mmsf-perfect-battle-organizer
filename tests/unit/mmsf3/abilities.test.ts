import assert from "node:assert/strict";
import test from "node:test";
import {
  getMmsf3AbilityByLabel,
  normalizeMmsf3AbilityEntry,
} from "@/lib/mmsf3/abilities";

test("getMmsf3AbilityByLabel resolves current canonical labels", () => {
  const ability = getMmsf3AbilityByLabel("エースＰＧＭ/0");

  assert.ok(ability);
  assert.equal(ability?.name, "エースPGM");
  assert.equal(ability?.cost, 0);
});

test("getMmsf3AbilityByLabel no longer accepts legacy labels", () => {
  const ability = getMmsf3AbilityByLabel("エースPGM (0P)");

  assert.equal(ability, null);
});

test("normalizeMmsf3AbilityEntry canonicalizes current name and cost inputs", () => {
  const normalizedEntry = normalizeMmsf3AbilityEntry(
    { id: "ability-1", name: "エースPGM", quantity: 0, notes: "", isRegular: false },
  );

  assert.equal(normalizedEntry.name, "エースＰＧＭ/0");
  assert.equal(normalizedEntry.quantity, 0);
});
