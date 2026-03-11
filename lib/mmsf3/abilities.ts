import abilityOptionsData from "@/data/mmsf3/ability-options.json";
import type { BuildCardEntry, VersionId } from "@/lib/types";
import { createId, normalizeToken } from "@/lib/utils";

export type Mmsf3AbilityOption = {
  id: string;
  name: string;
  cost: number;
  maxCount: number;
  label: string;
  sources: string[];
  effect: string;
};

type RawMmsf3AbilityOption = Omit<Mmsf3AbilityOption, "label"> & {
  label: string;
};

function toFullWidthAll(value: string) {
  return value.replace(/[A-Za-z0-9+]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0xFEE0));
}

function toDisplayAbilityName(value: string) {
  return value.replace(/[A-Za-z]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0xFEE0));
}

function buildAbilityDisplayLabel(name: string, cost: number) {
  return `${toDisplayAbilityName(name)}/${cost}`;
}

export const MMSF3_ABILITY_OPTIONS = (abilityOptionsData.entries as RawMmsf3AbilityOption[]).map((entry) => ({
  ...entry,
  label: buildAbilityDisplayLabel(entry.name, entry.cost),
}));

const abilityByLabel = new Map<string, Mmsf3AbilityOption>();
const abilityByNormalizedName = new Map<string, Mmsf3AbilityOption[]>();
const abilityByNameAndCost = new Map<string, Mmsf3AbilityOption>();
const BLACK_ACE_DEFAULT_ABILITY_NAME = "エースPGM";
const RED_JOKER_DEFAULT_ABILITY_NAME = "ジョーカーPGM";
const MEGA_CLASS_UP_ABILITY_NAME = "メガクラス+1";
const GIGA_CLASS_UP_ABILITY_NAME = "ギガクラス+1";

for (const option of MMSF3_ABILITY_OPTIONS) {
  abilityByLabel.set(option.label, option);
  abilityByLabel.set(`${option.name}/${option.cost}`, option);
  abilityByLabel.set(`${toFullWidthAll(option.name)}/${option.cost}`, option);

  const normalizedName = normalizeToken(option.name);
  const byName = abilityByNormalizedName.get(normalizedName) ?? [];
  byName.push(option);
  abilityByNormalizedName.set(normalizedName, byName);
  abilityByNameAndCost.set(`${option.name}::${option.cost}`, option);
}

for (const options of abilityByNormalizedName.values()) {
  options.sort((left, right) => left.cost - right.cost);
}

function getMmsf3VersionDefaultAbilityName(version: VersionId) {
  if (version === "black-ace") {
    return BLACK_ACE_DEFAULT_ABILITY_NAME;
  }

  if (version === "red-joker") {
    return RED_JOKER_DEFAULT_ABILITY_NAME;
  }

  return null;
}

function isMmsf3VersionDefaultAbilityName(name: string) {
  return name === BLACK_ACE_DEFAULT_ABILITY_NAME || name === RED_JOKER_DEFAULT_ABILITY_NAME;
}

function getMmsf3AbilityName(entry: Pick<BuildCardEntry, "name">) {
  return getMmsf3AbilityByLabel(entry.name)?.name ?? entry.name.trim();
}

export function getMmsf3AbilityPointLimit(noise: string, sssSlotCount = 0) {
  if (noise === "ブライノイズ") {
    return 900;
  }

  return 1900 - Math.min(Math.max(sssSlotCount, 0), 3) * 140;
}

export function getMmsf3AbilityByLabel(label: string) {
  return abilityByLabel.get(label.trim()) ?? null;
}

export function getMmsf3AbilityByNameAndCost(name: string, cost: number) {
  return abilityByNameAndCost.get(`${name.trim()}::${cost}`) ?? null;
}

export function getMmsf3VersionDefaultAbilityLabels(version: VersionId) {
  const defaultAbilityName = getMmsf3VersionDefaultAbilityName(version);
  const defaultAbilityLabel = defaultAbilityName
    ? abilityByNormalizedName.get(normalizeToken(defaultAbilityName))?.[0]?.label ?? null
    : null;
  return defaultAbilityLabel ? [defaultAbilityLabel] : [];
}

export function isMmsf3VersionDefaultAbility(label: string, version: VersionId) {
  const ability = getMmsf3AbilityByLabel(label);
  return ability ? ability.name === getMmsf3VersionDefaultAbilityName(version) : false;
}

export function isMmsf3AbilitySourceTracked(label: string, version: VersionId) {
  return !isMmsf3VersionDefaultAbility(label, version);
}

