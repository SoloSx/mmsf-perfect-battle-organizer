import assert from "node:assert/strict";
import test from "node:test";
import { getMmsf3AbilitySelectionErrors, getMmsf3FolderClassBonuses } from "@/lib/mmsf3/abilities";
import { validateMmsf3FolderCards } from "@/lib/mmsf3/battle-rules";
import { getMmsf3BrotherRouletteSelectionErrors } from "@/lib/mmsf3/brother-roulette-state";
import {
  createDefaultMmsf3Sections,
  getNormalizedMmsf3State,
  normalizeMmsf3BuildRecord,
  updateMmsf3AbilityEntries,
  updateMmsf3Noise,
  updateMmsf3WarRockWeapon,
} from "@/lib/mmsf3/build-state";
import type { BuildRecord } from "@/lib/types";

function createBaseBuild(overrides: Partial<BuildRecord> = {}): BuildRecord {
  const baseBuild: BuildRecord = {
    id: "build-test",
    title: "",
    game: "mmsf3",
    version: "black-ace",
    commonSections: {
      overview: "",
      tags: [],
      cards: [],
      cardSources: [],
      abilities: [],
      abilitySources: [],
      brothers: [],
      strategyName: "",
      strategyNote: "",
    },
    gameSpecificSections: {
      mmsf1: {
        enhancement: "",
        warRockWeapon: "",
        warRockWeaponSources: [],
        brotherBandMode: "",
        versionFeature: "",
        crossBrotherNotes: "",
        notes: "",
      },
      mmsf2: {
        starCards: [],
        blankCards: [],
        defaultTribeAbilityEnabled: true,
        enhancement: "",
        warRockWeapon: "",
        warRockWeaponSources: [],
        kokouNoKakera: false,
        notes: "",
      },
      mmsf3: createDefaultMmsf3Sections(),
    },
    strategyTemplateId: null,
    createdAt: "2026-03-08T00:00:00.000Z",
    updatedAt: "2026-03-08T00:00:00.000Z",
  };

  return {
    ...baseBuild,
    ...overrides,
    commonSections: {
      ...baseBuild.commonSections,
      ...(overrides.commonSections ?? {}),
    },
    gameSpecificSections: {
      ...baseBuild.gameSpecificSections,
      ...(overrides.gameSpecificSections ?? {}),
      mmsf3: {
        ...baseBuild.gameSpecificSections.mmsf3,
        ...(overrides.gameSpecificSections?.mmsf3 ?? {}),
      },
    },
  };
}

test("normalizeMmsf3BuildRecord migrates legacy roulette fields into the fixed roulette slots", () => {
  const legacySections = {
    ...createDefaultMmsf3Sections(),
    whiteCardSetId: "57",
    megaCards: ["アシッドエース"],
    gigaCards: ["Gメテオレイザー"],
    rezonCards: ["ソード"],
    whiteCards: ["旧セットA"],
    noiseRate: 70,
  };
  const build = createBaseBuild({
    gameSpecificSections: {
      mmsf1: createBaseBuild().gameSpecificSections.mmsf1,
      mmsf2: createBaseBuild().gameSpecificSections.mmsf2,
      mmsf3: legacySections as unknown as BuildRecord["gameSpecificSections"]["mmsf3"],
    },
  });

  const normalized = normalizeMmsf3BuildRecord(build);
  const topLeftSlot = normalized.gameSpecificSections.mmsf3.brotherRouletteSlots[0];

  assert.equal(topLeftSlot.whiteCardSetId, "57");
  assert.equal(topLeftSlot.megaCard, "0A9");
  assert.equal(topLeftSlot.gigaCard, "0C9");
  assert.equal(topLeftSlot.rezon, "05");
  assert.match(normalized.gameSpecificSections.mmsf3.rouletteNotes, /旧ホワイトカード入力: 旧セットA/);
});

test("normalizeMmsf3BuildRecord keeps the version default PGM and excludes it from tracked sources", () => {
  const normalized = normalizeMmsf3BuildRecord(createBaseBuild());
  const abilityNames = normalized.commonSections.abilities.map((entry) => entry.name);
  const sourceNames = normalized.commonSections.abilitySources.map((entry) => entry.name);

  assert.deepEqual(abilityNames, ["エースＰＧＭ/0"]);
  assert.deepEqual(sourceNames, []);
});

