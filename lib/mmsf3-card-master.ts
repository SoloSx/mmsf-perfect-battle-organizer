import masterData from "@/data/mmsf3-card-master.json";
import { normalizeToken } from "@/lib/utils";

type Mmsf3CardMasterEntry = {
  name: string;
  section: "standard" | "mega" | "giga";
  displayOrder: number;
  assetLocalPath: string;
  aliases?: string[];
};

const mmsf3CardMasterEntries = masterData.entries as Mmsf3CardMasterEntry[];
const mmsf3CardSectionLookup = new Map<string, Mmsf3CardMasterEntry["section"]>();
const mmsf3CardDisplayOrderLookup = new Map<string, number>();
const mmsf3CardAssetLookup = new Map<string, string>();

for (const entry of mmsf3CardMasterEntries) {
  mmsf3CardDisplayOrderLookup.set(entry.name, entry.displayOrder);
  mmsf3CardSectionLookup.set(normalizeToken(entry.name), entry.section);
  mmsf3CardAssetLookup.set(normalizeToken(entry.name), entry.assetLocalPath);

  for (const alias of entry.aliases ?? []) {
    mmsf3CardSectionLookup.set(normalizeToken(alias), entry.section);
    mmsf3CardAssetLookup.set(normalizeToken(alias), entry.assetLocalPath);
  }
}

export function getMmsf3CardSuggestions() {
  return mmsf3CardMasterEntries.map((entry) => entry.name);
}

export function getMmsf3CardDisplayOrder(name: string) {
  return mmsf3CardDisplayOrderLookup.get(name) ?? null;
}

export function getMmsf3CardSection(name: string) {
  return mmsf3CardSectionLookup.get(normalizeToken(name)) ?? null;
}

export function getMmsf3CardAssetLocalPath(name: string) {
  return mmsf3CardAssetLookup.get(normalizeToken(name)) ?? null;
}
