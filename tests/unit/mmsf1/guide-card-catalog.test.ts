import assert from "node:assert/strict";
import test from "node:test";
import { getCardSection, getCardSuggestions } from "@/lib/guide-card-catalog";

test("MMSF1 card suggestions include version-specific mega cards across versions", () => {
  const leoSuggestions = getCardSuggestions("mmsf1", "leo");

  assert.ok(leoSuggestions.includes("ペガサスマジックSP"));
  assert.ok(leoSuggestions.includes("ドラゴンスカイSP"));
  assert.ok(leoSuggestions.includes("レオキングダムSP"));
});

test("MMSF1 version-specific mega cards are classified as mega across versions", () => {
  assert.equal(getCardSection("mmsf1", "ペガサスマジックSP", "leo"), "mega");
  assert.equal(getCardSection("mmsf1", "ドラゴンスカイSP", "pegasus"), "mega");
  assert.equal(getCardSection("mmsf1", "レオキングダムSP", "dragon"), "mega");
});
