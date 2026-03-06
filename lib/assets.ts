import manifest from "@/data/asset-manifest.json";
import aliases from "@/data/card-asset-aliases.json";
import type { AssetManifestEntry, CardAssetAliasEntry, GameId, VersionId } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

export const assetManifestEntries = manifest.entries as AssetManifestEntry[];
export const cardAssetAliases = aliases.entries as CardAssetAliasEntry[];

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

export function findCardAssetByName(game: GameId, name: string, version?: VersionId) {
  for (const normalized of buildLookupTokens(name)) {
    const direct = assetManifestEntries.find((entry) => {
      if (entry.game !== game) {
        return false;
      }

      const candidates = [entry.name, ...entry.aliases].map(normalizeToken);
      return candidates.includes(normalized);
    });

    if (direct) {
      return direct;
    }
  }

  for (const normalized of buildLookupTokens(name)) {
    const localized = cardAssetAliases.find((entry) => {
      if (entry.game !== game) {
        return false;
      }
      if (entry.version && version && entry.version !== version) {
        return false;
      }
      if (entry.version && !version) {
        return false;
      }

      return normalizeToken(entry.name) === normalized;
    });

    if (!localized) {
      continue;
    }

    return assetManifestEntries.find((entry) => entry.localPath === localized.assetLocalPath);
  }

  return undefined;
}
