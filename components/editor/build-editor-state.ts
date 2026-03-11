"use client";

import { getMissingSourceNames, syncSourceEntries } from "@/components/source-list-editor";
import { validateLimitedCardOwnership } from "@/lib/card-ownership-rules";
import {
  validateMmsf1BrotherFavoriteCards,
  validateMmsf1FolderCards,
} from "@/lib/mmsf1/battle-rules";
import {
  getDuplicateMmsf1UniqueBrotherNames,
} from "@/lib/mmsf1/brothers";
import { normalizeMmsf1EnhancementValue } from "@/lib/mmsf1/enhancement";
import { getMmsf1WarRockWeaponSources } from "@/lib/mmsf1/war-rock-weapons";
import {
  getMmsf2AbilitySelectionErrors,
  getMmsf2AbilitySources,
  normalizeMmsf2AbilityEntries,
} from "@/lib/mmsf2/abilities";
import {
  getMmsf2BlankCardTotalLimit,
  getMmsf2NormalCardTotalLimit,
  validateMmsf2FolderCards,
  validateMmsf2FolderTotal,
  validateMmsf2StarCards,
} from "@/lib/mmsf2/battle-rules";
import { getMmsf2EnhancementEffect } from "@/lib/mmsf2/enhancements";
import { getMmsf2BlankCardDefinition } from "@/lib/mmsf2/folder-cards";
import { getMmsf2BlankCardSuggestions, getCardSuggestions, getKnownCardSources } from "@/lib/guide-card-catalog";
import {
  getMissingMmsf3AbilitySourceNames,
  getMissingMmsf3WarRockWeaponSourceNames,
  getNormalizedMmsf3State,
  isMmsf3GeminiNoise,
  normalizeMmsf3BuildRecord,
  normalizeMmsf3Sections,
  validateMmsf3BuildState,
} from "@/lib/mmsf3/build-state";
import { getMmsf2WarRockWeaponSources } from "@/lib/mmsf2/war-rock-weapons";
import {
  getDefaultVersionForGame,
  getVersionRuleSet,
  VERSION_LABELS,
  VERSIONS_BY_GAME,
} from "@/lib/rules";
import type {
  BrotherProfile,
  BuildCardEntry,
  BuildRecord,
  CommonSections,
  GameId,
  Mmsf3BrotherRouletteSlot,
  VersionId,
} from "@/lib/types";
import { createId, uniqueStrings } from "@/lib/utils";

export const EDITOR_DRAFT_STORAGE_KEY_PREFIX = "mmsf-perfect-battle-organizer/editor-draft/v3";

export function cloneBuild(buildRecord: BuildRecord) {
  return JSON.parse(JSON.stringify(buildRecord)) as BuildRecord;
}

export function buildEmptyCard(): BuildCardEntry {
  return { id: createId(), name: "", quantity: 1, notes: "", isRegular: false, favoriteCount: 0 };
}

export function normalizeBuildCardEntry(cardEntry: BuildCardEntry): BuildCardEntry {
  const quantity = Number.isFinite(cardEntry.quantity) ? Math.max(1, Math.trunc(cardEntry.quantity)) : 1;
  const rawFavoriteCount = cardEntry.favoriteCount;
  const favoriteCount = typeof rawFavoriteCount === "number" && Number.isFinite(rawFavoriteCount)
    ? Math.max(0, Math.min(quantity, Math.trunc(rawFavoriteCount)))
    : cardEntry.isRegular
      ? 1
      : 0;

  return {
    id: cardEntry.id,
    name: cardEntry.name ?? "",
    quantity,
    notes: cardEntry.notes ?? "",
    isRegular: Boolean(cardEntry.isRegular),
    favoriteCount,
  };
}

