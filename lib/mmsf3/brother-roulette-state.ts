import {
  DEFAULT_MMSF3_WHITE_CARD_SET_ID,
  MMSF3_BROTHER_ROULETTE_NOISE_OPTIONS,
  MMSF3_BROTHER_ROULETTE_POSITIONS,
  MMSF3_BROTHER_VERSION_OPTIONS,
  MMSF3_SSS_LEVEL_OPTIONS,
  MMSF3_SSS_SLOT_COUNT,
  getMmsf3BrotherVersionOption,
  getMmsf3GigaCardOption,
  getMmsf3GigaCardOptionByLabel,
  getMmsf3MegaCardOption,
  getMmsf3MegaCardOptionByLabel,
  getMmsf3RezonCardOption,
  getMmsf3RezonCardOptionByLabel,
  getMmsf3WhiteCardSetOption,
} from "@/lib/mmsf3/roulette-data";
import { isMmsf3GigaCardAllowedInVersion } from "@/lib/mmsf3/giga-version-rules";
import type { Mmsf3BrotherRoulettePosition, Mmsf3BrotherRouletteSlot, Mmsf3BrotherRouletteSlotType, Mmsf3BrotherVersionId } from "@/lib/types";

const sssLevelOptionValues = new Set(MMSF3_SSS_LEVEL_OPTIONS.map((option) => option.value));
const brotherRouletteNoiseOptionValues = new Set(MMSF3_BROTHER_ROULETTE_NOISE_OPTIONS.map((option) => option.value));
const brotherVersionOptionValues = new Set(MMSF3_BROTHER_VERSION_OPTIONS.map((option) => option.value));

