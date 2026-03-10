"use client";

import { useEffect, useEffectEvent, useId, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import {
  AlertTriangle,
  Eye,
  FileImage,
  FilePlus2,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ExportScene } from "@/components/export-scene";
import { Mmsf1BrotherSection } from "@/components/mmsf1/brother-section";
import { Mmsf1EditorSections, Mmsf1WarRockSection } from "@/components/mmsf1/editor-sections";
import { Mmsf2BrotherSection } from "@/components/mmsf2/brother-section";
import { Mmsf2AbilitySection } from "@/components/mmsf2/ability-section";
import { Mmsf2EditorSections, Mmsf2WarRockSection } from "@/components/mmsf2/editor-sections";
import { Mmsf3BrotherRouletteSection, Mmsf3EditorSections } from "@/components/mmsf3/editor-sections";
import { SearchableSelectInput } from "@/components/searchable-select-input";
import { SearchableSuggestionInput } from "@/components/searchable-suggestion-input";
import { SourceListEditor, getMissingSourceNames, haveSameSourceEntries, syncSourceEntries } from "@/components/source-list-editor";
import { TagEditor } from "@/components/tag-editor";
import { useAppData } from "@/hooks/use-app-data";
import { getDuplicateMmsf1UniqueBrotherNames, normalizeMmsf1BrotherProfile } from "@/lib/mmsf1/brothers";
import { getMmsf1WarRockWeaponSources } from "@/lib/mmsf1/war-rock-weapons";
import { MMSF3_ABILITY_OPTIONS } from "@/lib/mmsf3/abilities";
import {
  getMmsf2AbilityNameSuggestions,
  getMmsf2AbilitySelectionErrors,
  getMmsf2AbilitySources,
  normalizeMmsf2AbilityEntries,
} from "@/lib/mmsf2/abilities";
import { getMmsf2BlankCardDefinition } from "@/lib/mmsf2/folder-cards";
import {
  getMissingMmsf3AbilitySourceNames,
  getMissingMmsf3WarRockWeaponSourceNames,
  getNormalizedMmsf3State,
  normalizeMmsf3BuildRecord,
  normalizeMmsf3Sections,
  updateMmsf3AbilityEntries,
  updateMmsf3AbilitySources,
  updateMmsf3BrotherRouletteSlots,
  updateMmsf3Noise,
  updateMmsf3NoiseCardIds,
  updateMmsf3PlayerRezonCard,
  updateMmsf3SssLevels,
  updateMmsf3WarRockWeapon,
  updateMmsf3WarRockWeaponSources,
  updateMmsf3WhiteCardSetId,
  validateMmsf3BuildState,
} from "@/lib/mmsf3/build-state";
import {
  getCardSourceNameSuggestions,
  getCardSuggestions,
  getKnownCardSources,
  getMmsf2BlankCardSuggestions,
  getMmsf2StarCardSuggestions,
  getSourceSuggestions,
  sortCardSuggestions,
} from "@/lib/guide-card-catalog";
import {
  getMmsf2BlankCardTotalLimit,
  getMmsf2NormalCardTotalLimit,
  validateMmsf2FolderCards,
  validateMmsf2FolderTotal,
  validateMmsf2StarCards,
} from "@/lib/mmsf2/battle-rules";
import { getMmsf2WarRockWeaponSources } from "@/lib/mmsf2/war-rock-weapons";
import { MASTER_DATA } from "@/lib/seed-data";
import {
  GAME_LABELS,
  getDefaultVersionForGame,
  getVersionRuleSet,
  VERSION_LABELS,
  VERSIONS_BY_GAME,
} from "@/lib/rules";
import type {
  BrotherProfile,
  BrotherKind,
  BuildCardEntry,
  BuildRecord,
  CommonSections,
  GameId,
  Mmsf3BrotherRouletteSlot,
  VersionId,
} from "@/lib/types";
import { createId, uniqueStrings } from "@/lib/utils";

const BROTHER_KIND_OPTIONS: { value: BrotherKind; label: string }[] = [
  { value: "story", label: "ゲーム内" },
  { value: "auto", label: "オート" },
  { value: "real", label: "リアル" },
  { value: "event", label: "限定配信/イベント" },
];
const BATTLE_CARD_ROW_GRID_CLASS = "min-[1180px]:grid-cols-[minmax(0,1fr)_110px_88px_112px]";
const EDITOR_DRAFT_STORAGE_KEY_PREFIX = "mmsf-perfect-battle-organizer/editor-draft/v2";
const LEGACY_EDITOR_DRAFT_STORAGE_KEY_PREFIX = "mmsf-perfect-battle-organizer/editor-draft/v1";

function cloneBuild(build: BuildRecord) {
  return JSON.parse(JSON.stringify(build)) as BuildRecord;
}

function buildEmptyCard(): BuildCardEntry {
  return { id: createId(), name: "", quantity: 1, notes: "", isRegular: false };
}

function getMmsf2TrackedCards(build: BuildRecord) {
  return [...build.commonSections.cards, ...build.gameSpecificSections.mmsf2.starCards, ...build.gameSpecificSections.mmsf2.blankCards];
}

function syncMmsf2WarRockWeaponSources(weaponName: string, sources: CommonSections["cardSources"]) {
  const trimmedWeaponName = weaponName.trim();

  if (!trimmedWeaponName) {
    return [];
  }

  return syncSourceEntries(
    [{ name: trimmedWeaponName }],
    sources,
    getMmsf2WarRockWeaponSources,
  );
}

function syncMmsf1WarRockWeaponSources(weaponName: string, sources: CommonSections["cardSources"]) {
  const trimmedWeaponName = weaponName.trim();

  if (!trimmedWeaponName) {
    return [];
  }

  return syncSourceEntries(
    [{ name: trimmedWeaponName }],
    sources,
    getMmsf1WarRockWeaponSources,
  );
}

function normalizeBuildCardEntry(entry: BuildCardEntry): BuildCardEntry {
  return {
    id: entry.id,
    name: entry.name ?? "",
    quantity: Number.isFinite(entry.quantity) ? Math.max(1, Math.trunc(entry.quantity)) : 1,
    notes: entry.notes ?? "",
    isRegular: Boolean(entry.isRegular),
  };
}

function normalizeMmsf2BlankCardEntries(entries: BuildCardEntry[]) {
  return entries.map((entry) => {
    const normalizedEntry = normalizeBuildCardEntry(entry);
    const blankDefinition = getMmsf2BlankCardDefinition(normalizedEntry.name);

    return blankDefinition
      ? { ...normalizedEntry, name: blankDefinition.contentKey }
      : normalizedEntry;
  });
}

function createMmsf2BlankCardDraftEntries(
  entries: BuildCardEntry[],
  blankCardSlotLimit: number,
  preserveFilledOverflow = false,
) {
  const normalizedEntries = normalizeMmsf2BlankCardEntries(entries);
  const filledEntries = normalizedEntries.filter((entry) => entry.name.trim());
  const emptyEntry = normalizedEntries.find((entry) => !entry.name.trim()) ?? buildEmptyCard();
  const preservedFilledEntries =
    preserveFilledOverflow || filledEntries.length <= blankCardSlotLimit
      ? filledEntries
      : filledEntries.slice(0, blankCardSlotLimit);

  if (preservedFilledEntries.length < blankCardSlotLimit) {
    return [...preservedFilledEntries, emptyEntry];
  }

  return preservedFilledEntries;
}

function haveSameCardEntries(left: BuildCardEntry[], right: BuildCardEntry[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftEntry = left[index];
    const rightEntry = right[index];

    if (
      leftEntry.id !== rightEntry.id ||
      leftEntry.name !== rightEntry.name ||
      leftEntry.quantity !== rightEntry.quantity ||
      leftEntry.notes !== rightEntry.notes ||
      leftEntry.isRegular !== rightEntry.isRegular
    ) {
      return false;
    }
  }

  return true;
}

function normalizeBuildSourceEntry(entry: CommonSections["abilitySources"][number]): CommonSections["abilitySources"][number] {
  return {
    id: entry.id,
    name: entry.name ?? "",
    source: entry.source ?? "",
    notes: entry.notes ?? "",
    isOwned: false,
  };
}

function stripTransientBuildFlags(build: BuildRecord): BuildRecord {
  return {
    ...build,
    commonSections: {
      ...build.commonSections,
      cardSources: build.commonSections.cardSources.map((entry) => ({ ...entry, isOwned: false })),
      abilitySources: build.commonSections.abilitySources.map((entry) => ({ ...entry, isOwned: false })),
    },
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...build.gameSpecificSections.mmsf3,
        warRockWeaponSources: build.gameSpecificSections.mmsf3.warRockWeaponSources.map((entry) => ({
          ...entry,
          isOwned: false,
        })),
      },
    },
  };
}