export function ensureTrailingEmptyCardEntry(
  cardEntries: BuildCardEntry[],
  {
    maxEntries,
    totalLimit,
  }: {
    maxEntries?: number;
    totalLimit?: number;
  } = {},
) {
  const normalizedCardEntries = cardEntries.map((cardEntry) => normalizeBuildCardEntry(cardEntry));
  const filledCardEntries = normalizedCardEntries.filter((cardEntry) => cardEntry.name.trim());
  const trailingEmptyCardEntry =
    normalizedCardEntries.find((cardEntry) => !cardEntry.name.trim()) ?? buildEmptyCard();
  const canAppendByCount = typeof maxEntries !== "number" || filledCardEntries.length < maxEntries;
  const filledTotal = filledCardEntries.reduce((sum, cardEntry) => sum + cardEntry.quantity, 0);
  const canAppendByTotal = typeof totalLimit !== "number" || filledTotal < totalLimit;

  if (canAppendByCount && canAppendByTotal) {
    return [...filledCardEntries, trailingEmptyCardEntry];
  }

  return filledCardEntries;
}

export function hasOnlyTrailingEmptyCardEntry(cardEntries: BuildCardEntry[]) {
  if (cardEntries.length === 0) {
    return false;
  }

  return cardEntries.every((cardEntry, index) => {
    if (index === cardEntries.length - 1) {
      return !cardEntry.name.trim();
    }

    return cardEntry.name.trim().length > 0;
  });
}

export function normalizeBuildSourceEntry(
  sourceEntry: CommonSections["abilitySources"][number],
): CommonSections["abilitySources"][number] {
  return {
    id: sourceEntry.id,
    name: sourceEntry.name ?? "",
    source: sourceEntry.source ?? "",
    notes: sourceEntry.notes ?? "",
    isOwned: false,
  };
}

export function stripTransientBuildFlags(buildRecord: BuildRecord): BuildRecord {
  return {
    ...buildRecord,
    commonSections: {
      ...buildRecord.commonSections,
      cardSources: buildRecord.commonSections.cardSources.map((sourceEntry) => ({
        ...sourceEntry,
        isOwned: false,
      })),
      abilitySources: buildRecord.commonSections.abilitySources.map((sourceEntry) => ({
        ...sourceEntry,
        isOwned: false,
      })),
    },
    gameSpecificSections: {
      ...buildRecord.gameSpecificSections,
      mmsf3: {
        ...buildRecord.gameSpecificSections.mmsf3,
        warRockWeaponSources: buildRecord.gameSpecificSections.mmsf3.warRockWeaponSources.map(
          (sourceEntry) => ({
            ...sourceEntry,
            isOwned: false,
          }),
        ),
      },
    },
  };
}

export function normalizeMmsf2BlankCardEntries(cardEntries: BuildCardEntry[]) {
  return cardEntries.map((cardEntry) => {
    const normalizedCardEntry = normalizeBuildCardEntry(cardEntry);
    const blankCardDefinition = getMmsf2BlankCardDefinition(normalizedCardEntry.name);

    return blankCardDefinition
      ? { ...normalizedCardEntry, name: blankCardDefinition.contentKey }
      : normalizedCardEntry;
  });
}

export function createMmsf2BlankCardDraftEntries(
  blankCardEntries: BuildCardEntry[],
  blankCardSlotLimit: number,
  preserveFilledOverflow = false,
) {
  const normalizedBlankCardEntries = normalizeMmsf2BlankCardEntries(blankCardEntries);
  const filledBlankCardEntries = normalizedBlankCardEntries.filter((cardEntry) => cardEntry.name.trim());
  const trailingEmptyCardEntry =
    normalizedBlankCardEntries.find((cardEntry) => !cardEntry.name.trim()) ?? buildEmptyCard();
  const preservedFilledEntries =
    preserveFilledOverflow || filledBlankCardEntries.length <= blankCardSlotLimit
      ? filledBlankCardEntries
      : filledBlankCardEntries.slice(0, blankCardSlotLimit);

  if (preservedFilledEntries.length < blankCardSlotLimit) {
    return [...preservedFilledEntries, trailingEmptyCardEntry];
  }

  return preservedFilledEntries;
}

export function getMmsf2TrackedCards(buildRecord: BuildRecord) {
  return [...buildRecord.commonSections.cards, ...buildRecord.gameSpecificSections.mmsf2.blankCards];
}

