import {
  getMmsf3FolderClassBonuses,
  getMmsf3AbilitySources,
  getMmsf3AbilitySelectionErrors,
  isMmsf3AbilitySourceTracked,
  normalizeMmsf3AbilityEntries,
} from "@/lib/mmsf3/abilities";
import {
  clearMmsf3BrotherSelectionsForBuraNoise,
  getMmsf3BrotherRouletteSelectionErrors,
  getMmsf3ConfiguredSssSlotCount,
  getMmsf3SelectedSssLevelsFromBrotherRouletteSlots,
  normalizeMmsf3BrotherRouletteSlots,
  normalizeMmsf3SssLevels,
} from "@/lib/mmsf3/brother-roulette-state";
import { validateMmsf3FolderCards } from "@/lib/mmsf3/battle-rules";
import { getMmsf3NoiseCardSelectionErrors, normalizeMmsf3NoiseCardIds } from "@/lib/mmsf3/noise-cards";
import { getMmsf3WarRockWeaponSources, isMmsf3WarRockWeapon, isMmsf3WarRockWeaponSourceTracked } from "@/lib/mmsf3/war-rock-weapons";
import {
  DEFAULT_MMSF3_WHITE_CARD_SET_ID,
  getMmsf3RezonCardOptionByLabel,
  getMmsf3WhiteCardSetOption,
} from "@/lib/mmsf3/roulette-data";
import type {
  BuildCardEntry,
  BuildRecord,
  BuildSourceEntry,
  Mmsf3Sections,
} from "@/lib/types";
import { createId, uniqueStrings } from "@/lib/utils";

type LegacyMmsf3Sections = Partial<Mmsf3Sections> & {
  whiteCards?: string[];
  noiseRate?: number;
};

export interface NormalizedMmsf3State {
  noise: string;
  warRockWeapon: string;
  warRockWeaponSources: BuildSourceEntry[];
  playerRezonCard: string;
  whiteCardSetId: string;
  noiseCardIds: string[];
  abilities: BuildCardEntry[];
  abilitySources: BuildSourceEntry[];
  brotherRouletteSlots: Mmsf3Sections["brotherRouletteSlots"];
  sssLevels: string[];
  sssSlotCount: number;
}

export function createDefaultMmsf3Sections(): Mmsf3Sections {
  return {
    noise: "ノーマルロックマン",
    warRockWeapon: "",
    warRockWeaponSources: [],
    pgms: [],
    noiseAbilities: [],
    noiseCardIds: normalizeMmsf3NoiseCardIds(),
    brotherRouletteSlots: normalizeMmsf3BrotherRouletteSlots(undefined),
    sssLevels: normalizeMmsf3SssLevels(undefined),
    nfb: "",
    mergeNoiseTarget: "",
    whiteCardSetId: DEFAULT_MMSF3_WHITE_CARD_SET_ID,
    megaCards: [],
    gigaCards: [],
    teamSize: 0,
    rezonCards: [],
    rivalNoise: "",
    rouletteNotes: "",
    notes: "",
  };
}