function hasPartialCardEntry(entry: BuildCardEntry) {
  return Boolean(entry.name.trim());
}

function hasIncompleteSourceEntry(entry: CommonSections["cardSources"][number]) {
  const hasAnyValue = Boolean(entry.name.trim() || entry.source.trim() || entry.notes.trim());
  if (!hasAnyValue) {
    return false;
  }

  return !entry.name.trim() || !entry.source.trim();
}

function hasIncompleteBrotherProfile(entry: BrotherProfile) {
  const hasAnyValue = Boolean(
    entry.name.trim() ||
    entry.favoriteCards.length > 0 ||
    entry.rezonCard.trim() ||
    entry.notes.trim(),
  );
  if (!hasAnyValue) {
    return false;
  }

  return !entry.name.trim();
}

function isMmsf2BrotherFavoriteCardValid(cardName: string, brotherVersion: string) {
  const trimmedName = cardName.trim();
  const trimmedVersion = brotherVersion.trim() as VersionId | "";

  if (!trimmedName || !trimmedVersion) {
    return true;
  }

  return getCardSuggestions("mmsf2", trimmedVersion).includes(trimmedName);
}

function hasIncompleteBrotherRouletteSlot(slot: Mmsf3BrotherRouletteSlot) {
  if (slot.slotType === "sss") {
    return !slot.sssLevel.trim();
  }

  const filledFieldCount = [
    slot.version,
    slot.noise,
    slot.rezon,
    slot.whiteCardSetId,
    slot.gigaCard,
    slot.megaCard,
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

function getRequiredFieldErrors(build: BuildRecord) {
  const errors: string[] = [];

  if (!build.title.trim()) {
    errors.push("構築名を入力してください。");
  }

  if (!build.commonSections.overview.trim()) {
    errors.push("構築概要を入力してください。");
  }

  const namedCards = build.commonSections.cards.filter((entry) => hasPartialCardEntry(entry));
  if (namedCards.length === 0) {
    errors.push("対戦構築カードを1件以上入力してください。");
  }

  if (build.commonSections.cards.some((entry) => !entry.name.trim())) {
    errors.push("対戦構築カードの未入力行があります。");
  }

  if (build.commonSections.cardSources.some((entry) => hasIncompleteSourceEntry(entry))) {
    errors.push("カード入手方法の未入力行があります。");
  }

  if (build.game === "mmsf3") {
    if (build.commonSections.abilities.some((entry) => !entry.name.trim())) {
      errors.push("アビリティの未入力行があります。");
    }

    if (build.gameSpecificSections.mmsf3.warRockWeaponSources.some((entry) => hasIncompleteSourceEntry(entry))) {
      errors.push("ウォーロック装備入手方法の未入力行があります。");
    }

    const slots = build.gameSpecificSections.mmsf3.brotherRouletteSlots;
    if (slots.some((slot) => hasIncompleteBrotherRouletteSlot(slot))) {
      errors.push("ブラザー情報の未入力項目があります。");
    }
  } else {
    if (build.commonSections.abilities.some((entry) => !entry.name.trim())) {
      if (build.game === "mmsf2") {
        errors.push("アビリティの未入力行があります。");
      }
    }

    if (build.commonSections.abilitySources.some((entry) => hasIncompleteSourceEntry(entry))) {
      if (build.game === "mmsf2") {
        errors.push("アビリティ入手方法の未入力行があります。");
      }
    }

    if (build.game === "mmsf1") {
      const duplicateBrotherNames = getDuplicateMmsf1UniqueBrotherNames(build.commonSections.brothers);
      if (duplicateBrotherNames.length > 0) {
        errors.push(`MMSF1 のブラザー「${duplicateBrotherNames[0]}」は1枠だけ設定できます。`);
      }

      for (const brother of build.commonSections.brothers) {
        const filledFavCount = brother.favoriteCards.filter((card) => card.trim()).length;
        if (filledFavCount > 0 && filledFavCount < 6) {
          errors.push("各ブラザーの FAV カードは6枚指定してください。");
          break;
        }
      }
    } else if (build.game === "mmsf2") {
      for (const brother of build.commonSections.brothers) {
        const filledFavCount = brother.favoriteCards.filter((card) => card.trim()).length;
        if (filledFavCount > 0 && filledFavCount < 4) {
          errors.push("各ブラザーの FAV カードは4枚指定してください。");
          break;
        }
      }

      for (const brother of build.commonSections.brothers) {
        const invalidCard = brother.favoriteCards.find((card) => !isMmsf2BrotherFavoriteCardValid(card, brother.rezonCard));
        if (invalidCard) {
          const versionLabel = VERSION_LABELS[brother.rezonCard as VersionId] ?? brother.rezonCard;
          errors.push(`ブラザーの FAV カード「${invalidCard}」は${versionLabel}版では使えません。`);
          break;
        }
      }
    } else if (build.commonSections.brothers.some((entry) => hasIncompleteBrotherProfile(entry))) {
      errors.push("ブラザー情報の未入力行があります。");
    }
  }

  return errors;
}

function buildEmptyBrother(): BrotherProfile {
  return { id: createId(), name: "", kind: "story", favoriteCards: [], rezonCard: "", notes: "" };
}

function clampList(values: string[], max?: number) {
  const unique = Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
  return typeof max === "number" ? unique.slice(0, max) : unique;
}

function normalizeBrotherProfile(entry: BrotherProfile): BrotherProfile {
  return {
    id: entry.id,
    name: entry.name ?? "",
    kind: entry.kind ?? "story",
    favoriteCards: clampList(entry.favoriteCards ?? []),
    rezonCard: entry.rezonCard ?? "",
    notes: entry.notes ?? "",
  };
}

function haveSameBrotherProfiles(left: BrotherProfile[], right: BrotherProfile[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftEntry = left[index];
    const rightEntry = right[index];

    if (
      leftEntry.id !== rightEntry.id ||
      leftEntry.name !== rightEntry.name ||
      leftEntry.kind !== rightEntry.kind ||
      leftEntry.rezonCard !== rightEntry.rezonCard ||
      leftEntry.notes !== rightEntry.notes ||
      leftEntry.favoriteCards.length !== rightEntry.favoriteCards.length ||
      leftEntry.favoriteCards.some((card, cardIndex) => card !== rightEntry.favoriteCards[cardIndex])
    ) {
      return false;
    }
  }

  return true;
}

function resolveRequestedGameVersion(requestedGame: string | null, requestedVersion: string | null) {
  const fallbackGame: GameId = "mmsf1";

  if (requestedGame && requestedGame in VERSIONS_BY_GAME) {
    const game = requestedGame as GameId;
    const version = requestedVersion && VERSIONS_BY_GAME[game].includes(requestedVersion as VersionId)
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

function buildEditorHref(game: GameId, version: VersionId, buildId?: string | null) {
  const params = new URLSearchParams({
    game,
    version,
  });

  if (buildId) {
    params.set("buildId", buildId);
  }

  return `/editor?${params.toString()}`;
}

function buildEditorDraftStorageKey(
  buildId: string | null,
  requestedGame: string | null,
  requestedVersion: string | null,
  prefix = EDITOR_DRAFT_STORAGE_KEY_PREFIX,
) {
  if (buildId) {
    return `${prefix}/build/${buildId}`;
  }

  const { game, version } = resolveRequestedGameVersion(requestedGame, requestedVersion);
  return `${prefix}/new/${game}/${version}`;
}

function restoreEditorDraft(baseBuild: BuildRecord, rawDraft: string | null) {
  if (!rawDraft) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawDraft) as Partial<BuildRecord>;
    const restoredAbilities = (parsed.commonSections?.abilities ?? baseBuild.commonSections.abilities).map((entry) =>
      normalizeBuildCardEntry(entry as BuildCardEntry),
    );
    const normalizedAbilities = baseBuild.game === "mmsf2"
      ? normalizeMmsf2AbilityEntries(
          restoredAbilities,
          baseBuild.version,
          (parsed.gameSpecificSections?.mmsf2 as { defaultTribeAbilityEnabled?: boolean } | undefined)?.defaultTribeAbilityEnabled ?? baseBuild.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled,
        )
      : restoredAbilities;
    const normalizedMmsf2BlankCards = baseBuild.game === "mmsf2"
      ? normalizeMmsf2BlankCardEntries(
          (parsed.gameSpecificSections?.mmsf2 as { blankCards?: BuildCardEntry[] } | undefined)?.blankCards ?? baseBuild.gameSpecificSections.mmsf2.blankCards,
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
        brothers: (parsed.commonSections?.brothers ?? baseBuild.commonSections.brothers).map((entry) =>
          normalizeBrotherProfile(entry as BrotherProfile),
        ),
        abilities: normalizedAbilities,
        abilitySources: (parsed.commonSections?.abilitySources ?? baseBuild.commonSections.abilitySources).map((entry) =>
          normalizeBuildSourceEntry(entry as CommonSections["abilitySources"][number]),
        ),
      },
      gameSpecificSections: {
        ...baseBuild.gameSpecificSections,
        ...(parsed.gameSpecificSections ?? {}),
        mmsf1: {
          ...baseBuild.gameSpecificSections.mmsf1,
          ...(parsed.gameSpecificSections?.mmsf1 ?? {}),
        },
        mmsf2: {
          ...baseBuild.gameSpecificSections.mmsf2,
          ...(parsed.gameSpecificSections?.mmsf2 ?? {}),
          blankCards: normalizedMmsf2BlankCards,
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

function validateBuild(build: BuildRecord) {
  const errors: string[] = [];
  const rule = getVersionRuleSet(build.version);
  const trackedCards = build.game === "mmsf2" ? getMmsf2TrackedCards(build) : build.commonSections.cards;
  const totalCards = trackedCards.reduce(
    (sum, entry) => sum + (entry.name.trim() && Number.isFinite(entry.quantity) ? entry.quantity : 0),
    0,
  );
  const regularCardCount = build.commonSections.cards.filter((entry) => entry.name.trim() && entry.isRegular).length;

  if (!VERSIONS_BY_GAME[build.game].includes(build.version)) {
    errors.push("作品とバージョンの組み合わせが一致していません。");
  }

  if (totalCards > rule.folderLimit && build.game !== "mmsf2") {
    errors.push(`カード総数は ${rule.folderLimit} 枚以内にしてください。`);
  }

  if (build.game === "mmsf1") {
    if (regularCardCount !== 6 && build.commonSections.cards.some((entry) => entry.name.trim())) {
      errors.push("FAV カードは6枚指定してください。");
    }
  } else if (build.game === "mmsf2") {
    if (regularCardCount !== 4 && build.commonSections.cards.some((entry) => entry.name.trim())) {
      errors.push("FAV カードは4枚指定してください。");
    }
  } else if (regularCardCount > 1) {
    errors.push("REG カードは1枚だけ指定してください。");
  }

  errors.push(...getRequiredFieldErrors(build));

  if (build.game === "mmsf2") {
    const mmsf2FolderTotalValidation = validateMmsf2FolderTotal(
      build.commonSections.cards,
      build.gameSpecificSections.mmsf2.starCards,
      build.gameSpecificSections.mmsf2.blankCards,
      rule.folderLimit,
    );
    errors.push(...mmsf2FolderTotalValidation.errors);
    const mmsf2FolderValidation = validateMmsf2FolderCards(build.commonSections.cards, build.version);
    errors.push(...mmsf2FolderValidation.errors);
    const mmsf2StarValidation = validateMmsf2StarCards(build.gameSpecificSections.mmsf2.starCards, build.version);
    errors.push(...mmsf2StarValidation.errors);
    const mmsf2AbilityValidation = getMmsf2AbilitySelectionErrors(
      build.commonSections.abilities,
      build.gameSpecificSections.mmsf2.kokouNoKakera,
      build.version,
      build.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled,
    );
    errors.push(...mmsf2AbilityValidation.errors);
  }

  if (build.game === "mmsf3") {
    const state = getNormalizedMmsf3State(build);
    const mmsf3Validation = validateMmsf3BuildState(build, state);
    errors.push(...mmsf3Validation.errors);
  }

  const hasFolderErrors = errors.some(isFolderValidationError);
  return { errors, totalCards, hasFolderErrors };
}


function CardListEditor({
  title,
  entries,
  onChange,
  suggestions,
  allowRegularSelection = false,
  regularLabel = "REG",
  regularLimit = 1,
  hideAddButton = false,
  hideQuantity = false,
  hideDelete = false,
  maxEntries,
  totalLimit,
}: {
  title: string;
  entries: BuildCardEntry[];
  onChange: (entries: BuildCardEntry[]) => void;
  suggestions: string[];
  allowRegularSelection?: boolean;
  regularLabel?: string;
  regularLimit?: number;
  hideAddButton?: boolean;
  hideQuantity?: boolean;
  hideDelete?: boolean;
  maxEntries?: number;
  totalLimit?: number;
}) {
  const total = entries.reduce((sum, entry) => sum + (entry.name.trim() ? entry.quantity : 0), 0);
  const regularCount = entries.filter((entry) => entry.name.trim() && entry.isRegular).length;
  const canAddMoreEntries = typeof maxEntries === "number" ? entries.length < maxEntries : true;
  const canAddMoreTotal = typeof totalLimit === "number" ? total < totalLimit : true;

  return (
    <div className="glass-panel-soft relative z-0 p-6 focus-within:z-20">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-white">{title}</label>
        <div className="flex items-center gap-3 text-xs text-white/45">
          {allowRegularSelection ? <span>{regularLabel} {regularCount}/{regularLimit}</span> : null}
          {!hideQuantity && <span>合計 {total}{typeof totalLimit === "number" ? `/${totalLimit}` : ""}</span>}
          {typeof maxEntries === "number" ? <span>行 {entries.length}/{maxEntries}</span> : null}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => {
          const otherEntriesTotal = entries.reduce(
            (sum, item) => sum + (item.id !== entry.id && item.name.trim() ? item.quantity : 0),
            0,
          );
          const maxQuantity = typeof totalLimit === "number" ? Math.max(1, totalLimit - otherEntriesTotal) : 99;

          return (
          <div
            key={entry.id}
            className={`relative z-0 grid gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 focus-within:z-10 ${hideQuantity && hideDelete ? "" : hideQuantity ? "min-[1180px]:grid-cols-[minmax(0,1fr)_112px]" : BATTLE_CARD_ROW_GRID_CLASS}`}
          >
            <SearchableSuggestionInput
              value={entry.name}
              onChange={(value) => onChange(entries.map((item) => (item.id === entry.id ? { ...item, name: value } : item)))}
              suggestions={suggestions}
              placeholder="カード名"
              className="field-shell"
            />
            {!hideQuantity && (
              <input
                type="number"
                min={1}
                max={maxQuantity}
                value={entry.quantity}
                onChange={(event) =>
                  onChange(
                    entries.map((item) =>
                      item.id === entry.id
                        ? { ...item, quantity: Math.max(1, Math.min(maxQuantity, Number(event.target.value || 1))) }
                        : item,
                    ),
                  )
                }
                className="field-shell"
              />
            )}
            {allowRegularSelection ? (
              <button
                type="button"
                aria-pressed={entry.isRegular}
                className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  entry.isRegular
                    ? "border-red-300/70 bg-red-500/15 text-red-100"
                    : "border-white/12 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white"
                } w-full justify-center`}
                onClick={() => {
                  if (regularLimit <= 1) {
                    onChange(
                      entries.map((item) => ({
                        ...item,
                        isRegular: item.id === entry.id ? !item.isRegular : false,
                      })),
                    );
                  } else {
                    onChange(
                      entries.map((item) =>
                        item.id === entry.id ? { ...item, isRegular: !item.isRegular } : item,
                      ),
                    );
                  }
                }}
              >
                {regularLabel}
              </button>
            ) : !hideQuantity ? (
              <div aria-hidden="true" className="hidden min-[1180px]:block" />
            ) : null}
            {!hideDelete && (
              <button
                type="button"
                className="danger-button w-full justify-center"
                onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}
              >
                削除
              </button>
            )}
          </div>
          );
        })}
      </div>
      {!hideAddButton && canAddMoreEntries && canAddMoreTotal && (
        <button type="button" className="secondary-button mt-4" onClick={() => onChange([...entries, buildEmptyCard()])}>
          行を追加
        </button>
      )}
    </div>
  );
}

function BrotherListEditor({
  entries,
  onChange,
  suggestions,
  rezonCardOptions,
  extraContent,
}: {
  entries: BrotherProfile[];
  onChange: (entries: BrotherProfile[]) => void;
  suggestions: string[];
  rezonCardOptions?: string[];
  extraContent?: ReactNode;
}) {
  const listId = useId();

  return (
    <div className="glass-panel-soft p-6">
      <label className="text-sm font-semibold text-white">ブラザー情報</label>
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 md:grid-cols-[1fr_180px_1fr_auto]">
            <input
              list={listId}
              value={entry.name}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, name: event.target.value } : item)))
              }
              placeholder="ブラザー名"
              className="field-shell"
            />
            <select
              value={entry.kind}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, kind: event.target.value as BrotherKind } : item)))
              }
              className="field-shell"
            >
              {BROTHER_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              value={entry.favoriteCards.join(", ")}
              onChange={(event) =>
                onChange(
                  entries.map((item) =>
                    item.id === entry.id
                      ? {
                          ...item,
                          favoriteCards: event.target.value
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                        }
                      : item,
                  ),
                )
              }
              placeholder="フェイバリットカードをカンマ区切り"
              className="field-shell"
            />
            <button
              type="button"
              className="danger-button"
              onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}
            >
              削除
            </button>
            {rezonCardOptions?.length ? (
              <div className="md:col-span-2">
                <p className="mb-2 text-[11px] font-semibold tracking-[0.28em] text-white/45">REZON CARD</p>
                <select
                  value={entry.rezonCard ?? ""}
                  onChange={(event) =>
                    onChange(entries.map((item) => (item.id === entry.id ? { ...item, rezonCard: event.target.value } : item)))
                  }
                  className="field-shell"
                >
                  <option value="">レゾンカードを選択</option>
                  {rezonCardOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <textarea
              value={entry.notes}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, notes: event.target.value } : item)))
              }
              placeholder="ブラザーの補足"
              className="field-shell md:col-span-4 min-h-24"
            />
          </div>
        ))}
      </div>
      <button type="button" className="secondary-button mt-4" onClick={() => onChange([...entries, buildEmptyBrother()])}>
        ブラザーを追加
      </button>
      {extraContent ? <div className="mt-4 grid gap-4">{extraContent}</div> : null}
    </div>
  );
}

export function BuildEditorPage() {
  const { createEmptyBuild, duplicateBuild, getBuildById, loaded, upsertBuild } = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildId = searchParams.get("buildId");
  const requestedGame = searchParams.get("game");
  const requestedVersion = searchParams.get("version");
  const draftStorageKey = useMemo(
    () => buildEditorDraftStorageKey(buildId, requestedGame, requestedVersion),
    [buildId, requestedGame, requestedVersion],
  );
  const legacyDraftStorageKey = useMemo(
    () => buildEditorDraftStorageKey(buildId, requestedGame, requestedVersion, LEGACY_EDITOR_DRAFT_STORAGE_KEY_PREFIX),
    [buildId, requestedGame, requestedVersion],
  );
  const exportRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<BuildRecord | null>(null);
  const [status, setStatus] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const persistDraftSnapshot = useEffectEvent(() => {
    if (!draft) {
      return;
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(stripTransientBuildFlags(draft)));
  });

  useEffect(() => {
    if (!loaded) {
      return;
    }

    let nextBuild: BuildRecord;

    if (buildId) {
      const existing = getBuildById(buildId);
      nextBuild = existing ? cloneBuild(existing) : createEmptyBuild();
    } else {
      const nextSelection = resolveRequestedGameVersion(requestedGame, requestedVersion);
      nextBuild = createEmptyBuild(nextSelection.game);
      nextBuild.version = nextSelection.version;
    }

    const restoredDraft = restoreEditorDraft(
      nextBuild,
      window.localStorage.getItem(draftStorageKey) ?? window.localStorage.getItem(legacyDraftStorageKey),
    );
    setDraft(restoredDraft ?? nextBuild);

    if (restoredDraft) {
      setStatus("未保存の編集内容を復元しました。");
    }
  }, [buildId, createEmptyBuild, draftStorageKey, getBuildById, legacyDraftStorageKey, loaded, requestedGame, requestedVersion]);

  useEffect(() => {
    if (!loaded || !draft) {
      return;
    }

    persistDraftSnapshot();
  }, [draft, loaded]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistDraftSnapshot();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const allCards = current.game === "mmsf2" ? getMmsf2TrackedCards(current) : current.commonSections.cards;
      const nextCardSources = syncSourceEntries(
        allCards,
        current.commonSections.cardSources,
        (name) => getKnownCardSources(current.game, name, current.version),
      );

      if (haveSameSourceEntries(current.commonSections.cardSources, nextCardSources)) {
        return current;
      }

      return {
        ...current,
        commonSections: {
          ...current.commonSections,
          cardSources: nextCardSources,
        },
      };
    });
  }, [draft?.game, draft?.version, draft?.commonSections.cards]);

  useEffect(() => {
    setDraft((current) => {
      if (!current || current.game !== "mmsf1") {
        return current;
      }

      const normalizedBrothers = current.commonSections.brothers.map((entry) =>
        normalizeMmsf1BrotherProfile(entry, current.version as Extract<VersionId, "pegasus" | "leo" | "dragon">),
      );

      if (haveSameBrotherProfiles(current.commonSections.brothers, normalizedBrothers)) {
        return current;
      }

      return {
        ...current,
        commonSections: {
          ...current.commonSections,
          brothers: normalizedBrothers,
        },
      };
    });
  }, [draft?.game, draft?.version, draft?.commonSections.brothers]);

  useEffect(() => {
    setDraft((current) => {
      if (!current || current.game !== "mmsf1") {
        return current;
      }

      const nextWeaponSources = syncMmsf1WarRockWeaponSources(
        current.gameSpecificSections.mmsf1.warRockWeapon,
        current.gameSpecificSections.mmsf1.warRockWeaponSources,
      );

      if (haveSameSourceEntries(current.gameSpecificSections.mmsf1.warRockWeaponSources, nextWeaponSources)) {
        return current;
      }

      return {
        ...current,
        gameSpecificSections: {
          ...current.gameSpecificSections,
          mmsf1: {
            ...current.gameSpecificSections.mmsf1,
            warRockWeaponSources: nextWeaponSources,
          },
        },
      };
    });
  }, [draft?.game, draft?.gameSpecificSections.mmsf1.warRockWeapon]);

  useEffect(() => {
    setDraft((current) => {
      if (!current || current.game !== "mmsf2") {
        return current;
      }

      const normalizedAbilities = normalizeMmsf2AbilityEntries(
        current.commonSections.abilities,
        current.version,
        current.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled,
      );
      const nextAbilitySources = syncSourceEntries(
        normalizedAbilities,
        current.commonSections.abilitySources,
        (name) => getMmsf2AbilitySources(name, current.version),
      );

      if (
        haveSameCardEntries(current.commonSections.abilities, normalizedAbilities) &&
        haveSameSourceEntries(current.commonSections.abilitySources, nextAbilitySources)
      ) {
        return current;
      }

      return {
        ...current,
        commonSections: {
          ...current.commonSections,
          abilities: normalizedAbilities,
          abilitySources: nextAbilitySources,
        },
      };
    });
  }, [draft?.game, draft?.version, draft?.commonSections.abilities]);

  useEffect(() => {
    setDraft((current) => {
      if (!current || current.game !== "mmsf2") {
        return current;
      }

      const nextWeaponSources = syncMmsf2WarRockWeaponSources(
        current.gameSpecificSections.mmsf2.warRockWeapon,
        current.gameSpecificSections.mmsf2.warRockWeaponSources,
      );

      if (haveSameSourceEntries(current.gameSpecificSections.mmsf2.warRockWeaponSources, nextWeaponSources)) {
        return current;
      }

      return {
        ...current,
        gameSpecificSections: {
          ...current.gameSpecificSections,
          mmsf2: {
            ...current.gameSpecificSections.mmsf2,
            warRockWeaponSources: nextWeaponSources,
          },
        },
      };
    });
  }, [draft?.game, draft?.gameSpecificSections.mmsf2.warRockWeapon]);

  const validation = useMemo(() => (draft ? validateBuild(draft) : { errors: [], totalCards: 0, hasFolderErrors: false }), [draft]);
  const hasValidationErrors = validation.errors.length > 0;
  const statusToneClass =
    status.includes("解消") || status.includes("失敗") || status.includes("エラー")
      ? "text-red-200/90"
      : "text-cyan-200/80";

  if (!loaded || !draft) {
    return (
      <AppShell>
        <section className="glass-panel text-sm text-white/70">構築エディタを読み込み中です。</section>
      </AppShell>
    );
  }

  const versionRule = getVersionRuleSet(draft.version);
  const normalizedMmsf3State = draft.game === "mmsf3" ? getNormalizedMmsf3State(draft) : null;
  const cardSuggestions =
    draft.game === "mmsf3"
      ? getCardSuggestions(draft.game, draft.version)
      : sortCardSuggestions(
          draft.game,
          uniqueStrings([...getCardSuggestions(draft.game, draft.version), ...MASTER_DATA.cardsByGame[draft.game]]),
          draft.version,
        );
  const cardSourceNameSuggestions =
    draft.game === "mmsf3"
      ? cardSuggestions
      : sortCardSuggestions(
          draft.game,
          uniqueStrings([...getCardSourceNameSuggestions(draft.game, draft.version), ...MASTER_DATA.cardsByGame[draft.game]]),
          draft.version,
        );
  const abilitySuggestions = MASTER_DATA.abilitiesByGame[draft.game];
  const abilityNameSuggestions =
    draft.game === "mmsf3" ? MMSF3_ABILITY_OPTIONS.map((option) => option.label)
    : draft.game === "mmsf2" ? getMmsf2AbilityNameSuggestions(draft.version)
    : abilitySuggestions;
  const brotherSuggestions = MASTER_DATA.brothersByGame[draft.game];
  const sourceSuggestions = uniqueStrings([
    ...getSourceSuggestions(draft.game, draft.version),
    ...MASTER_DATA.sourceTagsByGame[draft.game],
  ]);
  const allCardEntries = draft.game === "mmsf2" ? getMmsf2TrackedCards(draft) : draft.commonSections.cards;
  const missingCardSourceNames = getMissingSourceNames(
    allCardEntries,
    draft.commonSections.cardSources,
    (name) => getKnownCardSources(draft.game, name, draft.version),
  );
  const missingAbilitySourceNames =
    draft.game === "mmsf3" && normalizedMmsf3State
      ? getMissingMmsf3AbilitySourceNames(normalizedMmsf3State, draft.version)
      : draft.game === "mmsf2"
        ? getMissingSourceNames(
            draft.commonSections.abilities,
            draft.commonSections.abilitySources,
            (name) => getMmsf2AbilitySources(name, draft.version),
          )
      : getMissingSourceNames(
          draft.commonSections.abilities,
          draft.commonSections.abilitySources,
          (name) => getKnownCardSources(draft.game, name, draft.version),
        );
  const mmsf1or2WeaponName =
    draft.game === "mmsf1" ? draft.gameSpecificSections.mmsf1.warRockWeapon.trim()
    : draft.game === "mmsf2" ? draft.gameSpecificSections.mmsf2.warRockWeapon.trim()
    : "";
  const mmsf1or2WeaponSources =
    draft.game === "mmsf1" ? draft.gameSpecificSections.mmsf1.warRockWeaponSources
    : draft.game === "mmsf2" ? draft.gameSpecificSections.mmsf2.warRockWeaponSources
    : [];
  const missingWarRockWeaponSourceNames =
    draft.game === "mmsf3" && normalizedMmsf3State
      ? getMissingMmsf3WarRockWeaponSourceNames(normalizedMmsf3State)
      : mmsf1or2WeaponName
        ? getMissingSourceNames(
            [{ name: mmsf1or2WeaponName }],
            mmsf1or2WeaponSources,
            draft.game === "mmsf1" ? getMmsf1WarRockWeaponSources : getMmsf2WarRockWeaponSources,
          )
        : [];

  const updateCommon = <K extends keyof CommonSections>(key: K, value: CommonSections[K]) => {
    setDraft((current) => (current ? { ...current, commonSections: { ...current.commonSections, [key]: value } } : current));
  };
  const updateCards = (entries: BuildCardEntry[]) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const normalizedBlankCards =
        current.game === "mmsf2"
          ? createMmsf2BlankCardDraftEntries(
              current.gameSpecificSections.mmsf2.blankCards,
              getMmsf2BlankCardTotalLimit(entries, current.gameSpecificSections.mmsf2.starCards, getVersionRuleSet(current.version).folderLimit),
              true,
            )
          : [];
      const allCards = current.game === "mmsf2"
        ? [...entries, ...current.gameSpecificSections.mmsf2.starCards, ...normalizedBlankCards]
        : entries;
      const nextCardSources = syncSourceEntries(
        allCards,
        current.commonSections.cardSources,
        (name) => getKnownCardSources(current.game, name, current.version),
      );

      return {
        ...current,
        commonSections: {
          ...current.commonSections,
          cards: entries,
          cardSources: nextCardSources,
        },
        gameSpecificSections:
          current.game === "mmsf2"
            ? {
                ...current.gameSpecificSections,
                mmsf2: {
                  ...current.gameSpecificSections.mmsf2,
                  blankCards: normalizedBlankCards,
                },
              }
            : current.gameSpecificSections,
      };
    });
  };
  const updateAbilities = (entries: BuildCardEntry[]) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const nextAbilities = current.game === "mmsf2"
        ? normalizeMmsf2AbilityEntries(entries, current.version, current.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled)
        : entries;
      const nextAbilitySources = syncSourceEntries(
        nextAbilities,
        current.commonSections.abilitySources,
        (name) => current.game === "mmsf2" ? getMmsf2AbilitySources(name, current.version) : getKnownCardSources(current.game, name, current.version),
      );

      return {
        ...current,
        commonSections: {
          ...current.commonSections,
          abilities: nextAbilities,
          abilitySources: nextAbilitySources,
        },
      };
    });
  };
  const updateMmsf2BlankCards = (entries: BuildCardEntry[]) => {
    setDraft((current) => {
      if (!current || current.game !== "mmsf2") {
        return current;
      }

      const normalizedBlankCards = createMmsf2BlankCardDraftEntries(
        entries,
        getMmsf2BlankCardTotalLimit(current.commonSections.cards, current.gameSpecificSections.mmsf2.starCards, getVersionRuleSet(current.version).folderLimit),
      );
      const allCards = [...current.commonSections.cards, ...current.gameSpecificSections.mmsf2.starCards, ...normalizedBlankCards];
      const nextCardSources = syncSourceEntries(
        allCards,
        current.commonSections.cardSources,
        (name) => getKnownCardSources(current.game, name, current.version),
      );

      return {
        ...current,
        commonSections: {
          ...current.commonSections,
          cardSources: nextCardSources,
        },
        gameSpecificSections: {
          ...current.gameSpecificSections,
          mmsf2: {
            ...current.gameSpecificSections.mmsf2,
            blankCards: normalizedBlankCards,
          },
        },
      };
    });
  };

  const rockmanSection = (
    <div className="glass-panel">
      <p className="text-sm font-semibold text-white">ロックマン</p>

      {draft.game === "mmsf1" && (
        <>
          <Mmsf1EditorSections
            state={draft.gameSpecificSections.mmsf1}
            onEnhancementChange={(value) =>
              setDraft((current) =>
                current
                  ? { ...current, gameSpecificSections: { ...current.gameSpecificSections, mmsf1: { ...current.gameSpecificSections.mmsf1, enhancement: value } } }
                  : current,
              )
            }
          />
          <Mmsf1WarRockSection
            state={draft.gameSpecificSections.mmsf1}
            warRockWeapons={MASTER_DATA.warRockWeaponsByGame.mmsf1}
            sourceSuggestions={sourceSuggestions}
            missingWarRockWeaponSourceNames={missingWarRockWeaponSourceNames}
            resolveKnownSources={getMmsf1WarRockWeaponSources}
            onWarRockWeaponChange={(value) =>
              setDraft((current) =>
                current
                  ? {
                    ...current,
                    gameSpecificSections: {
                      ...current.gameSpecificSections,
                      mmsf1: {
                        ...current.gameSpecificSections.mmsf1,
                        warRockWeapon: value,
                        warRockWeaponSources: syncMmsf1WarRockWeaponSources(
                          value,
                          current.gameSpecificSections.mmsf1.warRockWeaponSources,
                        ),
                      },
                    },
                  }
                  : current,
              )
            }
            onWarRockWeaponSourcesChange={(entries) =>
              setDraft((current) =>
                current
                ? { ...current, gameSpecificSections: { ...current.gameSpecificSections, mmsf1: { ...current.gameSpecificSections.mmsf1, warRockWeaponSources: entries } } }
                : current,
              )
            }
          />
        </>
      )}

      {draft.game === "mmsf2" && (
        <>
          <Mmsf2EditorSections
            state={draft.gameSpecificSections.mmsf2}
            onEnhancementChange={(value) =>
              setDraft((current) =>
                current
                  ? { ...current, gameSpecificSections: { ...current.gameSpecificSections, mmsf2: { ...current.gameSpecificSections.mmsf2, enhancement: value } } }
                  : current,
              )
            }
          />
          <Mmsf2WarRockSection
            state={draft.gameSpecificSections.mmsf2}
            warRockWeapons={MASTER_DATA.warRockWeaponsByGame.mmsf2}
            sourceSuggestions={sourceSuggestions}
            missingWarRockWeaponSourceNames={missingWarRockWeaponSourceNames}
            resolveKnownSources={getMmsf2WarRockWeaponSources}
            onWarRockWeaponChange={(value) =>
              setDraft((current) =>
                current
                  ? {
                    ...current,
                    gameSpecificSections: {
                      ...current.gameSpecificSections,
                      mmsf2: {
                        ...current.gameSpecificSections.mmsf2,
                        warRockWeapon: value,
                        warRockWeaponSources: syncMmsf2WarRockWeaponSources(
                          value,
                          current.gameSpecificSections.mmsf2.warRockWeaponSources,
                        ),
                      },
                    },
                  }
                  : current,
              )
            }
            onWarRockWeaponSourcesChange={(entries) =>
              setDraft((current) =>
                current
                  ? { ...current, gameSpecificSections: { ...current.gameSpecificSections, mmsf2: { ...current.gameSpecificSections.mmsf2, warRockWeaponSources: entries } } }
                  : current,
              )
            }
          />
        </>
      )}

      {draft.game === "mmsf3" && (
        normalizedMmsf3State ? (
          <Mmsf3EditorSections
            version={draft.version}
            state={normalizedMmsf3State}
            abilityNameSuggestions={abilityNameSuggestions}
            sourceSuggestions={sourceSuggestions}
            missingAbilitySourceNames={missingAbilitySourceNames}
            missingWarRockWeaponSourceNames={missingWarRockWeaponSourceNames}
            onNoiseChange={(noise) => setDraft((current) => (current ? updateMmsf3Noise(current, noise) : current))}
            onWarRockWeaponChange={(value) =>
              setDraft((current) => (current ? updateMmsf3WarRockWeapon(current, value) : current))
            }
            onWarRockWeaponSourcesChange={(entries) =>
              setDraft((current) => (current ? updateMmsf3WarRockWeaponSources(current, entries) : current))
            }
            onPlayerRezonCardChange={(value) =>
              setDraft((current) => (current ? updateMmsf3PlayerRezonCard(current, value) : current))
            }
            onWhiteCardSetIdChange={(value) =>
              setDraft((current) => (current ? updateMmsf3WhiteCardSetId(current, value) : current))
            }
            onNoiseCardIdsChange={(values) =>
              setDraft((current) => (current ? updateMmsf3NoiseCardIds(current, values) : current))
            }
            onAbilitiesChange={(entries) =>
              setDraft((current) => (current ? updateMmsf3AbilityEntries(current, entries) : current))
            }
            onAbilitySourcesChange={(entries) =>
              setDraft((current) => (current ? updateMmsf3AbilitySources(current, entries) : current))
            }
          />
        ) : null
      )}

      {draft.game === "mmsf2" && (
        <Mmsf2AbilitySection
          entries={draft.commonSections.abilities}
          abilitySources={draft.commonSections.abilitySources}
          defaultTribeAbilityEnabled={draft.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled}
          kokouNoKakera={draft.gameSpecificSections.mmsf2.kokouNoKakera}
          version={draft.version}
          abilityNameSuggestions={abilityNameSuggestions}
          sourceSuggestions={sourceSuggestions}
          missingAbilitySourceNames={missingAbilitySourceNames}
          onAbilitiesChange={updateAbilities}
          onAbilitySourcesChange={(entries) => updateCommon("abilitySources", entries)}
          onDefaultTribeAbilityEnabledChange={(value) =>
            setDraft((current) =>
              current && current.game === "mmsf2"
                ? {
                    ...current,
                    gameSpecificSections: {
                      ...current.gameSpecificSections,
                      mmsf2: {
                        ...current.gameSpecificSections.mmsf2,
                        defaultTribeAbilityEnabled: value,
                      },
                    },
                  }
                : current,
            )
          }
        />
      )}

    </div>
  );

  const mmsf2StarCardSuggestions = draft.game === "mmsf2" ? getMmsf2StarCardSuggestions(draft.version) : [];
  const mmsf2BlankCardSuggestions = draft.game === "mmsf2" ? getMmsf2BlankCardSuggestions(draft.version) : [];

  const battleCardsSection = (
    <div className="glass-panel grid gap-4">
      <p className="text-sm font-semibold text-white">フォルダー</p>

      <CardListEditor
        title="対戦構築カード"
        entries={draft.commonSections.cards}
        onChange={updateCards}
        suggestions={cardSuggestions}
        totalLimit={
          draft.game === "mmsf2"
            ? getMmsf2NormalCardTotalLimit(
                draft.gameSpecificSections.mmsf2.starCards,
                draft.gameSpecificSections.mmsf2.blankCards,
                versionRule.folderLimit,
              )
            : undefined
        }
        allowRegularSelection
        regularLabel={draft.game === "mmsf1" || draft.game === "mmsf2" ? "FAV" : "REG"}
        regularLimit={draft.game === "mmsf1" ? 6 : draft.game === "mmsf2" ? 4 : 1}
      />

      {draft.game === "mmsf2" && (
        <CardListEditor
          title="スターカード"
          entries={draft.gameSpecificSections.mmsf2.starCards}
          onChange={(entries) =>
            setDraft((current) => {
              if (!current) return current;
              const normalizedBlankCards = createMmsf2BlankCardDraftEntries(
                current.gameSpecificSections.mmsf2.blankCards,
                getMmsf2BlankCardTotalLimit(current.commonSections.cards, entries, getVersionRuleSet(current.version).folderLimit),
                true,
              );
              const allCards = [...current.commonSections.cards, ...entries, ...normalizedBlankCards];
              const nextCardSources = syncSourceEntries(
                allCards,
                current.commonSections.cardSources,
                (name) => getKnownCardSources(current.game, name, current.version),
              );
              return {
                ...current,
                commonSections: { ...current.commonSections, cardSources: nextCardSources },
                gameSpecificSections: {
                  ...current.gameSpecificSections,
                  mmsf2: {
                    ...current.gameSpecificSections.mmsf2,
                    starCards: entries,
                    blankCards: normalizedBlankCards,
                  },
                },
              };
            })
          }
          suggestions={mmsf2StarCardSuggestions}
          hideAddButton
          hideQuantity
          hideDelete
        />
      )}

      {draft.game === "mmsf2" && (
        <CardListEditor
          title="ブランクカード"
          entries={draft.gameSpecificSections.mmsf2.blankCards}
          onChange={updateMmsf2BlankCards}
          suggestions={mmsf2BlankCardSuggestions}
          hideAddButton
          hideQuantity
        />
      )}

      <SourceListEditor
        title="カード入手方法"
        entries={draft.commonSections.cardSources}
        onChange={(entries) => updateCommon("cardSources", entries)}
        game={draft.game}
        version={draft.version}
        nameSuggestions={cardSourceNameSuggestions}
        sourceSuggestions={sourceSuggestions}
        missingNames={missingCardSourceNames}
        useKnownSourceSuggestions
        actionMode="owned"
      />
    </div>
  );

  const brotherSection =
    draft.game === "mmsf3" ? (
      normalizedMmsf3State ? (
        <Mmsf3BrotherRouletteSection
          slots={normalizedMmsf3State.brotherRouletteSlots}
          sssLevels={normalizedMmsf3State.sssLevels}
          onBrotherChange={(slots) =>
            setDraft((current) => (current ? updateMmsf3BrotherRouletteSlots(current, slots) : current))
          }
          onSssChange={(sssLevels) =>
            setDraft((current) => (current ? updateMmsf3SssLevels(current, sssLevels) : current))
          }
          isDisabled={normalizedMmsf3State.noise === "ブライノイズ"}
        />
      ) : null
    ) : draft.game === "mmsf2" ? (
      <Mmsf2BrotherSection
        entries={draft.commonSections.brothers}
        onChange={(entries) => updateCommon("brothers", entries)}
        getCardSuggestionsForVersion={(version) => getCardSuggestions("mmsf2", (version || draft.version) as VersionId)}
        isDisabled={draft.gameSpecificSections.mmsf2.enhancement === "burai"}
        kokouNoKakera={draft.gameSpecificSections.mmsf2.kokouNoKakera}
        onKokouNoKakeraChange={(value) =>
          setDraft((current) =>
            current
              ? { ...current, gameSpecificSections: { ...current.gameSpecificSections, mmsf2: { ...current.gameSpecificSections.mmsf2, kokouNoKakera: value } } }
              : current,
          )
        }
      />
    ) : draft.game === "mmsf1" ? (
      <Mmsf1BrotherSection
        entries={draft.commonSections.brothers}
        onChange={(entries) => updateCommon("brothers", entries)}
        cardSuggestions={cardSuggestions}
        currentVersion={draft.version as Extract<VersionId, "pegasus" | "leo" | "dragon">}
        isDisabled={false}
      />
    ) : (
      <BrotherListEditor
        entries={draft.commonSections.brothers}
        onChange={(entries) => updateCommon("brothers", entries)}
        suggestions={brotherSuggestions}
      />
    );

  const renderExportSceneToPng = async () => {
    if (!exportRef.current) {
      return null;
    }

    return toPng(exportRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#05050f",
    });
  };

  return (
    <AppShell>
      <section className="glass-panel">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/75">{GAME_LABELS[draft.game]}</p>
            <h2 className="mt-3 text-4xl font-black text-white">{VERSION_LABELS[draft.version]}</h2>
          </div>

          <div className="flex flex-wrap gap-3 self-start 2xl:justify-end">
            <button
              type="button"
              className="secondary-button whitespace-nowrap"
              onClick={() => {
                const reset = createEmptyBuild(draft.game);
                reset.version = draft.version;
                setDraft(reset);
                router.replace(buildEditorHref(draft.game, draft.version));
              }}
            >
              <FilePlus2 className="mr-2 size-4" />
              新規に戻す
            </button>
            {buildId && (
              <button
                type="button"
                className="secondary-button whitespace-nowrap"
                onClick={() => {
                  const duplicate = duplicateBuild(buildId);
                  if (duplicate) {
                    router.replace(buildEditorHref(duplicate.game, duplicate.version, duplicate.id));
                  }
                }}
              >
                <Sparkles className="mr-2 size-4" />
                複製して編集
              </button>
            )}
            <button
              type="button"
              className="clear-action-button whitespace-nowrap"
              onClick={() => {
                if (validation.errors.length > 0) {
                  setStatus("保存前にエラーを解消してください。");
                  return;
                }

                const saved = upsertBuild(draft);
                window.localStorage.removeItem(draftStorageKey);
                setDraft(saved);
                setStatus("構築を保存しました。");
                router.replace(buildEditorHref(saved.game, saved.version, saved.id));
              }}
            >
              <Save className="mr-2 size-4" />
              保存
            </button>
            <button
              type="button"
              className="clear-action-button whitespace-nowrap"
              disabled={isPreviewing}
              onClick={async () => {
                setIsPreviewing(true);
                try {
                  const dataUrl = await renderExportSceneToPng();
                  if (!dataUrl) {
                    return;
                  }

                  setPreviewImageUrl(dataUrl);
                  setStatus("PNG プレビューを更新しました。");
                } catch {
                  setStatus("PNG プレビューの生成に失敗しました。");
                } finally {
                  setIsPreviewing(false);
                }
              }}
            >
              <Eye className="mr-2 size-4" />
              PNG プレビュー
            </button>
            <button
              type="button"
              className="clear-action-button whitespace-nowrap"
              disabled={isExporting}
              onClick={async () => {
                setIsExporting(true);
                try {
                  const dataUrl = await renderExportSceneToPng();
                  if (!dataUrl) {
                    return;
                  }

                  const anchor = document.createElement("a");
                  anchor.download = `${draft.title || VERSION_LABELS[draft.version]}-build.png`;
                  anchor.href = dataUrl;
                  anchor.click();
                  setStatus("PNG を出力しました。");
                } catch {
                  setStatus("PNG の出力に失敗しました。");
                } finally {
                  setIsExporting(false);
                }
              }}
            >
              <FileImage className="mr-2 size-4" />
              PNG 出力
            </button>
          </div>
        </div>

        {status && <p className={`mt-4 text-sm ${statusToneClass}`}>{status}</p>}
        <p className="mt-3 text-xs text-white/45">この画面の入力内容はブラウザに一時保存されるため、保存前にリロードしても復元されます。</p>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="grid min-w-0 gap-6">
          <div className="glass-panel">
            <div>
              <p className="text-sm font-semibold text-white">基本情報</p>
              <p className="mt-1 text-sm text-white/60">構築名、作品、概要、タグをまとめて編集します。</p>
            </div>

            <div className="mt-4 grid items-start gap-4 md:grid-cols-[minmax(0,1.1fr)_0.45fr_0.45fr]">
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                placeholder="構築名"
                className="field-shell"
              />
              <SearchableSelectInput
                value={draft.game}
                onChange={(value) => {
                  const nextGame = value as GameId;
                  setDraft((current) =>
                    current
                      ? normalizeMmsf3BuildRecord({
                          ...current,
                          game: nextGame,
                          version: getDefaultVersionForGame(nextGame),
                        })
                      : current,
                  );
                }}
                options={Object.entries(GAME_LABELS).map(([value, label]) => ({ value, label }))}
                placeholder="ゲームタイトル"
                className="field-shell min-h-[52px] w-full"
              />
              <SearchableSelectInput
                value={draft.version}
                onChange={(value) =>
                  setDraft((current) =>
                    current
                      ? normalizeMmsf3BuildRecord({
                          ...current,
                          version: value as BuildRecord["version"],
                          gameSpecificSections: current.game === "mmsf2"
                            ? {
                                ...current.gameSpecificSections,
                                mmsf2: {
                                  ...current.gameSpecificSections.mmsf2,
                                  defaultTribeAbilityEnabled: true,
                                },
                              }
                            : current.gameSpecificSections,
                        })
                      : current,
                  )
                }
                options={VERSIONS_BY_GAME[draft.game].map((version) => ({ value: version, label: VERSION_LABELS[version] }))}
                placeholder="バージョン"
                className="field-shell min-h-[52px] w-full"
              />
              <textarea
                value={draft.commonSections.overview}
                onChange={(event) => updateCommon("overview", event.target.value)}
                placeholder="構築全体の概要、環境、狙い"
                className="field-shell min-h-48 w-full"
              />
              <div className="md:col-span-2">
                <TagEditor
                  label="構築タグ"
                  values={draft.commonSections.tags}
                  onChange={(values) => updateCommon("tags", values)}
                  suggestions={["対戦用", "大会想定", "速攻", "コントロール", "安定重視"]}
                  placeholder="タグ追加"
                />
              </div>
            </div>
          </div>

          {rockmanSection}

          {battleCardsSection}

          {brotherSection}
        </div>

        <div className="grid min-w-0 gap-6">
          <div className={`glass-panel ${hasValidationErrors ? "ring-1 ring-red-400/20" : ""}`}>
            <div className={`flex items-center gap-3 text-sm font-semibold ${hasValidationErrors ? "text-red-100" : "text-white"}`}>
              <AlertTriangle className={`size-4 ${hasValidationErrors ? "text-red-300" : "text-cyan-200"}`} />
              バリデーション
            </div>
            <div className="mt-4 grid gap-4">
              <div className={`glass-panel-soft ${hasValidationErrors ? "bg-red-500/8 ring-1 ring-red-400/25" : ""}`}>
                <p className="text-sm font-semibold text-white">状態</p>
                {hasValidationErrors ? (
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-red-200/90">
                    <li>• カード総数: {validation.totalCards} / {versionRule.folderLimit}</li>
                    {validation.errors.map((error) => (
                      <li key={error}>• {error}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 space-y-2 text-sm text-emerald-200/90">
                    <p>カード総数: {validation.totalCards} / {versionRule.folderLimit}</p>
                    <p>保存可能です。</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0">
        <ExportScene ref={exportRef} build={draft} />
      </div>

      {previewImageUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[1280px] rounded-[32px] border border-white/12 bg-[linear-gradient(160deg,rgba(8,12,36,0.96),rgba(29,25,68,0.94))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">PNG プレビュー</p>
                <p className="mt-1 text-sm text-white/60">カード画像が未取得の項目はタイトル付きプレースホルダで出力します。</p>
              </div>
              <button type="button" className="secondary-button whitespace-nowrap" onClick={() => setPreviewImageUrl(null)}>
                <X className="mr-2 size-4" />
                閉じる
              </button>
            </div>
            <div className="mt-4 overflow-auto">
              <Image
                src={previewImageUrl}
                alt="PNG preview"
                width={1200}
                height={675}
                unoptimized
                className="mx-auto h-auto w-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