export function withAutoExpandedEditorRows(buildRecord: BuildRecord): BuildRecord {
  const nextFolderEntries = ensureTrailingEmptyCardEntry(buildRecord.commonSections.cards, {
    totalLimit:
      buildRecord.game === "mmsf2"
        ? getMmsf2NormalCardTotalLimit(
            buildRecord.gameSpecificSections.mmsf2.starCards,
            buildRecord.gameSpecificSections.mmsf2.blankCards,
            getVersionRuleSet(buildRecord.version).folderLimit,
          )
        : undefined,
  });
  const normalizedAbilityEntries =
    buildRecord.game === "mmsf2"
      ? normalizeMmsf2AbilityEntries(
          buildRecord.commonSections.abilities,
          buildRecord.version,
          buildRecord.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled,
        )
      : buildRecord.commonSections.abilities;
  const nextAbilityEntries = ensureTrailingEmptyCardEntry(normalizedAbilityEntries);
  const normalizedBlankCardEntries =
    buildRecord.game === "mmsf2"
      ? createMmsf2BlankCardDraftEntries(
          buildRecord.gameSpecificSections.mmsf2.blankCards,
          getMmsf2BlankCardTotalLimit(
            nextFolderEntries,
            buildRecord.gameSpecificSections.mmsf2.starCards,
            getVersionRuleSet(buildRecord.version).folderLimit,
          ),
          true,
        )
      : buildRecord.gameSpecificSections.mmsf2.blankCards;

  return {
    ...buildRecord,
    commonSections: {
      ...buildRecord.commonSections,
      cards: nextFolderEntries,
      abilities: nextAbilityEntries,
    },
    gameSpecificSections: {
      ...buildRecord.gameSpecificSections,
      mmsf2: {
        ...buildRecord.gameSpecificSections.mmsf2,
        blankCards: normalizedBlankCardEntries,
      },
    },
  };
}

export function syncMmsf2WarRockWeaponSources(
  warRockWeaponName: string,
  sourceEntries: CommonSections["cardSources"],
) {
  const trimmedWeaponName = warRockWeaponName.trim();

  if (!trimmedWeaponName) {
    return [];
  }

  return syncSourceEntries([{ name: trimmedWeaponName }], sourceEntries, getMmsf2WarRockWeaponSources);
}

export function syncMmsf1WarRockWeaponSources(
  warRockWeaponName: string,
  sourceEntries: CommonSections["cardSources"],
) {
  const trimmedWeaponName = warRockWeaponName.trim();

  if (!trimmedWeaponName) {
    return [];
  }

  return syncSourceEntries([{ name: trimmedWeaponName }], sourceEntries, getMmsf1WarRockWeaponSources);
}

export function haveSameCardEntries(leftEntries: BuildCardEntry[], rightEntries: BuildCardEntry[]) {
  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  for (let index = 0; index < leftEntries.length; index += 1) {
    const leftEntry = leftEntries[index];
    const rightEntry = rightEntries[index];

    if (
      leftEntry.id !== rightEntry.id ||
      leftEntry.name !== rightEntry.name ||
      leftEntry.quantity !== rightEntry.quantity ||
      leftEntry.notes !== rightEntry.notes ||
      leftEntry.isRegular !== rightEntry.isRegular ||
      leftEntry.favoriteCount !== rightEntry.favoriteCount
    ) {
      return false;
    }
  }

  return true;
}

function clampList(values: string[], max?: number) {
  const uniqueValues = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
  return typeof max === "number" ? uniqueValues.slice(0, max) : uniqueValues;
}

export function buildEmptyBrother(): BrotherProfile {
  return { id: createId(), name: "", kind: "story", favoriteCards: [], rezonCard: "", notes: "" };
}

export function normalizeBrotherProfile(brotherProfile: BrotherProfile): BrotherProfile {
  return {
    id: brotherProfile.id,
    name: brotherProfile.name ?? "",
    kind: brotherProfile.kind ?? "story",
    favoriteCards: clampList(brotherProfile.favoriteCards ?? []),
    rezonCard: brotherProfile.rezonCard ?? "",
    notes: brotherProfile.notes ?? "",
  };
}

