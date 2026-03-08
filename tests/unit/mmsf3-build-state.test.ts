import assert from "node:assert/strict";
import test from "node:test";
import {
  createDefaultMmsf3Sections,
  getNormalizedMmsf3State,
  normalizeMmsf3BuildRecord,
  updateMmsf3AbilityEntries,
  updateMmsf3Noise,
} from "@/lib/mmsf3-build-state";
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
        warRockWeapon: "",
        brotherBandMode: "",
        versionFeature: "",
        crossBrotherNotes: "",
        notes: "",
      },
      mmsf2: {
        tribeNotes: "",
        brotherType: "",
        kizunaTarget: 0,
        bestCombo: "",
        legendCards: [],
        blankCards: [],
        waveCommandCards: [],
        warRockWeapon: "",
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

test("updateMmsf3Noise clears brother roulette when switching to ブライノイズ", () => {
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
              noise: "01",
              rezon: "05",
              whiteCardSetId: "57",
              gigaCard: "0C9",
              megaCard: "0A9",
            },
            ...createDefaultMmsf3Sections().brotherRouletteSlots.slice(1),
          ],
        },
      },
    }),
  );

  const updated = updateMmsf3Noise(seeded, "ブライノイズ");

  assert.equal(updated.gameSpecificSections.mmsf3.noise, "ブライノイズ");
  assert.ok(updated.gameSpecificSections.mmsf3.brotherRouletteSlots.every((slot) => !slot.noise && !slot.rezon && !slot.whiteCardSetId && !slot.gigaCard && !slot.megaCard));
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
