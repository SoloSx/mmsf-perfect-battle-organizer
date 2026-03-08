import abilityOptionsData from "@/data/mmsf3-ability-options.json";
import type { BuildCardEntry, VersionId } from "@/lib/types";
import { createId, normalizeToken } from "@/lib/utils";

export type Mmsf3AbilityOption = {
  id: string;
  name: string;
  cost: number;
  maxCount: number;
  label: string;
  legacyLabel: string;
  sources: string[];
  effect: string;
};

type RawMmsf3AbilityOption = Omit<Mmsf3AbilityOption, "label" | "legacyLabel"> & {
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

function buildAbilityLegacyLabel(name: string, cost: number) {
  return `${name} (${cost}P)`;
}

export const MMSF3_ABILITY_OPTIONS = (abilityOptionsData.entries as RawMmsf3AbilityOption[]).map((entry) => ({
  ...entry,
  label: buildAbilityDisplayLabel(entry.name, entry.cost),
  legacyLabel: buildAbilityLegacyLabel(entry.name, entry.cost),
}));

const abilityByLabel = new Map<string, Mmsf3AbilityOption>();
const abilityByNormalizedName = new Map<string, Mmsf3AbilityOption[]>();
const abilityByNameAndCost = new Map<string, Mmsf3AbilityOption>();
const MMSF3_VERSION_DEFAULT_ABILITY_NAMES: Partial<Record<VersionId, string[]>> = {
  "black-ace": ["エースPGM"],
  "red-joker": ["ジョーカーPGM"],
};
const allVersionDefaultAbilityNames = new Set(Object.values(MMSF3_VERSION_DEFAULT_ABILITY_NAMES).flat());

for (const option of MMSF3_ABILITY_OPTIONS) {
  abilityByLabel.set(option.label, option);
  abilityByLabel.set(option.legacyLabel, option);
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
  return (MMSF3_VERSION_DEFAULT_ABILITY_NAMES[version] ?? [])
    .map((name) => abilityByNormalizedName.get(normalizeToken(name))?.[0]?.label ?? null)
    .filter((label): label is string => Boolean(label));
}

export function isMmsf3VersionDefaultAbility(label: string, version: VersionId) {
  const ability = getMmsf3AbilityByLabel(label);
  return ability ? (MMSF3_VERSION_DEFAULT_ABILITY_NAMES[version] ?? []).includes(ability.name) : false;
}

export function isMmsf3AbilitySourceTracked(label: string, version: VersionId) {
  return !isMmsf3VersionDefaultAbility(label, version);
}

export function normalizeMmsf3AbilityEntries(entries: BuildCardEntry[], version: VersionId) {
  const normalizedEntries = entries.map((entry) => normalizeMmsf3AbilityEntry(entry));
  const requiredNames = new Set(MMSF3_VERSION_DEFAULT_ABILITY_NAMES[version] ?? []);
  const keptEntries = normalizedEntries.filter((entry) => {
    const abilityName = getMmsf3AbilityByLabel(entry.name)?.name ?? entry.name.trim();
    return !allVersionDefaultAbilityNames.has(abilityName) || requiredNames.has(abilityName);
  });
  const requiredEntries = Array.from(requiredNames).map((name) => {
    const existingEntry = keptEntries.find((entry) => getMmsf3AbilityByLabel(entry.name)?.name === name);

    if (existingEntry) {
      return existingEntry;
    }

    const defaultAbility = abilityByNormalizedName.get(normalizeToken(name))?.[0];
    return defaultAbility
      ? {
          id: createId(),
          name: defaultAbility.label,
          quantity: defaultAbility.cost,
          notes: "",
          isRegular: false,
        }
      : null;
  }).filter((entry): entry is BuildCardEntry => Boolean(entry));
  const nonDefaultEntries = keptEntries.filter((entry) => {
    const abilityName = getMmsf3AbilityByLabel(entry.name)?.name ?? entry.name.trim();
    return !requiredNames.has(abilityName);
  });

  return [...requiredEntries, ...nonDefaultEntries];
}

export function getMmsf3AbilitySources(label: string) {
  return getMmsf3AbilityByLabel(label)?.sources ?? [];
}

function getMmsf3AbilitySelectionLimit(option: Mmsf3AbilityOption) {
  return Math.max(1, Math.trunc(option.maxCount));
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

  const allowedDefaultNames = new Set(MMSF3_VERSION_DEFAULT_ABILITY_NAMES[version ?? "black-ace"] ?? []);

  return MMSF3_ABILITY_OPTIONS.filter((option) => {
    if ((selectedCounts.get(option.label) ?? 0) >= getMmsf3AbilitySelectionLimit(option)) {
      return false;
    }

    if (allVersionDefaultAbilityNames.has(option.name) && !allowedDefaultNames.has(option.name)) {
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