export function haveSameBrotherProfiles(leftEntries: BrotherProfile[], rightEntries: BrotherProfile[]) {
  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  for (let index = 0; index < leftEntries.length; index += 1) {
    const leftEntry = leftEntries[index];
    const rightEntry = rightEntries[index];

    if (
      leftEntry.id !== rightEntry.id ||
      leftEntry.name !== rightEntry.name ||
      leftEntry.kind !== rightEntry.kind ||
      leftEntry.rezonCard !== rightEntry.rezonCard ||
      leftEntry.notes !== rightEntry.notes ||
      leftEntry.favoriteCards.length !== rightEntry.favoriteCards.length ||
      leftEntry.favoriteCards.some((cardName, cardIndex) => cardName !== rightEntry.favoriteCards[cardIndex])
    ) {
      return false;
    }
  }

  return true;
}

export function resolveRequestedGameVersion(requestedGame: string | null, requestedVersion: string | null) {
  const fallbackGame: GameId = "mmsf1";

  if (requestedGame && requestedGame in VERSIONS_BY_GAME) {
    const game = requestedGame as GameId;
    const version =
      requestedVersion && VERSIONS_BY_GAME[game].includes(requestedVersion as VersionId)
        ? (requestedVersion as VersionId)
        : getDefaultVersionForGame(game);
    return { game, version };
  }

  if (requestedVersion) {
    const matchedGame = (Object.keys(VERSIONS_BY_GAME) as GameId[]).find((game) =>
      VERSIONS_BY_GAME[game].includes(requestedVersion as VersionId),
    );

    if (matchedGame) {
      return { game: matchedGame, version: requestedVersion as VersionId };
    }
  }

  return { game: fallbackGame, version: getDefaultVersionForGame(fallbackGame) };
}

export function buildEditorHref(game: GameId, version: VersionId, buildId?: string | null) {
  const params = new URLSearchParams({ game, version });

  if (buildId) {
    params.set("buildId", buildId);
  }

  return `/editor?${params.toString()}`;
}

function hasPartialCardEntry(cardEntry: BuildCardEntry) {
  return Boolean(cardEntry.name.trim());
}

function hasIncompleteSourceEntry(sourceEntry: CommonSections["cardSources"][number]) {
  const hasAnyValue = Boolean(
    sourceEntry.name.trim() || sourceEntry.source.trim() || sourceEntry.notes.trim(),
  );
  if (!hasAnyValue) {
    return false;
  }

  return !sourceEntry.name.trim() || !sourceEntry.source.trim();
}

function hasIncompleteBrotherProfile(brotherProfile: BrotherProfile) {
  const hasAnyValue = Boolean(
    brotherProfile.name.trim() ||
    brotherProfile.favoriteCards.length > 0 ||
    brotherProfile.rezonCard.trim() ||
    brotherProfile.notes.trim(),
  );
  if (!hasAnyValue) {
    return false;
  }

  return !brotherProfile.name.trim();
}

function isMmsf2BrotherFavoriteCardValid(cardName: string, brotherVersion: string) {
  const trimmedCardName = cardName.trim();
  const trimmedBrotherVersion = brotherVersion.trim() as VersionId | "";

  if (!trimmedCardName || !trimmedBrotherVersion) {
    return true;
  }

  return uniqueStrings([
    ...getCardSuggestions("mmsf2", trimmedBrotherVersion),
    ...getMmsf2BlankCardSuggestions(trimmedBrotherVersion),
  ]).includes(trimmedCardName);
}

function hasIncompleteBrotherRouletteSlot(brotherRouletteSlot: Mmsf3BrotherRouletteSlot) {
  if (brotherRouletteSlot.slotType === "sss") {
    return !brotherRouletteSlot.sssLevel.trim();
  }

  const filledFieldCount = [
    brotherRouletteSlot.version,
    brotherRouletteSlot.noise,
    brotherRouletteSlot.rezon,
    brotherRouletteSlot.whiteCardSetId,
    brotherRouletteSlot.gigaCard,
    brotherRouletteSlot.megaCard,
  ].filter((value) => value.trim()).length;

  if (filledFieldCount === 0) {
    return false;
  }

  return filledFieldCount < 6;
}

function isFolderValidationError(error: string) {
  return (
    error.includes("カード総数") ||
    error.includes("REG カード") ||
    error.includes("FAV カード") ||
    error.includes("ノーマルカード") ||
    error.includes("メガカード") ||
    error.includes("ギガカード") ||
    error.includes("メガ+ギガカード") ||
    error.includes("同名カード") ||
    error.includes("スターカード") ||
    error.includes("カード種別を判定できないカードがあります") ||
    error.includes("対戦構築カードを1件以上入力してください。") ||
    error.includes("対戦構築カードの未入力行があります。")
  );
}

