import catalog from "@/data/wily-card-catalog.json";
import type { GameId, VersionId, WilyCardCatalogEntry } from "@/lib/types";
import { normalizeToken, uniqueStrings } from "@/lib/utils";

export const wilyCardCatalogEntries = catalog.entries as WilyCardCatalogEntry[];

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

function matchesVersion(entry: WilyCardCatalogEntry, version?: VersionId) {
  if (!entry.version || !version) {
    return true;
  }

  return entry.version === version;
}

export function getCardSuggestions(game: GameId, version?: VersionId) {
  return uniqueStrings(
    wilyCardCatalogEntries
      .filter((entry) => entry.game === game && matchesVersion(entry, version))
      .map((entry) => entry.name),
  ).sort((a, b) => a.localeCompare(b, "ja"));
}

export function getKnownCardSources(game: GameId, name: string, version?: VersionId) {
  const tokens = buildLookupTokens(name);

  const matched = wilyCardCatalogEntries.filter(
    (entry) => entry.game === game && matchesVersion(entry, version) && tokens.includes(normalizeToken(entry.name)),
  );

  return uniqueStrings(matched.flatMap((entry) => entry.details));
}

export function getSourceSuggestions(game: GameId, version?: VersionId) {
  return uniqueStrings(
    wilyCardCatalogEntries
      .filter((entry) => entry.game === game && matchesVersion(entry, version))
      .flatMap((entry) => entry.details),
  ).sort((a, b) => a.localeCompare(b, "ja"));
}