function normalizeRouletteValue(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMmsf3BrotherVersion(value: string | null | undefined): Mmsf3BrotherVersionId | "" {
  const normalizedValue = normalizeRouletteValue(value);
  return brotherVersionOptionValues.has(normalizedValue as Mmsf3BrotherVersionId)
    ? (normalizedValue as Mmsf3BrotherVersionId)
    : "";
}

function createEmptyBrotherRouletteSlot(position: Mmsf3BrotherRoulettePosition): Mmsf3BrotherRouletteSlot {
  return {
    position,
    slotType: "brother",
    sssLevel: "",
    version: "",
    noise: "",
    rezon: "",
    whiteCardSetId: "",
    gigaCard: "",
    megaCard: "",
  };
}

function hasBrotherSlotDetails(slot: Partial<Mmsf3BrotherRouletteSlot> | undefined) {
  return [
    slot?.version,
    slot?.noise,
    slot?.rezon,
    normalizeRouletteValue(slot?.whiteCardSetId) === DEFAULT_MMSF3_WHITE_CARD_SET_ID ? "" : slot?.whiteCardSetId,
    slot?.gigaCard,
    slot?.megaCard,
  ].some((value) => normalizeRouletteValue(value).length > 0);
}

function hasBrotherRouletteSelection(slots: Partial<Mmsf3BrotherRouletteSlot>[] | undefined) {
  return (slots ?? []).some((slot) =>
    slot?.slotType === "sss" || normalizeRouletteValue(slot?.sssLevel).length > 0 || hasBrotherSlotDetails(slot),
  );
}

export function normalizeMmsf3SssLevels(levels: string[] | undefined) {
  return Array.from({ length: MMSF3_SSS_SLOT_COUNT }, (_, index) => {
    const value = normalizeRouletteValue(levels?.[index]);
    return sssLevelOptionValues.has(value) ? value : "";
  });
}

export function buildDefaultMmsf3BrotherRouletteSlots() {
  return MMSF3_BROTHER_ROULETTE_POSITIONS.map((position) => createEmptyBrotherRouletteSlot(position.key));
}

export function getMmsf3SelectedSssLevelsFromBrotherRouletteSlots(slots: Mmsf3BrotherRouletteSlot[]) {
  return slots
    .filter((slot) => slot.slotType === "sss")
    .map((slot) => normalizeRouletteValue(slot.sssLevel))
    .filter((value) => sssLevelOptionValues.has(value))
    .slice(0, MMSF3_SSS_SLOT_COUNT);
}

export function getMmsf3ConfiguredSssSlotCount(slots: Mmsf3BrotherRouletteSlot[]) {
  return slots.filter((slot) => slot.slotType === "sss").length;
}

export function normalizeMmsf3BrotherRouletteSlots(
  slots: Partial<Mmsf3BrotherRouletteSlot>[] | undefined,
  legacy?: {
    whiteCardSetId?: string;
    gigaCards?: string[];
    megaCards?: string[];
    rezonCards?: string[];
    sssLevels?: string[];
  },
) {
  const hasCurrentSssSchema = (slots ?? []).some((slot) => "slotType" in (slot ?? {}) || "sssLevel" in (slot ?? {}));
  const slotsByPosition = new Map(
    (slots ?? [])
      .filter((slot): slot is Partial<Mmsf3BrotherRouletteSlot> & Pick<Mmsf3BrotherRouletteSlot, "position"> => {
        return Boolean(slot?.position && MMSF3_BROTHER_ROULETTE_POSITIONS.some((position) => position.key === slot.position));
      })
      .map((slot) => [slot.position, slot] as const),
  );

  const normalizedSlots: Mmsf3BrotherRouletteSlot[] = MMSF3_BROTHER_ROULETTE_POSITIONS.map(({ key }) => {
    const current = slotsByPosition.get(key);
    const normalizedSssLevel = normalizeRouletteValue(current?.sssLevel);
    const slotType: Mmsf3BrotherRouletteSlotType =
      current?.slotType === "sss" || (!current?.slotType && normalizedSssLevel)
        ? "sss"
        : "brother";

    if (slotType === "sss") {
      return {
        position: key,
        slotType,
        sssLevel: sssLevelOptionValues.has(normalizedSssLevel) ? normalizedSssLevel : "",
        version: "",
        noise: "",
        rezon: "",
        whiteCardSetId: "",
        gigaCard: "",
        megaCard: "",
      };
    }

    return {
      position: key,
      slotType,
      sssLevel: "",
      version: normalizeMmsf3BrotherVersion(current?.version),
      noise: normalizeRouletteValue(current?.noise),
      rezon: normalizeRouletteValue(current?.rezon),
      whiteCardSetId: normalizeRouletteValue(current?.whiteCardSetId),
      gigaCard: normalizeRouletteValue(current?.gigaCard),
      megaCard: normalizeRouletteValue(current?.megaCard),
    };
  });

  const hasExplicitSlotSelection = hasBrotherRouletteSelection(slots);
  const migratedSlots = hasExplicitSlotSelection ? normalizedSlots : buildDefaultMmsf3BrotherRouletteSlots();

  if (!hasExplicitSlotSelection) {
    const legacyWhiteCardSetId = normalizeRouletteValue(legacy?.whiteCardSetId);
    const legacyRezonCard = legacy?.rezonCards?.find((value) => normalizeRouletteValue(value)) ?? "";
    const legacyMegaCards = legacy?.megaCards?.map((value) => value.trim()).filter(Boolean) ?? [];
    const legacyGigaCards = legacy?.gigaCards?.map((value) => value.trim()).filter(Boolean) ?? [];
    const topLeftSlot = migratedSlots[0];

    if (legacyWhiteCardSetId && legacyWhiteCardSetId !== DEFAULT_MMSF3_WHITE_CARD_SET_ID && getMmsf3WhiteCardSetOption(legacyWhiteCardSetId)) {
      topLeftSlot.whiteCardSetId = legacyWhiteCardSetId;
    }

    const legacyRezonOption = getMmsf3RezonCardOptionByLabel(legacyRezonCard);
    if (legacyRezonOption) {
      topLeftSlot.rezon = legacyRezonOption.value;
    }

    legacyMegaCards.slice(0, migratedSlots.length).forEach((name, index) => {
      const option = getMmsf3MegaCardOptionByLabel(name);
      if (option) {
        migratedSlots[index].megaCard = option.value;
      }
    });

    legacyGigaCards.slice(0, migratedSlots.length).forEach((name, index) => {
      const option = getMmsf3GigaCardOptionByLabel(name);
      if (option) {
        migratedSlots[index].gigaCard = option.value;
      }
    });
  }

  if (!hasCurrentSssSchema && getMmsf3ConfiguredSssSlotCount(migratedSlots) === 0) {
    const legacySssLevels = normalizeMmsf3SssLevels(legacy?.sssLevels);
    const availableSlots = migratedSlots.filter((slot) => slot.slotType !== "sss" && !hasBrotherSlotDetails(slot));

    legacySssLevels
      .filter(Boolean)
      .slice(0, MMSF3_SSS_SLOT_COUNT)
      .forEach((level, index) => {
        const targetSlot = availableSlots[index];
        if (!targetSlot) {
          return;
        }

        targetSlot.slotType = "sss";
        targetSlot.sssLevel = level;
        targetSlot.noise = "";
        targetSlot.rezon = "";
        targetSlot.whiteCardSetId = "";
        targetSlot.gigaCard = "";
        targetSlot.megaCard = "";
      });
  }

  return migratedSlots;
}

export function clearMmsf3BrotherSelectionsForBuraNoise(slots: Mmsf3BrotherRouletteSlot[]) {
  return normalizeMmsf3BrotherRouletteSlots(slots).map<Mmsf3BrotherRouletteSlot>((slot) =>
    slot.slotType === "sss"
      ? slot
      : {
          ...slot,
          version: "",
          noise: "",
          rezon: "",
          whiteCardSetId: "",
          gigaCard: "",
          megaCard: "",
        },
  );
}

export function getMmsf3BrotherRouletteSelectionErrors(slots: Mmsf3BrotherRouletteSlot[]) {
  const errors: string[] = [];
  const sssSlotCount = getMmsf3ConfiguredSssSlotCount(slots);

  if (sssSlotCount > MMSF3_SSS_SLOT_COUNT) {
    errors.push(`SSS は ${MMSF3_SSS_SLOT_COUNT} 枠までです。`);
  }

  for (const slot of slots) {
    const label = MMSF3_BROTHER_ROULETTE_POSITIONS.find((position) => position.key === slot.position)?.label ?? slot.position;

    if (slot.slotType === "sss") {
      if (slot.sssLevel && !sssLevelOptionValues.has(slot.sssLevel)) {
        errors.push(`${label} のSSSが不正です。`);
      }
      continue;
    }

    if (slot.noise && !brotherRouletteNoiseOptionValues.has(slot.noise)) {
      errors.push(`${label} のマージノイズが不正です。`);
    }
    if (slot.version && !brotherVersionOptionValues.has(slot.version)) {
      errors.push(`${label} のバージョンが不正です。`);
    }
    if (slot.rezon && !getMmsf3RezonCardOption(slot.rezon)) {
      errors.push(`${label} のレゾンカードが不正です。`);
    }
    if (slot.whiteCardSetId && !getMmsf3WhiteCardSetOption(slot.whiteCardSetId)) {
      errors.push(`${label} のホワイトカードが不正です。`);
    }
    if (slot.gigaCard && !getMmsf3GigaCardOption(slot.gigaCard)) {
      errors.push(`${label} のギガカードが不正です。`);
    } else if (slot.gigaCard && slot.version && !isMmsf3GigaCardAllowedInVersion(slot.gigaCard, slot.version)) {
      const gigaCardLabel = getMmsf3GigaCardOption(slot.gigaCard)?.label ?? slot.gigaCard;
      const versionLabel = getMmsf3BrotherVersionOption(slot.version)?.label ?? slot.version;
      errors.push(`${label} のギガカード「${gigaCardLabel}」は${versionLabel}では設定できません。`);
    }
    if (slot.megaCard && !getMmsf3MegaCardOption(slot.megaCard)) {
      errors.push(`${label} のメガカードが不正です。`);
    }
  }

  return errors;
}