function getRequiredFieldErrors(buildRecord: BuildRecord) {
  const errors: string[] = [];

  if (!buildRecord.title.trim()) {
    errors.push("構築名を入力してください。");
  }

  const namedCards = buildRecord.commonSections.cards.filter((cardEntry) => hasPartialCardEntry(cardEntry));
  if (namedCards.length === 0) {
    errors.push("対戦構築カードを1件以上入力してください。");
  }

  if (
    buildRecord.commonSections.cards.some((cardEntry) => !cardEntry.name.trim()) &&
    !hasOnlyTrailingEmptyCardEntry(buildRecord.commonSections.cards)
  ) {
    errors.push("対戦構築カードの未入力行があります。");
  }

  if (buildRecord.commonSections.cardSources.some((sourceEntry) => hasIncompleteSourceEntry(sourceEntry))) {
    errors.push("カード入手方法の未入力行があります。");
  }

  if (buildRecord.game === "mmsf3") {
    if (
      buildRecord.commonSections.abilities.some((abilityEntry) => !abilityEntry.name.trim()) &&
      !hasOnlyTrailingEmptyCardEntry(buildRecord.commonSections.abilities)
    ) {
      errors.push("アビリティの未入力行があります。");
    }

    if (
      buildRecord.gameSpecificSections.mmsf3.warRockWeaponSources.some((sourceEntry) =>
        hasIncompleteSourceEntry(sourceEntry),
      )
    ) {
      errors.push("ウォーロック装備入手方法の未入力行があります。");
    }

    const brotherRouletteSlots = buildRecord.gameSpecificSections.mmsf3.brotherRouletteSlots;
    if (brotherRouletteSlots.some((brotherRouletteSlot) => hasIncompleteBrotherRouletteSlot(brotherRouletteSlot))) {
      errors.push("ブラザー情報の未入力項目があります。");
    }
  } else {
    if (
      buildRecord.commonSections.abilities.some((abilityEntry) => !abilityEntry.name.trim()) &&
      !hasOnlyTrailingEmptyCardEntry(buildRecord.commonSections.abilities) &&
      buildRecord.game === "mmsf2"
    ) {
      errors.push("アビリティの未入力行があります。");
    }

    if (
      buildRecord.commonSections.abilitySources.some((sourceEntry) => hasIncompleteSourceEntry(sourceEntry)) &&
      buildRecord.game === "mmsf2"
    ) {
      errors.push("アビリティ入手方法の未入力行があります。");
    }

    if (buildRecord.game === "mmsf1") {
      const duplicateBrotherNames = getDuplicateMmsf1UniqueBrotherNames(buildRecord.commonSections.brothers);
      if (duplicateBrotherNames.length > 0) {
        errors.push(`ブラザー「${duplicateBrotherNames[0]}」は1枠だけ設定できます。`);
      }

      for (const brotherProfile of buildRecord.commonSections.brothers) {
        const filledFavCount = brotherProfile.favoriteCards.filter((cardName) => cardName.trim()).length;
        if (filledFavCount > 0 && filledFavCount < 6) {
          errors.push("各ブラザーの FAV カードは6枚指定してください。");
          break;
        }
      }
    } else if (buildRecord.game === "mmsf2") {
      for (const brotherProfile of buildRecord.commonSections.brothers) {
        const filledFavCount = brotherProfile.favoriteCards.filter((cardName) => cardName.trim()).length;
        if (filledFavCount > 0 && filledFavCount < 4) {
          errors.push("各ブラザーの FAV カードは4枚指定してください。");
          break;
        }
      }

      for (const brotherProfile of buildRecord.commonSections.brothers) {
        const invalidCard = brotherProfile.favoriteCards.find((cardName) =>
          !isMmsf2BrotherFavoriteCardValid(cardName, brotherProfile.rezonCard),
        );
        if (invalidCard) {
          const versionLabel = VERSION_LABELS[brotherProfile.rezonCard as VersionId] ?? brotherProfile.rezonCard;
          errors.push(`ブラザーの FAV カード「${invalidCard}」は${versionLabel}版では使えません。`);
          break;
        }
      }
    } else if (buildRecord.commonSections.brothers.some((brotherProfile) => hasIncompleteBrotherProfile(brotherProfile))) {
      errors.push("ブラザー情報の未入力行があります。");
    }
  }

  return errors;
}