function normalizeRouletteValue(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMmsf3PlayerNoise(value: string | null | undefined) {
  const normalized = normalizeRouletteValue(value);
  return normalized || "ノーマルロックマン";
}

function shouldRemovePgmForNormalRockman(value: string) {
  const normalized = value.trim();
  return normalized.includes("ASPGM") || normalized.includes("動画PGM");
}

function normalizeMmsf3RezonCards(values: string[] | undefined) {
  return (values ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 1);
}

function syncOwnedSourceEntries(
  entries: BuildCardEntry[],
  sources: BuildSourceEntry[],
  resolveKnownSources: (name: string) => string[],
) {
  const groupedExistingEntries = new Map<string, BuildSourceEntry[]>();

  for (const sourceEntry of sources) {
    const name = sourceEntry.name.trim();
    if (!name) {
      continue;
    }

    const grouped = groupedExistingEntries.get(name) ?? [];
    grouped.push(sourceEntry);
    groupedExistingEntries.set(name, grouped);
  }

  const nextEntries: BuildSourceEntry[] = [];

  for (const name of uniqueStrings(entries.map((entry) => entry.name.trim()).filter(Boolean))) {
    const existingEntries = [...(groupedExistingEntries.get(name) ?? [])];
    const pullExistingEntry = (predicate: (entry: BuildSourceEntry) => boolean) => {
      const matchIndex = existingEntries.findIndex(predicate);
      if (matchIndex === -1) {
        return null;
      }
      return existingEntries.splice(matchIndex, 1)[0] ?? null;
    };

    const knownSources = uniqueStrings(resolveKnownSources(name).map((source) => source.trim()).filter(Boolean));

    if (knownSources.length > 0) {
      for (const source of knownSources) {
        const matchedEntry =
          pullExistingEntry((entry) => entry.source.trim() === source) ?? pullExistingEntry((entry) => !entry.source.trim());

        nextEntries.push(
          matchedEntry
            ? { ...matchedEntry, name, source }
            : {
                id: createId(),
                name,
                source,
                notes: "",
                isOwned: false,
              },
        );
      }

      for (const entry of existingEntries) {
        nextEntries.push({ ...entry, name });
      }

      continue;
    }

    if (existingEntries.length > 0) {
      for (const entry of existingEntries) {
        nextEntries.push({ ...entry, name });
      }

      continue;
    }

    nextEntries.push({
      id: createId(),
      name,
      source: "",
      notes: "",
      isOwned: false,
    });
  }

  return nextEntries;
}

function getMissingOwnedSourceNames(
  entries: BuildCardEntry[],
  sources: BuildSourceEntry[],
  resolveKnownSources: (name: string) => string[],
) {
  const normalizedSourceEntries = syncOwnedSourceEntries(entries, sources, resolveKnownSources);
  const ownedNames = new Set(
    normalizedSourceEntries
      .filter((entry) => entry.isOwned)
      .map((entry) => entry.name.trim())
      .filter(Boolean),
  );

  return uniqueStrings(entries.map((entry) => entry.name.trim()).filter(Boolean)).filter((name) => !ownedNames.has(name));
}

export function normalizeMmsf3AbilitySources(
  abilities: BuildCardEntry[],
  abilitySources: BuildSourceEntry[],
  version: BuildRecord["version"],
) {
  const normalizedAbilities = normalizeMmsf3AbilityEntries(abilities, version);
  const trackedAbilities = normalizedAbilities.filter((entry) => isMmsf3AbilitySourceTracked(entry.name, version));

  return syncOwnedSourceEntries(trackedAbilities, abilitySources, getMmsf3AbilitySources);
}

export function normalizeMmsf3WarRockWeaponSources(
  warRockWeapon: string,
  warRockWeaponSources: BuildSourceEntry[],
) {
  if (!warRockWeapon.trim() || !isMmsf3WarRockWeapon(warRockWeapon) || !isMmsf3WarRockWeaponSourceTracked(warRockWeapon)) {
    return [];
  }

  return syncOwnedSourceEntries([{ id: "mmsf3-war-rock-weapon", name: warRockWeapon, quantity: 1, notes: "", isRegular: false }], warRockWeaponSources, getMmsf3WarRockWeaponSources);
}

export function getMissingMmsf3AbilitySourceNames(state: Pick<NormalizedMmsf3State, "abilities" | "abilitySources">, version: BuildRecord["version"]) {
  const trackedAbilities = state.abilities.filter((entry) => isMmsf3AbilitySourceTracked(entry.name, version));
  return getMissingOwnedSourceNames(trackedAbilities, state.abilitySources, getMmsf3AbilitySources);
}

export function getMissingMmsf3WarRockWeaponSourceNames(state: Pick<NormalizedMmsf3State, "warRockWeapon" | "warRockWeaponSources">) {
  if (
    !state.warRockWeapon.trim() ||
    !isMmsf3WarRockWeapon(state.warRockWeapon) ||
    !isMmsf3WarRockWeaponSourceTracked(state.warRockWeapon)
  ) {
    return [];
  }

  return getMissingOwnedSourceNames(
    [{ id: "mmsf3-war-rock-weapon", name: state.warRockWeapon, quantity: 1, notes: "", isRegular: false }],
    state.warRockWeaponSources,
    getMmsf3WarRockWeaponSources,
  );
}

export function normalizeMmsf3Sections(rawSections: LegacyMmsf3Sections | undefined, defaults?: Mmsf3Sections) {
  const baseSections = defaults ?? createDefaultMmsf3Sections();
  const nextSections = { ...(rawSections ?? {}) };
  const legacyWhiteCards = (nextSections.whiteCards ?? []).map((item) => item.trim()).filter(Boolean);

  delete nextSections.whiteCards;
  delete nextSections.noiseRate;

  const legacyWhiteCardsNote = legacyWhiteCards.length > 0 ? `旧ホワイトカード入力: ${legacyWhiteCards.join(" / ")}` : "";
  const rouletteNotes =
    legacyWhiteCardsNote && !nextSections.rouletteNotes?.includes(legacyWhiteCardsNote)
      ? [nextSections.rouletteNotes ?? "", legacyWhiteCardsNote].filter(Boolean).join("\n")
      : (nextSections.rouletteNotes ?? baseSections.rouletteNotes);
  const brotherRouletteSlots = normalizeMmsf3BrotherRouletteSlots(nextSections.brotherRouletteSlots, {
    whiteCardSetId: nextSections.whiteCardSetId ?? baseSections.whiteCardSetId,
    gigaCards: nextSections.gigaCards ?? baseSections.gigaCards,
    megaCards: nextSections.megaCards ?? baseSections.megaCards,
    rezonCards: nextSections.rezonCards ?? baseSections.rezonCards,
    sssLevels: nextSections.sssLevels ?? baseSections.sssLevels,
  });

  return {
    ...baseSections,
    ...nextSections,
    noise: normalizeMmsf3PlayerNoise(nextSections.noise ?? baseSections.noise),
    warRockWeapon: normalizeRouletteValue(nextSections.warRockWeapon ?? baseSections.warRockWeapon),
    warRockWeaponSources: (nextSections.warRockWeaponSources ?? baseSections.warRockWeaponSources ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name ?? "",
      source: entry.source ?? "",
      notes: entry.notes ?? "",
      isOwned: false,
    })),
    noiseCardIds: normalizeMmsf3NoiseCardIds(nextSections.noiseCardIds ?? baseSections.noiseCardIds),
    brotherRouletteSlots,
    sssLevels: normalizeMmsf3SssLevels(getMmsf3SelectedSssLevelsFromBrotherRouletteSlots(brotherRouletteSlots)),
    whiteCardSetId: normalizeRouletteValue(nextSections.whiteCardSetId ?? baseSections.whiteCardSetId) || DEFAULT_MMSF3_WHITE_CARD_SET_ID,
    rezonCards: normalizeMmsf3RezonCards(nextSections.rezonCards ?? baseSections.rezonCards),
    pgms:
      normalizeMmsf3PlayerNoise(nextSections.noise ?? baseSections.noise) === "ノーマルロックマン"
        ? (nextSections.pgms ?? baseSections.pgms).filter((item) => !shouldRemovePgmForNormalRockman(item))
        : (nextSections.pgms ?? baseSections.pgms),
    rouletteNotes,
  };
}