test("updateMmsf3Noise clears brother slots but keeps SSS when switching to ブライノイズ", () => {
  const seeded = normalizeMmsf3BuildRecord(
    createBaseBuild({
      gameSpecificSections: {
        mmsf1: createBaseBuild().gameSpecificSections.mmsf1,
        mmsf2: createBaseBuild().gameSpecificSections.mmsf2,
        mmsf3: {
          ...createDefaultMmsf3Sections(),
          brotherRouletteSlots: [
            {
              position: "top_left",
              slotType: "brother",
              sssLevel: "",
              version: "black-ace",
              noise: "01",
              rezon: "05",
              whiteCardSetId: "57",
              gigaCard: "0C9",
              megaCard: "0A9",
            },
            {
              position: "top_right",
              slotType: "sss",
              sssLevel: "32",
              version: "",
              noise: "",
              rezon: "",
              whiteCardSetId: "",
              gigaCard: "",
              megaCard: "",
            },
            ...createDefaultMmsf3Sections().brotherRouletteSlots.slice(2),
          ],
        },
      },
    }),
  );

  const updated = updateMmsf3Noise(seeded, "ブライノイズ");

  assert.equal(updated.gameSpecificSections.mmsf3.noise, "ブライノイズ");
  const [topLeftSlot, topRightSlot] = updated.gameSpecificSections.mmsf3.brotherRouletteSlots;

  assert.equal(topLeftSlot?.slotType, "brother");
  assert.equal(topLeftSlot?.version, "");
  assert.equal(topLeftSlot?.noise, "");
  assert.equal(topLeftSlot?.rezon, "");
  assert.equal(topLeftSlot?.whiteCardSetId, "");
  assert.equal(topLeftSlot?.gigaCard, "");
  assert.equal(topLeftSlot?.megaCard, "");
  assert.equal(topRightSlot?.slotType, "sss");
  assert.equal(topRightSlot?.sssLevel, "32");
  assert.deepEqual(updated.gameSpecificSections.mmsf3.sssLevels.filter(Boolean), ["32"]);
});

test("updateMmsf3AbilityEntries normalizes entries and syncs tracked ability sources", () => {
  const build = normalizeMmsf3BuildRecord(createBaseBuild());
  const updated = updateMmsf3AbilityEntries(build, [
    ...build.commonSections.abilities,
    { id: "ability-1", name: "HP+50", quantity: 1, notes: "", isRegular: false },
  ]);
  const state = getNormalizedMmsf3State(updated);

  assert.deepEqual(state.abilities.map((entry) => entry.name), ["エースＰＧＭ/0", "ＨＰ+50/100"]);
  assert.ok(state.abilitySources.length > 0);
  assert.ok(state.abilitySources.every((entry) => entry.name === "ＨＰ+50/100"));
  assert.ok(state.abilitySources[0]?.source.length > 0);
});

test("updateMmsf3WarRockWeapon excludes initial equipment from tracked source entries", () => {
  const build = normalizeMmsf3BuildRecord(createBaseBuild());
  const updated = updateMmsf3WarRockWeapon(build, "スルドイキバ");
  const state = getNormalizedMmsf3State(updated);

  assert.equal(state.warRockWeapon, "スルドイキバ");
  assert.equal(state.warRockWeaponSources.length, 0);
});

test("normalizeMmsf3BuildRecord migrates legacy SSS levels into brother slots", () => {
  const build = createBaseBuild();
  (build.gameSpecificSections.mmsf3 as unknown as { brotherRouletteSlots?: unknown }).brotherRouletteSlots = undefined;
  build.gameSpecificSections.mmsf3.sssLevels = ["4", "32", "G24"];

  const state = getNormalizedMmsf3State(normalizeMmsf3BuildRecord(build));

  assert.equal(state.sssSlotCount, 3);
  assert.deepEqual(state.sssLevels, ["4", "32", "G24"]);
  assert.equal(state.brotherRouletteSlots[0]?.slotType, "sss");
  assert.equal(state.brotherRouletteSlots[0]?.sssLevel, "4");
  assert.equal(state.brotherRouletteSlots[1]?.slotType, "sss");
  assert.equal(state.brotherRouletteSlots[1]?.sssLevel, "32");
  assert.equal(state.brotherRouletteSlots[2]?.slotType, "sss");
  assert.equal(state.brotherRouletteSlots[2]?.sssLevel, "G24");
});

test("getMmsf3AbilitySelectionErrors lowers the point cap by active SSS slots", () => {
  const seededBuild = normalizeMmsf3BuildRecord(
    createBaseBuild({
      commonSections: {
        ...createBaseBuild().commonSections,
        abilities: [
          { id: "a0", name: "エースＰＧＭ/0", quantity: 0, notes: "", isRegular: false },
          { id: "a1", name: "ＨＰ+500/610", quantity: 610, notes: "", isRegular: false },
          { id: "a2", name: "ＨＰ+500/570", quantity: 570, notes: "", isRegular: false },
          { id: "a3", name: "ファーストオーラ/400", quantity: 400, notes: "", isRegular: false },
        ],
      },
      gameSpecificSections: {
        mmsf1: createBaseBuild().gameSpecificSections.mmsf1,
        mmsf2: createBaseBuild().gameSpecificSections.mmsf2,
        mmsf3: {
          ...createDefaultMmsf3Sections(),
          brotherRouletteSlots: [
            { position: "top_left", slotType: "sss", sssLevel: "4", version: "", noise: "", rezon: "", whiteCardSetId: "", gigaCard: "", megaCard: "" },
            { position: "top_right", slotType: "sss", sssLevel: "32", version: "", noise: "", rezon: "", whiteCardSetId: "", gigaCard: "", megaCard: "" },
            { position: "mid_left", slotType: "sss", sssLevel: "G24", version: "", noise: "", rezon: "", whiteCardSetId: "", gigaCard: "", megaCard: "" },
            ...createDefaultMmsf3Sections().brotherRouletteSlots.slice(3),
          ],
        },
      },
    }),
  );

  const state = getNormalizedMmsf3State(seededBuild);
  const result = getMmsf3AbilitySelectionErrors(state.abilities, state.noise, state.sssSlotCount);

  assert.equal(result.limit, 1480);
  assert.equal(result.totalCost, 1580);
  assert.ok(result.errors.includes("アビリティ消費Pは 1480 以内にしてください。"));
});