export interface BuildValidationResult {
  errors: string[];
  totalCards: number;
  hasFolderErrors: boolean;
  cardTotalLabel: string;
}

export function validateBuild(buildRecord: BuildRecord): BuildValidationResult {
  const errors: string[] = [];
  const versionRule = getVersionRuleSet(buildRecord.version);
  const trackedCardEntries =
    buildRecord.game === "mmsf2" ? getMmsf2TrackedCards(buildRecord) : buildRecord.commonSections.cards;
  const totalCards = trackedCardEntries.reduce(
    (sum, cardEntry) =>
      sum + (cardEntry.name.trim() && Number.isFinite(cardEntry.quantity) ? cardEntry.quantity : 0),
    0,
  );
  const geminiTagMode =
    buildRecord.game === "mmsf3" && isMmsf3GeminiNoise(buildRecord.gameSpecificSections.mmsf3.noise);
  const regularCardCount =
    buildRecord.game === "mmsf1" || buildRecord.game === "mmsf2"
      ? buildRecord.commonSections.cards.reduce(
          (sum, cardEntry) =>
            sum + (cardEntry.name.trim() ? Math.max(0, Math.min(cardEntry.quantity, cardEntry.favoriteCount ?? 0)) : 0),
          0,
        )
      : buildRecord.commonSections.cards.filter((cardEntry) => cardEntry.name.trim() && cardEntry.isRegular).length;
  const geminiTagCardCount = geminiTagMode
    ? buildRecord.commonSections.cards.reduce(
        (sum, cardEntry) =>
          sum + (cardEntry.name.trim() ? Math.max(0, Math.min(cardEntry.quantity, cardEntry.favoriteCount ?? 0)) : 0),
        0,
      )
    : 0;

  if (!VERSIONS_BY_GAME[buildRecord.game].includes(buildRecord.version)) {
    errors.push("作品とバージョンの組み合わせが一致していません。");
  }

  if (totalCards > versionRule.folderLimit && buildRecord.game !== "mmsf2") {
    errors.push(`カード総数は ${versionRule.folderLimit} 枚以内にしてください。`);
  }

  if (buildRecord.game === "mmsf1") {
    if (regularCardCount !== 6 && buildRecord.commonSections.cards.some((cardEntry) => cardEntry.name.trim())) {
      errors.push("FAV カードは6枚指定してください。");
    }
  } else if (buildRecord.game === "mmsf2") {
    if (regularCardCount !== 4 && buildRecord.commonSections.cards.some((cardEntry) => cardEntry.name.trim())) {
      errors.push("FAV カードは4枚指定してください。");
    }
  } else if (geminiTagMode) {
    if (regularCardCount !== 1 && buildRecord.commonSections.cards.some((cardEntry) => cardEntry.name.trim())) {
      errors.push("REG カードは1枚指定してください。");
    }
    if (geminiTagCardCount !== 2 && buildRecord.commonSections.cards.some((cardEntry) => cardEntry.name.trim())) {
      errors.push("TAG カードは2枚指定してください。");
    }
  } else if (regularCardCount > 1) {
    errors.push("REG カードは1枚だけ指定してください。");
  }

  errors.push(...getRequiredFieldErrors(buildRecord));

  if (buildRecord.game === "mmsf2") {
    const enhancementEffect = getMmsf2EnhancementEffect(buildRecord.gameSpecificSections.mmsf2.enhancement);
    const folderTotalValidation = validateMmsf2FolderTotal(
      buildRecord.commonSections.cards,
      buildRecord.gameSpecificSections.mmsf2.starCards,
      buildRecord.gameSpecificSections.mmsf2.blankCards,
      versionRule.folderLimit,
    );
    errors.push(...folderTotalValidation.errors);
    const folderValidation = validateMmsf2FolderCards(buildRecord.commonSections.cards, buildRecord.version, {
      megaCards: (versionRule.limits.megaCards ?? 2) + (enhancementEffect?.megaBonus ?? 0),
      gigaCards: (versionRule.limits.gigaCards ?? 1) + (enhancementEffect?.gigaBonus ?? 0),
    });
    errors.push(...folderValidation.errors);
    const starValidation = validateMmsf2StarCards(buildRecord.gameSpecificSections.mmsf2.starCards, buildRecord.version);
    errors.push(...starValidation.errors);
    const abilityValidation = getMmsf2AbilitySelectionErrors(
      buildRecord.commonSections.abilities,
      buildRecord.gameSpecificSections.mmsf2.kokouNoKakera,
      buildRecord.version,
      buildRecord.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled,
    );
    errors.push(...abilityValidation.errors);
  } else if (buildRecord.game === "mmsf1") {
    const folderValidation = validateMmsf1FolderCards(
      buildRecord.commonSections.cards,
      buildRecord.version,
      buildRecord.gameSpecificSections.mmsf1.enhancement,
      buildRecord.commonSections.brothers,
    );
    errors.push(...folderValidation.errors);
    const brotherValidation = validateMmsf1BrotherFavoriteCards(
      buildRecord.commonSections.brothers,
      buildRecord.version,
    );
    errors.push(...brotherValidation.errors);
  }

  const limitedOwnershipValidation = validateLimitedCardOwnership(buildRecord.game, buildRecord.commonSections.cards);
  errors.push(...limitedOwnershipValidation.errors);

  if (buildRecord.game === "mmsf3") {
    const mmsf3State = getNormalizedMmsf3State(buildRecord);
    const mmsf3Validation = validateMmsf3BuildState(buildRecord, mmsf3State);
    errors.push(...mmsf3Validation.errors);
  }

  const hasFolderErrors = errors.some(isFolderValidationError);
  const cardTotalLabel =
    buildRecord.game === "mmsf2"
      ? (() => {
          const normalTotal = buildRecord.commonSections.cards.reduce(
            (sum, cardEntry) =>
              sum + (cardEntry.name.trim() && Number.isFinite(cardEntry.quantity) ? cardEntry.quantity : 0),
            0,
          );
          const blankTotal = buildRecord.gameSpecificSections.mmsf2.blankCards.filter((cardEntry) =>
            cardEntry.name.trim(),
          ).length;
          const parts = [normalTotal, blankTotal].filter((value) => value > 0);
          return `${parts.join("+") || "0"} / ${versionRule.folderLimit}`;
        })()
      : `${totalCards} / ${versionRule.folderLimit}`;

  return { errors, totalCards, hasFolderErrors, cardTotalLabel };
}