export function normalizeMmsf3BuildRecord(build: BuildRecord): BuildRecord {
  if (build.game !== "mmsf3") {
    return build;
  }

  const normalizedAbilities = normalizeMmsf3AbilityEntries(build.commonSections.abilities, build.version);
  const normalizedAbilitySources = normalizeMmsf3AbilitySources(
    normalizedAbilities,
    build.commonSections.abilitySources,
    build.version,
  );
  const normalizedSections = normalizeMmsf3Sections(build.gameSpecificSections.mmsf3, build.gameSpecificSections.mmsf3);
  const normalizedWarRockWeaponSources = normalizeMmsf3WarRockWeaponSources(
    normalizedSections.warRockWeapon,
    normalizedSections.warRockWeaponSources,
  );
  const normalizedBrotherRouletteSlots =
    normalizedSections.noise === "ブライノイズ"
      ? clearMmsf3BrotherSelectionsForBuraNoise(normalizedSections.brotherRouletteSlots)
      : normalizedSections.brotherRouletteSlots;

  return {
    ...build,
    commonSections: {
      ...build.commonSections,
      abilities: normalizedAbilities,
      abilitySources: normalizedAbilitySources,
    },
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...normalizedSections,
        warRockWeaponSources: normalizedWarRockWeaponSources,
        brotherRouletteSlots: normalizedBrotherRouletteSlots,
        sssLevels: normalizeMmsf3SssLevels(getMmsf3SelectedSssLevelsFromBrotherRouletteSlots(normalizedBrotherRouletteSlots)),
      },
    },
  };
}

