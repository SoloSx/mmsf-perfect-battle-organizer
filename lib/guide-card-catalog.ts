import catalog from "@/data/guide-card-catalog.json";
import { getMmsf3CardDisplayOrder, getMmsf3CardSection, getMmsf3CardSuggestions } from "@/lib/mmsf3-card-master";
import type { GameId, GuideCardCatalogEntry, VersionId } from "@/lib/types";
import { normalizeToken, uniqueStrings } from "@/lib/utils";

export const guideCardCatalogEntries = catalog.entries as GuideCardCatalogEntry[];
const sourceDescriptionLookup = new Map<string, string>();
const sectionLookup = new Map<string, GuideCardCatalogEntry["section"]>();
const sourceDescriptionsByGame = (catalog.sourceDescriptionsByGame ?? {}) as Partial<Record<GameId, Record<string, string>>>;

for (const entry of guideCardCatalogEntries) {
  const versionKey = entry.version ?? "*";
  sectionLookup.set(`${entry.game}:${versionKey}:${normalizeToken(entry.name)}`, entry.section);
}

for (const [game, descriptions] of Object.entries(sourceDescriptionsByGame) as Array<[GameId, Record<string, string>]>) {
  for (const [label, description] of Object.entries(descriptions)) {
    sourceDescriptionLookup.set(`${game}:${normalizeToken(label)}`, description);
  }
}

function buildLookupTokens(name: string) {
  const base = normalizeToken(name);
  const tokens = new Set([base]);

  if (/[123]$/.test(base)) {
    tokens.add(base.replace(/[123]$/, ""));
  }

  if (base.includes("レイザー")) {
    tokens.add(base.replace(/レイザー/g, "レーザー"));
  }

  if (base.includes("レーザー")) {
    tokens.add(base.replace(/レーザー/g, "レイザー"));
  }

  return [...tokens];
}

function matchesVersion(entry: GuideCardCatalogEntry, version?: VersionId) {
  if (!entry.version || !version) {
    return true;
  }

  return entry.version === version;
}

function compareCardSuggestionNames(game: GameId, left: string, right: string) {
  if (game === "mmsf3") {
    const leftDisplayOrder = getMmsf3CardDisplayOrder(left);
    const rightDisplayOrder = getMmsf3CardDisplayOrder(right);

    if (typeof leftDisplayOrder === "number" && typeof rightDisplayOrder === "number" && leftDisplayOrder !== rightDisplayOrder) {
      return leftDisplayOrder - rightDisplayOrder;
    }

    if (typeof leftDisplayOrder === "number") {
      return -1;
    }

    if (typeof rightDisplayOrder === "number") {
      return 1;
    }
  }

  return left.localeCompare(right, "ja");
}

export function sortCardSuggestions(game: GameId, suggestions: string[]) {
  return [...suggestions].sort((left, right) => compareCardSuggestionNames(game, left, right));
}

export function getCardSuggestions(game: GameId, version?: VersionId) {
  if (game === "mmsf3") {
    return getMmsf3CardSuggestions(version as Extract<VersionId, "black-ace" | "red-joker"> | undefined);
  }

  return sortCardSuggestions(
    game,
    uniqueStrings(
      guideCardCatalogEntries
        .filter((entry) => entry.game === game && matchesVersion(entry, version))
        .map((entry) => entry.name),
    ),
  );
}

export function getKnownCardSources(game: GameId, name: string, version?: VersionId) {
  const tokens = buildLookupTokens(name);

  const matched = guideCardCatalogEntries.filter(
    (entry) => entry.game === game && matchesVersion(entry, version) && tokens.includes(normalizeToken(entry.name)),
  );

  return uniqueStrings(matched.flatMap((entry) => entry.details));
}

export function getSourceSuggestions(game: GameId, version?: VersionId) {
  return uniqueStrings(
    guideCardCatalogEntries
      .filter((entry) => entry.game === game && matchesVersion(entry, version))
      .flatMap((entry) => entry.details),
  ).sort((a, b) => a.localeCompare(b, "ja"));
}

export function getSourceDescription(game: GameId, source: string) {
  return sourceDescriptionLookup.get(`${game}:${normalizeToken(source)}`) ?? null;
}

export function getCardSection(game: GameId, name: string, version?: VersionId) {
  if (game === "mmsf3") {
    return getMmsf3CardSection(name);
  }

  const token = normalizeToken(name);

  if (version) {
    const versionedSection = sectionLookup.get(`${game}:${version}:${token}`);
    if (versionedSection) {
      return versionedSection;
    }
  }

  return sectionLookup.get(`${game}:*:${token}`) ?? null;
}