export function restoreEditorDraft(baseBuild: BuildRecord, rawDraft: string | null) {
  if (!rawDraft) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawDraft) as Partial<BuildRecord>;
    const restoredFolderEntries = (parsed.commonSections?.cards ?? baseBuild.commonSections.cards).map((cardEntry) =>
      normalizeBuildCardEntry(cardEntry as BuildCardEntry),
    );
    const restoredAbilityEntries = (parsed.commonSections?.abilities ?? baseBuild.commonSections.abilities).map((abilityEntry) =>
      normalizeBuildCardEntry(abilityEntry as BuildCardEntry),
    );
    const normalizedAbilityEntries =
      baseBuild.game === "mmsf2"
        ? normalizeMmsf2AbilityEntries(
            restoredAbilityEntries,
            baseBuild.version,
            (parsed.gameSpecificSections?.mmsf2 as { defaultTribeAbilityEnabled?: boolean } | undefined)
              ?.defaultTribeAbilityEnabled ?? baseBuild.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled,
          )
        : restoredAbilityEntries;
    const normalizedBlankCardEntries =
      baseBuild.game === "mmsf2"
        ? normalizeMmsf2BlankCardEntries(
            (parsed.gameSpecificSections?.mmsf2 as { blankCards?: BuildCardEntry[] } | undefined)?.blankCards ??
              baseBuild.gameSpecificSections.mmsf2.blankCards,
          )
        : baseBuild.gameSpecificSections.mmsf2.blankCards;

    return normalizeMmsf3BuildRecord({
      ...baseBuild,
      ...parsed,
      game: baseBuild.game,
      version: baseBuild.version,
      commonSections: {
        ...baseBuild.commonSections,
        ...(parsed.commonSections ?? {}),
        cards: restoredFolderEntries,
        brothers: (parsed.commonSections?.brothers ?? baseBuild.commonSections.brothers).map((brotherProfile) =>
          normalizeBrotherProfile(brotherProfile as BrotherProfile),
        ),
        abilities: normalizedAbilityEntries,
        abilitySources: (parsed.commonSections?.abilitySources ?? baseBuild.commonSections.abilitySources).map(
          (sourceEntry) => normalizeBuildSourceEntry(sourceEntry as CommonSections["abilitySources"][number]),
        ),
      },
      gameSpecificSections: {
        ...baseBuild.gameSpecificSections,
        ...(parsed.gameSpecificSections ?? {}),
        mmsf1: {
          ...baseBuild.gameSpecificSections.mmsf1,
          ...(parsed.gameSpecificSections?.mmsf1 ?? {}),
          enhancement: normalizeMmsf1EnhancementValue(
            (parsed.gameSpecificSections?.mmsf1 as { enhancement?: string } | undefined)?.enhancement ??
              baseBuild.gameSpecificSections.mmsf1.enhancement,
          ),
        },
        mmsf2: {
          ...baseBuild.gameSpecificSections.mmsf2,
          ...(parsed.gameSpecificSections?.mmsf2 ?? {}),
          blankCards: normalizedBlankCardEntries,
        },
        mmsf3: {
          ...baseBuild.gameSpecificSections.mmsf3,
          ...normalizeMmsf3Sections(parsed.gameSpecificSections?.mmsf3, baseBuild.gameSpecificSections.mmsf3),
        },
      },
    });
  } catch {
    return null;
  }
}