export function normalizeMmsf3AbilityEntries(entries: BuildCardEntry[], version: VersionId) {
  const normalizedEntries = entries.map((entry) => normalizeMmsf3AbilityEntry(entry));
  const requiredName = getMmsf3VersionDefaultAbilityName(version);
  const keptEntries = normalizedEntries.filter((entry) => {
    const abilityName = getMmsf3AbilityName(entry);
    return !isMmsf3VersionDefaultAbilityName(abilityName) || abilityName === requiredName;
  });

  if (!requiredName) {
    return keptEntries;
  }

  const existingDefaultEntry = keptEntries.find((entry) => getMmsf3AbilityName(entry) === requiredName);
  const defaultAbility = abilityByNormalizedName.get(normalizeToken(requiredName))?.[0];
  const requiredEntry =
    existingDefaultEntry ??
    (defaultAbility
      ? {
          id: createId(),
          name: defaultAbility.label,
          quantity: defaultAbility.cost,
          notes: "",
          isRegular: false,
        }
      : null);
  const nonDefaultEntries = keptEntries.filter((entry) => getMmsf3AbilityName(entry) !== requiredName);

  return requiredEntry ? [requiredEntry, ...nonDefaultEntries] : nonDefaultEntries;
}

export function getMmsf3AbilitySources(label: string) {
  return getMmsf3AbilityByLabel(label)?.sources ?? [];
}

function getMmsf3AbilitySelectionLimit(option: Mmsf3AbilityOption) {
  return option.maxCount;
}

export function normalizeMmsf3AbilityEntry(entry: BuildCardEntry): BuildCardEntry {
  const rawName = entry.name.trim();
  const byLabel = getMmsf3AbilityByLabel(rawName);

  if (byLabel) {
    return { ...entry, name: byLabel.label, quantity: byLabel.cost };
  }

  const byNameAndCost = getMmsf3AbilityByNameAndCost(rawName, entry.quantity);
  if (byNameAndCost) {
    return { ...entry, name: byNameAndCost.label, quantity: byNameAndCost.cost };
  }

  const byName = abilityByNormalizedName.get(normalizeToken(rawName));
  if (byName && byName.length > 0) {
    return { ...entry, name: byName[0].label, quantity: byName[0].cost };
  }

  return entry;
}

export function getMmsf3AbilityOptionsForSlot(entries: BuildCardEntry[], index: number, version?: VersionId) {
  const currentLabel = entries[index]?.name.trim() ?? "";
  const selectedCounts = new Map<string, number>();

  entries.forEach((entry, entryIndex) => {
    const label = entry.name.trim();
    if (!label || entryIndex === index || label === currentLabel) {
      return;
    }

    selectedCounts.set(label, (selectedCounts.get(label) ?? 0) + 1);
  });

  const allowedDefaultName = version ? getMmsf3VersionDefaultAbilityName(version) : null;

  return MMSF3_ABILITY_OPTIONS.filter((option) => {
    if ((selectedCounts.get(option.label) ?? 0) >= getMmsf3AbilitySelectionLimit(option)) {
      return false;
    }

    if (isMmsf3VersionDefaultAbilityName(option.name) && option.name !== allowedDefaultName) {
      return false;
    }

    return true;
  });
}

export function getMmsf3AbilitySelectionErrors(entries: BuildCardEntry[], noise: string, sssSlotCount = 0) {
  const selectedEntries = entries
    .map((entry) => normalizeMmsf3AbilityEntry(entry))
    .filter((entry) => entry.name.trim());
  const errors: string[] = [];
  const countsByLabel = new Map<string, number>();

  const unknownEntries = selectedEntries.filter((entry) => !getMmsf3AbilityByLabel(entry.name));
  if (unknownEntries.length > 0) {
    errors.push("未対応のアビリティ項目があります。");
  }

  for (const entry of selectedEntries) {
    const label = entry.name.trim();
    countsByLabel.set(label, (countsByLabel.get(label) ?? 0) + 1);
  }

  for (const [label, count] of countsByLabel.entries()) {
    const ability = getMmsf3AbilityByLabel(label);

    if (!ability) {
      continue;
    }

    const limit = getMmsf3AbilitySelectionLimit(ability);
    if (count > limit) {
      errors.push(`${label} は最大${limit}個までです。`);
    }
  }

  const totalCost = selectedEntries.reduce((sum, entry) => sum + (Number.isFinite(entry.quantity) ? entry.quantity : 0), 0);
  const limit = getMmsf3AbilityPointLimit(noise, sssSlotCount);

  if (totalCost > limit) {
    errors.push(`アビリティ消費Pは ${limit} 以内にしてください。`);
  }

  return { errors, totalCost, limit };
}

export function getMmsf3FolderClassBonuses(entries: BuildCardEntry[]) {
  let megaBonus = 0;
  let gigaBonus = 0;

  for (const entry of entries.map((item) => normalizeMmsf3AbilityEntry(item))) {
    const ability = getMmsf3AbilityByLabel(entry.name);
    if (!ability) {
      continue;
    }

    if (ability.name === MEGA_CLASS_UP_ABILITY_NAME) {
      megaBonus += 1;
      continue;
    }

    if (ability.name === GIGA_CLASS_UP_ABILITY_NAME) {
      gigaBonus += 1;
    }
  }

  return { megaBonus, gigaBonus };
}
