import manifest from "@/data/asset-manifest.json";
import aliases from "@/data/card-asset-aliases.json";
import { getMmsf2BlankCardDefinition } from "@/lib/mmsf2/folder-cards";
import { getMmsf3CardAssetLocalPath } from "@/lib/mmsf3/card-master";
import type { AssetManifestEntry, CardAssetAliasEntry, GameId, VersionId } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

export const assetManifestEntries = manifest.entries as AssetManifestEntry[];
export const cardAssetAliases = aliases.entries as CardAssetAliasEntry[];
const MMSF2_BLANK_CARD_ASSET_LOCAL_PATHS: Record<string, string> = {
  "ブライソード": "/assets/cards/SF2/Cards/SP_M01BuraiSword.gif",
  "ブライソードEX": "/assets/cards/SF2/Cards/SP_M02BuraiSwordEX.gif",
  "ブライソードSP": "/assets/cards/SF2/Cards/SP_M03BuraiSwordSP.gif",
  "キグナスウイング": "/assets/cards/SF2/Cards/SP_M04CygnusWing.gif",
  "キグナスウイングEX": "/assets/cards/SF2/Cards/SP_M05CygnusWingEX.gif",
  "キグナスウイングSP": "/assets/cards/SF2/Cards/SP_M06CygnusWingSP.gif",
  "リブラバランス": "/assets/cards/SF2/Cards/SP_M07LibraBalance.gif",
  "リブラバランスEX": "/assets/cards/SF2/Cards/SP_M08LibraBalanceEX.gif",
  "リブラバランスSP": "/assets/cards/SF2/Cards/SP_M09LibraBalanceSP.gif",
  "ウルフフォレスト": "/assets/cards/SF2/Cards/SP_M10WolfForest.gif",
  "ウルフフォレストEX": "/assets/cards/SF2/Cards/SP_M11WolfForest.gif",
  "ウルフフォレストSP": "/assets/cards/SF2/Cards/SP_M12WolfForestSP.gif",
  "クラウンサンダー": "/assets/cards/SF2/Cards/SP_M13CrownThunder.gif",
  "クラウンサンダーEX": "/assets/cards/SF2/Cards/SP_M14CrownThunderEX.gif",
  "クラウンサンダーSP": "/assets/cards/SF2/Cards/SP_M15CrownThunderSP.gif",
  "ペガサスマジック": "/assets/cards/SF2/Cards/SP_M16PegasusMagic.gif",
  "ペガサスマジックEX": "/assets/cards/SF2/Cards/SP_M17PegasusMagicEX.gif",
  "ペガサスマジックSP": "/assets/cards/SF2/Cards/SP_M18PegasusMagicSP.gif",
  "レオキングダム": "/assets/cards/SF2/Cards/SP_M19LeoKingdom.gif",
  "レオキングダムEX": "/assets/cards/SF2/Cards/SP_M20LeoKingdomEX.gif",
  "レオキングダムSP": "/assets/cards/SF2/Cards/SP_M21LeoKingdomSP.gif",
  "ドラゴンスカイ": "/assets/cards/SF2/Cards/SP_M22DragonSky.gif",
  "ドラゴンスカイEX": "/assets/cards/SF2/Cards/SP_M23DragonSkyEX.gif",
  "ドラゴンスカイSP": "/assets/cards/SF2/Cards/SP_M24DragonSkySP.gif",
  "ペガサスマジックGX": "/assets/cards/SF2/Cards/SP_G03PegasusMagicGX.gif",
  "レオキングダムGX": "/assets/cards/SF2/Cards/SP_G04LeoKingdomGX.gif",
  "ドラゴンスカイGX": "/assets/cards/SF2/Cards/SP_G05DragonSkyGX.gif",
  "サウザンドキック": "/assets/cards/SF2/Cards/Gb3ThousandKick.gif",
  "ポイズンファラオ": "/assets/cards/SF2/Cards/Gb4PoisonPharaoh.gif",
  "ナダレダイコ": "/assets/cards/SF2/Cards/Gb5NadareDeiko.gif",
  "ゴルゴンアイ": "/assets/cards/SF2/Cards/Gs1GorgonEye.gif",
  "ゲキリュウウェーブ": "/assets/cards/SF2/Cards/Gs2GekiryuuWave.gif",
  "バスターマックス": "/assets/cards/SF2/Cards/Gs3BusterMAX.gif",
  "ダークネスホール": "/assets/cards/SF2/Cards/Gs4DarknessHole.gif",
  "フライングインパクト": "/assets/cards/SF2/Cards/Gs5FlyingImpact.gif",
  "オックスタックル": "/assets/cards/SF2/Cards/Gd1OxTackle.gif",
  "エンプティーマジック": "/assets/cards/SF2/Cards/Gd2EmptyMagic.gif",
  "ノーマル+50": "/assets/cards/SF2/Cards/Gd3Normal+50.gif",
  "ブレイクカウントボム": "/assets/cards/SF2/Cards/Gd4BreakCountBomb.gif",
  "ファントムスラッシュ": "/assets/cards/SF2/Cards/Gd5PhantomSlash.gif",
};

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
  if (game === "mmsf3") {
    const mmsf3AssetLocalPath = getMmsf3CardAssetLocalPath(name);
    if (mmsf3AssetLocalPath) {
      return assetManifestEntries.find((entry) => entry.localPath === mmsf3AssetLocalPath);
    }
  }

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

  if (game === "mmsf1") {
    for (const normalized of buildLookupTokens(name)) {
      const crossVersionAlias = cardAssetAliases.find((entry) => {
        if (entry.game !== "mmsf1") {
          return false;
        }

        return normalizeToken(entry.name) === normalized;
      });

      if (!crossVersionAlias) {
        continue;
      }

      return assetManifestEntries.find((entry) => entry.localPath === crossVersionAlias.assetLocalPath);
    }
  }

  if (game === "mmsf2") {
    const blankDefinition = getMmsf2BlankCardDefinition(name);
    if (blankDefinition) {
      const explicitBlankAssetPath = MMSF2_BLANK_CARD_ASSET_LOCAL_PATHS[blankDefinition.contentKey];
      if (explicitBlankAssetPath) {
        return assetManifestEntries.find((entry) => entry.localPath === explicitBlankAssetPath);
      }

      const blankAssetPrefix = `SP_${blankDefinition.code[0]}${String(blankDefinition.number).padStart(2, "0")}`;

      return assetManifestEntries.find(
        (entry) => entry.game === "mmsf2" && entry.name.startsWith(blankAssetPrefix),
      );
    }
  }

  return undefined;
}