test("getMmsf3BrotherRouletteSelectionErrors rejects ブライ as a brother merge noise", () => {
  const result = getMmsf3BrotherRouletteSelectionErrors([
    {
      position: "top_left",
      slotType: "brother",
      sssLevel: "",
      version: "",
      noise: "0B",
      rezon: "",
      whiteCardSetId: "",
      gigaCard: "",
      megaCard: "",
    },
    ...createDefaultMmsf3Sections().brotherRouletteSlots.slice(1),
  ]);

  assert.ok(result.includes("左上 のマージノイズが不正です。"));
});

test("getMmsf3BrotherRouletteSelectionErrors rejects an invalid brother version", () => {
  const result = getMmsf3BrotherRouletteSelectionErrors([
    {
      position: "top_left",
      slotType: "brother",
      sssLevel: "",
      version: "pegasus" as never,
      noise: "",
      rezon: "",
      whiteCardSetId: "",
      gigaCard: "",
      megaCard: "",
    },
    ...createDefaultMmsf3Sections().brotherRouletteSlots.slice(1),
  ]);

  assert.ok(result.includes("左上 のバージョンが不正です。"));
});

test("validateMmsf3FolderCards rejects version-exclusive giga cards from the other version", () => {
  const result = validateMmsf3FolderCards(
    [{ id: "giga-1", name: "Gメテオレイザー", quantity: 1, notes: "", isRegular: false }],
    "black-ace",
  );

  assert.ok(result.errors.includes("ギガカード「Gメテオレイザー」はブラックエースでは使用できません。"));
  assert.ok(
    validateMmsf3FolderCards([{ id: "giga-2", name: "ウィングブレード", quantity: 1, notes: "", isRegular: false }], "red-joker").errors.includes(
      "ギガカード「ウィングブレード」はレッドジョーカーでは使用できません。",
    ),
  );
});

test("validateMmsf3FolderCards allows extra mega and giga slots from class-up abilities", () => {
  const classBonuses = getMmsf3FolderClassBonuses([
    { id: "a1", name: "メガクラス+1/440", quantity: 440, notes: "", isRegular: false },
    { id: "a2", name: "ギガクラス+1/750", quantity: 750, notes: "", isRegular: false },
  ]);

  const result = validateMmsf3FolderCards(
    [
      { id: "m1", name: "スペードマグネッツ", quantity: 1, notes: "", isRegular: false },
      { id: "m2", name: "ダイヤアイスバーン", quantity: 1, notes: "", isRegular: false },
      { id: "m3", name: "クラブストロング", quantity: 1, notes: "", isRegular: false },
      { id: "m4", name: "クイーンヴァルゴ", quantity: 1, notes: "", isRegular: false },
      { id: "m5", name: "ジャックコーヴァス", quantity: 1, notes: "", isRegular: false },
      { id: "m6", name: "オヒュカスクイーン", quantity: 1, notes: "", isRegular: false },
      { id: "g1", name: "ウィングブレード", quantity: 1, notes: "", isRegular: false },
      { id: "g2", name: "ダークネスホール", quantity: 1, notes: "", isRegular: false },
    ],
    "black-ace",
    classBonuses,
  );

  assert.deepEqual(result.errors, []);
});

test("getMmsf3BrotherRouletteSelectionErrors rejects version-exclusive giga cards from the other version", () => {
  const result = getMmsf3BrotherRouletteSelectionErrors([
    {
      position: "top_left",
      slotType: "brother",
      sssLevel: "",
      version: "black-ace",
      noise: "",
      rezon: "",
      whiteCardSetId: "",
      gigaCard: "0C9",
      megaCard: "",
    },
    ...createDefaultMmsf3Sections().brotherRouletteSlots.slice(1),
  ]);

  assert.ok(result.includes("左上 のギガカード「Gメテオレイザー」はブラックエースでは設定できません。"));
  assert.ok(
    getMmsf3BrotherRouletteSelectionErrors([
      {
        position: "top_left",
        slotType: "brother",
        sssLevel: "",
        version: "red-joker",
        noise: "",
        rezon: "",
        whiteCardSetId: "",
        gigaCard: "0C4",
        megaCard: "",
      },
      ...createDefaultMmsf3Sections().brotherRouletteSlots.slice(1),
    ]).includes("左上 のギガカード「ウィングブレード」はレッドジョーカーでは設定できません。"),
  );
});
