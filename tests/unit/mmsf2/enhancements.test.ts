import assert from "node:assert/strict";
import test from "node:test";
import { getMmsf2EnhancementEffect, getMmsf2EnhancementStatSummary } from "@/lib/mmsf2/enhancements";

test("MMSF2 enhancement data uses the lv20 values", () => {
  const berserker = getMmsf2EnhancementEffect("berserker");
  const burai = getMmsf2EnhancementEffect("burai");

  assert.ok(berserker);
  assert.equal(berserker.hpBonus, 800);
  assert.equal(berserker.megaBonus, 4);
  assert.equal(berserker.gigaBonus, 2);
  assert.deepEqual(berserker.grantedAbilities, ["アンダーシャツ", "ファーストバリア"]);

  assert.ok(burai);
  assert.equal(burai.hpBonus, 850);
  assert.equal(burai.megaBonus, 2);
  assert.equal(burai.gigaBonus, 1);
  assert.ok(burai.grantedAbilities.includes("ロックマンブライ"));
});

test("MMSF2 enhancement stat summary is formatted for export", () => {
  assert.equal(
    getMmsf2EnhancementStatSummary("shinobi"),
    "HP+700 / A+3 / R+4 / C+4 / Gauge+3 / Mega+4 / Giga+2",
  );
});
