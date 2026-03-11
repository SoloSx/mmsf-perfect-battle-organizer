import assert from "node:assert/strict";
import test from "node:test";
import { findCardAssetByName } from "@/lib/assets";

test("MMSF1 version-locked mega cards resolve preview assets across versions", () => {
  assert.equal(
    findCardAssetByName("mmsf1", "ペガサスマジック", "leo")?.localPath,
    "/assets/cards/SF1/Cards/m28p_PegasusMagic.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "ペガサスマジックEX", "leo")?.localPath,
    "/assets/cards/SF1/Cards/m29p_PegasusMagicEX.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "ペガサスマジックSP", "leo")?.localPath,
    "/assets/cards/SF1/Cards/m30p_PegasusMagicSP.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "ペガサスマジックGX", "leo")?.localPath,
    "/assets/cards/SF1/Cards/g1p_PegasusMagicGX.png",
  );

  assert.equal(
    findCardAssetByName("mmsf1", "レオキングダム", "dragon")?.localPath,
    "/assets/cards/SF1/Cards/m28l_LeoKingdom.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "レオキングダムEX", "dragon")?.localPath,
    "/assets/cards/SF1/Cards/m29l_LeoKingdomEX.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "レオキングダムSP", "dragon")?.localPath,
    "/assets/cards/SF1/Cards/m30l_LeoKingdomSP.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "レオキングダムGX", "dragon")?.localPath,
    "/assets/cards/SF1/Cards/g1l_LeoKingdomGX.png",
  );

  assert.equal(
    findCardAssetByName("mmsf1", "ドラゴンスカイ", "pegasus")?.localPath,
    "/assets/cards/SF1/Cards/m28d_DragonSky.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "ドラゴンスカイEX", "pegasus")?.localPath,
    "/assets/cards/SF1/Cards/m29d_DragonSkyEX.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "ドラゴンスカイSP", "pegasus")?.localPath,
    "/assets/cards/SF1/Cards/m30d_DragonSkySP.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "ドラゴンスカイGX", "pegasus")?.localPath,
    "/assets/cards/SF1/Cards/g1d_DragonSkyGX.png",
  );
});

test("MMSF1 Boktai cards resolve preview assets", () => {
  assert.equal(
    findCardAssetByName("mmsf1", "タイヨウジュウ")?.localPath,
    "/assets/cards/SF1/Cards/e01_TaiyouJuu.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "アンコクケンＶ２")?.localPath,
    "/assets/cards/SF1/Cards/e05_AnkokuKenV2.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "アーシュラＶ３")?.localPath,
    "/assets/cards/SF1/Cards/e09_UrsulaV3_actual.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "トーベ")?.localPath,
    "/assets/cards/SF1/Cards/e10_Tove.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "オトフリートＶ２")?.localPath,
    "/assets/cards/SF1/Cards/e14_OtfriedV2.png",
  );
  assert.equal(
    findCardAssetByName("mmsf1", "リザＶ３")?.localPath,
    "/assets/cards/SF1/Cards/e18_LizaV3_actual.png",
  );
});

test("MMSF1 Andromeda resolves preview asset", () => {
  assert.equal(
    findCardAssetByName("mmsf1", "アンドロメダ")?.localPath,
    "/assets/cards/SF1/Cards/Andromeda.png",
  );
});