export function getMissingCardSourceNames(buildRecord: BuildRecord) {
  const trackedCardEntries =
    buildRecord.game === "mmsf2" ? getMmsf2TrackedCards(buildRecord) : buildRecord.commonSections.cards;
  return getMissingSourceNames(
    trackedCardEntries,
    buildRecord.commonSections.cardSources,
    (name) => getKnownCardSources(buildRecord.game, name, buildRecord.version),
  );
}

export function getMissingAbilitySourceNames(buildRecord: BuildRecord) {
  const mmsf3State = buildRecord.game === "mmsf3" ? getNormalizedMmsf3State(buildRecord) : null;

  if (buildRecord.game === "mmsf3" && mmsf3State) {
    return getMissingMmsf3AbilitySourceNames(mmsf3State, buildRecord.version);
  }

  if (buildRecord.game === "mmsf2") {
    return getMissingSourceNames(
      buildRecord.commonSections.abilities,
      buildRecord.commonSections.abilitySources,
      (name) => getMmsf2AbilitySources(name, buildRecord.version),
    );
  }

  return getMissingSourceNames(
    buildRecord.commonSections.abilities,
    buildRecord.commonSections.abilitySources,
    (name) => getKnownCardSources(buildRecord.game, name, buildRecord.version),
  );
}

export function getMissingWarRockWeaponSourceNames(buildRecord: BuildRecord) {
  const mmsf3State = buildRecord.game === "mmsf3" ? getNormalizedMmsf3State(buildRecord) : null;

  if (buildRecord.game === "mmsf3" && mmsf3State) {
    return getMissingMmsf3WarRockWeaponSourceNames(mmsf3State);
  }

  const warRockWeaponName =
    buildRecord.game === "mmsf1"
      ? buildRecord.gameSpecificSections.mmsf1.warRockWeapon.trim()
      : buildRecord.game === "mmsf2"
        ? buildRecord.gameSpecificSections.mmsf2.warRockWeapon.trim()
        : "";
  const sourceEntries =
    buildRecord.game === "mmsf1"
      ? buildRecord.gameSpecificSections.mmsf1.warRockWeaponSources
      : buildRecord.game === "mmsf2"
        ? buildRecord.gameSpecificSections.mmsf2.warRockWeaponSources
        : [];

  return warRockWeaponName
    ? getMissingSourceNames(
        [{ name: warRockWeaponName }],
        sourceEntries,
        buildRecord.game === "mmsf1" ? getMmsf1WarRockWeaponSources : getMmsf2WarRockWeaponSources,
      )
    : [];
}