export function getNormalizedMmsf3State(build: BuildRecord): NormalizedMmsf3State {
  if (build.game !== "mmsf3") {
    throw new Error("getNormalizedMmsf3State can only be used with MMSF3 builds.");
  }

  const normalizedBuild = normalizeMmsf3BuildRecord(build);
  const sections = normalizedBuild.gameSpecificSections.mmsf3;

  return {
    noise: sections.noise,
    warRockWeapon: sections.warRockWeapon,
    warRockWeaponSources: sections.warRockWeaponSources,
    playerRezonCard: sections.rezonCards[0] ?? "",
    whiteCardSetId: sections.whiteCardSetId,
    noiseCardIds: sections.noiseCardIds,
    abilities: normalizedBuild.commonSections.abilities,
    abilitySources: normalizedBuild.commonSections.abilitySources,
    brotherRouletteSlots: sections.brotherRouletteSlots,
    sssLevels: sections.sssLevels,
    sssSlotCount: getMmsf3ConfiguredSssSlotCount(sections.brotherRouletteSlots),
  };
}

export function updateMmsf3Noise(build: BuildRecord, noise: string) {
  if (build.game !== "mmsf3") {
    return build;
  }

  const normalizedNoise = normalizeMmsf3PlayerNoise(noise);
  const nextPgms =
    normalizedNoise === "ノーマルロックマン"
      ? build.gameSpecificSections.mmsf3.pgms.filter((item) => !shouldRemovePgmForNormalRockman(item))
      : build.gameSpecificSections.mmsf3.pgms;

  const nextBuild: BuildRecord = {
    ...build,
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...build.gameSpecificSections.mmsf3,
        noise: normalizedNoise,
        pgms: nextPgms,
      },
    },
  };

  return normalizeMmsf3BuildRecord(nextBuild);
}

export function updateMmsf3PlayerRezonCard(build: BuildRecord, playerRezonCard: string) {
  if (build.game !== "mmsf3") {
    return build;
  }

  return normalizeMmsf3BuildRecord({
    ...build,
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...build.gameSpecificSections.mmsf3,
        rezonCards: playerRezonCard ? [playerRezonCard] : [],
      },
    },
  });
}

export function updateMmsf3WhiteCardSetId(build: BuildRecord, whiteCardSetId: string) {
  if (build.game !== "mmsf3") {
    return build;
  }

  return normalizeMmsf3BuildRecord({
    ...build,
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...build.gameSpecificSections.mmsf3,
        whiteCardSetId,
      },
    },
  });
}

export function updateMmsf3WarRockWeapon(build: BuildRecord, warRockWeapon: string) {
  if (build.game !== "mmsf3") {
    return build;
  }

  return normalizeMmsf3BuildRecord({
    ...build,
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...build.gameSpecificSections.mmsf3,
        warRockWeapon,
      },
    },
  });
}

export function updateMmsf3WarRockWeaponSources(build: BuildRecord, warRockWeaponSources: BuildSourceEntry[]) {
  if (build.game !== "mmsf3") {
    return build;
  }

  return normalizeMmsf3BuildRecord({
    ...build,
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...build.gameSpecificSections.mmsf3,
        warRockWeaponSources,
      },
    },
  });
}

export function updateMmsf3NoiseCardIds(build: BuildRecord, noiseCardIds: string[]) {
  if (build.game !== "mmsf3") {
    return build;
  }

  return normalizeMmsf3BuildRecord({
    ...build,
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...build.gameSpecificSections.mmsf3,
        noiseCardIds: normalizeMmsf3NoiseCardIds(noiseCardIds),
      },
    },
  });
}

