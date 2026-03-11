import assert from "node:assert/strict";
import test from "node:test";
import { getMmsf1WarRockWeaponSources, MMSF1_WAR_ROCK_WEAPON_NAMES } from "@/lib/mmsf1/war-rock-weapons";

test("MMSF1 war rock weapons follow the Wily item list", () => {
  assert.equal(MMSF1_WAR_ROCK_WEAPON_NAMES.length, 21);
  assert.ok(MMSF1_WAR_ROCK_WEAPON_NAMES.includes("ベアーリング"));
  assert.ok(MMSF1_WAR_ROCK_WEAPON_NAMES.includes("アクマノヒトミ"));
  assert.ok(MMSF1_WAR_ROCK_WEAPON_NAMES.includes("マジックブレス"));
  assert.ok(MMSF1_WAR_ROCK_WEAPON_NAMES.includes("エグゼブラスター"));
  assert.ok(MMSF1_WAR_ROCK_WEAPON_NAMES.includes("ＦＭブレスレット"));
  assert.ok(MMSF1_WAR_ROCK_WEAPON_NAMES.includes("リュウセイパワー"));
});

test("getMmsf1WarRockWeaponSources returns the tracked source text", () => {
  assert.deepEqual(getMmsf1WarRockWeaponSources("スルドイキバ"), ["初期装備"]);
  assert.deepEqual(getMmsf1WarRockWeaponSources("マジックブレス"), ["暗号メール"]);
  assert.deepEqual(getMmsf1WarRockWeaponSources("ＦＭブレスレット"), ["ボクタイ"]);
  assert.deepEqual(
    getMmsf1WarRockWeaponSources("カイザーナックル"),
    ["うちゅうくうかんの電波3: 「こどくのココロ」で開く扉から来たところ"],
  );
});
