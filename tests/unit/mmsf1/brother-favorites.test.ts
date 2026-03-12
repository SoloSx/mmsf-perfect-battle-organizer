import assert from "node:assert/strict"
import test from "node:test"
import { restoreEditorDraft } from "@/components/editor/build-editor-state"
import { normalizeBuild } from "@/hooks/use-app-data"
import { createDefaultMmsf3Sections } from "@/lib/mmsf3/build-state"
import type { BuildRecord } from "@/lib/types"

function createBaseMmsf1Build(overrides: Partial<BuildRecord> = {}): BuildRecord {
  const baseBuild: BuildRecord = {
    id: "build-test",
    title: "MMSF1 Build",
    game: "mmsf1",
    version: "pegasus",
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
    createdAt: "2026-03-12T00:00:00.000Z",
    updatedAt: "2026-03-12T00:00:00.000Z",
  }

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
      mmsf1: {
        ...baseBuild.gameSpecificSections.mmsf1,
        ...(overrides.gameSpecificSections?.mmsf1 ?? {}),
      },
      mmsf2: {
        ...baseBuild.gameSpecificSections.mmsf2,
        ...(overrides.gameSpecificSections?.mmsf2 ?? {}),
      },
      mmsf3: {
        ...baseBuild.gameSpecificSections.mmsf3,
        ...(overrides.gameSpecificSections?.mmsf3 ?? {}),
      },
    },
  }
}

test("normalizeBuild preserves blank MMSF1 brother favorite slots after loading saved data", () => {
  const normalizedBuild = normalizeBuild(
    createBaseMmsf1Build({
      commonSections: {
        brothers: [
          {
            id: "brother-1",
            name: "響 ミソラ",
            kind: "story",
            favoriteCards: ["ホタルゲリ3", "ゴーストパルス3", "", "", "ペガサスマジックSP", "ハープノートSP"],
            rezonCard: "pegasus",
            notes: "",
          },
        ],
      },
    }),
  )

  assert.deepEqual(
    normalizedBuild.commonSections.brothers[0]?.favoriteCards,
    ["ホタルゲリ3", "ゴーストパルス3", "", "", "ペガサスマジックSP", "ハープノートSP"],
  )
})

test("restoreEditorDraft preserves MMSF1 brother favorite slots for the edit form", () => {
  const baseBuild = createBaseMmsf1Build({
    commonSections: {
      brothers: [
        {
          id: "brother-1",
          name: "白金 ルナ",
          kind: "story",
          favoriteCards: ["", "", "", "", "", ""],
          rezonCard: "leo",
          notes: "",
        },
      ],
    },
  })
  const restoredBuild = restoreEditorDraft(
    baseBuild,
    JSON.stringify({
      commonSections: {
        brothers: [
          {
            id: "brother-1",
            name: "白金 ルナ",
            kind: "story",
            favoriteCards: ["プラズマガン3", "", "", "", "レオキングダムSP", "オックスファイアSP"],
            rezonCard: "leo",
            notes: "",
          },
        ],
      },
    }),
  )

  assert.deepEqual(
    restoredBuild?.commonSections.brothers[0]?.favoriteCards,
    ["プラズマガン3", "", "", "", "レオキングダムSP", "オックスファイアSP"],
  )
})
