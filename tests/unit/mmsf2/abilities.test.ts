import assert from "node:assert/strict";
import test from "node:test";
import {
  getMmsf2AbilityByLabel,
  normalizeMmsf2AbilityEntry,
} from "@/lib/mmsf2/abilities";

test("getMmsf2AbilityByLabel resolves current canonical labels", () => {
  const ability = getMmsf2AbilityByLabel("ＨＰ＋５０/80", "berserker");

  assert.ok(ability);
  assert.equal(ability?.name, "ＨＰ＋５０");
  assert.equal(ability?.cost, 80);
});

test("getMmsf2AbilityByLabel no longer accepts legacy labels", () => {
  const ability = getMmsf2AbilityByLabel("ＨＰ＋５０ (80P)", "berserker");

  assert.equal(ability, null);
});

test("normalizeMmsf2AbilityEntry canonicalizes bare names to the first current option", () => {
  const normalizedEntry = normalizeMmsf2AbilityEntry(
    { id: "ability-1", name: "ＨＰ＋５０", quantity: 80, notes: "", isRegular: false },
    "berserker",
  );

  assert.equal(normalizedEntry.name, "ＨＰ＋５０/50");
  assert.equal(normalizedEntry.quantity, 50);
});
