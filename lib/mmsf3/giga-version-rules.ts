import type { Mmsf3BrotherVersionId } from "@/lib/types";
import {
  getMmsf3GigaCardOptionByLabel,
  MMSF3_GIGA_CARD_OPTIONS,
} from "@/lib/mmsf3/roulette-data";

const MMSF3_GIGA_CARD_REQUIRED_VERSION_BY_VALUE: Partial<Record<string, Mmsf3BrotherVersionId>> = {
  "0C4": "black-ace",
  "0C5": "black-ace",
  "0C6": "black-ace",
  "0C7": "black-ace",
  "0C8": "black-ace",
  "0C9": "red-joker",
  "0CA": "red-joker",
  "0CB": "red-joker",
  "0CC": "red-joker",
  "0CD": "red-joker",
};

function getMmsf3RequiredVersionForGigaCard(value: string) {
  return MMSF3_GIGA_CARD_REQUIRED_VERSION_BY_VALUE[value] ?? null;
}

export function isMmsf3GigaCardAllowedInVersion(value: string, version: Mmsf3BrotherVersionId) {
  const requiredVersion = getMmsf3RequiredVersionForGigaCard(value);
  return requiredVersion === null || requiredVersion === version;
}

export function getMmsf3GigaCardOptionsForVersion(version?: Mmsf3BrotherVersionId | "") {
  if (!version) {
    return MMSF3_GIGA_CARD_OPTIONS;
  }

  return MMSF3_GIGA_CARD_OPTIONS.filter((option) => isMmsf3GigaCardAllowedInVersion(option.value, version));
}

export function findMmsf3GigaCardOptionByNames(names: string[]) {
  for (const name of names) {
    const option = getMmsf3GigaCardOptionByLabel(name);
    if (option) {
      return option;
    }
  }

  return null;
}