export function updateMmsf3AbilityEntries(build: BuildRecord, abilities: BuildCardEntry[]) {
  if (build.game !== "mmsf3") {
    return build;
  }

  return normalizeMmsf3BuildRecord({
    ...build,
    commonSections: {
      ...build.commonSections,
      abilities,
    },
  });
}

export function updateMmsf3AbilitySources(build: BuildRecord, abilitySources: BuildSourceEntry[]) {
  if (build.game !== "mmsf3") {
    return build;
  }

  return normalizeMmsf3BuildRecord({
    ...build,
    commonSections: {
      ...build.commonSections,
      abilitySources,
    },
  });
}

export function updateMmsf3BrotherRouletteSlots(build: BuildRecord, brotherRouletteSlots: Mmsf3Sections["brotherRouletteSlots"]) {
  if (build.game !== "mmsf3") {
    return build;
  }

  const normalizedBrotherRouletteSlots = normalizeMmsf3BrotherRouletteSlots(brotherRouletteSlots);

  return normalizeMmsf3BuildRecord({
    ...build,
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...build.gameSpecificSections.mmsf3,
        brotherRouletteSlots: normalizedBrotherRouletteSlots,
        sssLevels: normalizeMmsf3SssLevels(getMmsf3SelectedSssLevelsFromBrotherRouletteSlots(normalizedBrotherRouletteSlots)),
      },
    },
  });
}

export function updateMmsf3SssLevels(build: BuildRecord, sssLevels: string[]) {
  if (build.game !== "mmsf3") {
    return build;
  }

  const nextBrotherRouletteSlots: Mmsf3Sections["brotherRouletteSlots"] = normalizeMmsf3BrotherRouletteSlots(
    build.gameSpecificSections.mmsf3.brotherRouletteSlots,
  ).map((slot) =>
    slot.slotType === "sss"
      ? {
          ...slot,
          slotType: "brother" as const,
          sssLevel: "",
        }
      : slot,
  );
  const availableSlots = nextBrotherRouletteSlots.filter(
    (slot) => !slot.version && !slot.noise && !slot.rezon && !slot.whiteCardSetId && !slot.gigaCard && !slot.megaCard,
  );

  normalizeMmsf3SssLevels(sssLevels)
    .filter(Boolean)
    .forEach((level, index) => {
      const targetSlot = availableSlots[index];
      if (!targetSlot) {
        return;
      }

      targetSlot.slotType = "sss";
      targetSlot.sssLevel = level;
    });

  return normalizeMmsf3BuildRecord({
    ...build,
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...build.gameSpecificSections.mmsf3,
        brotherRouletteSlots: nextBrotherRouletteSlots,
        sssLevels: normalizeMmsf3SssLevels(sssLevels),
      },
    },
  });
}

export function validateMmsf3BuildState(build: BuildRecord, state = getNormalizedMmsf3State(build)) {
  const errors: string[] = [];
  const folderValidation = validateMmsf3FolderCards(
    build.commonSections.cards,
    build.version,
    getMmsf3FolderClassBonuses(state.abilities),
  );
  const abilityValidation = getMmsf3AbilitySelectionErrors(state.abilities, state.noise, state.sssSlotCount);

  errors.push(...folderValidation.errors);
  errors.push(...abilityValidation.errors);
  errors.push(...getMmsf3NoiseCardSelectionErrors(state.noiseCardIds));
  errors.push(...getMmsf3BrotherRouletteSelectionErrors(state.brotherRouletteSlots));

  if (!getMmsf3WhiteCardSetOption(state.whiteCardSetId)) {
    errors.push("ホワイトカードが不正です。");
  }

  if (state.playerRezonCard && !getMmsf3RezonCardOptionByLabel(state.playerRezonCard)) {
    errors.push("レゾンカードが不正です。");
  }

  if (state.warRockWeapon && !isMmsf3WarRockWeapon(state.warRockWeapon)) {
    errors.push("ウォーロック装備が不正です。");
  }

  return {
    errors,
    folderValidation,
    abilityValidation,
  };
}
