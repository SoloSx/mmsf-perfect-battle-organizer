import manifest from "@/data/asset-manifest.json";
import mmsf1Aliases from "@/data/mmsf1/card-aliases.json";
import mmsf2Aliases from "@/data/mmsf2/card-aliases.json";
import mmsf3Aliases from "@/data/mmsf3/card-aliases.json";
import { getMmsf2BlankCardDefinition } from "@/lib/mmsf2/folder-cards";
import { getMmsf3CardAssetLocalPath } from "@/lib/mmsf3/card-master";
import type { AssetManifestEntry, CardAssetAliasEntry, GameId, VersionId } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

export const assetManifestEntries = manifest.entries as AssetManifestEntry[];
export const cardAssetAliases = [
  ...(mmsf1Aliases.entries as CardAssetAliasEntry[]),
  ...(mmsf2Aliases.entries as CardAssetAliasEntry[]),
  ...(mmsf3Aliases.entries as CardAssetAliasEntry[]),
];
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
const MMSF2_SPECIAL_CARD_ASSET_LOCAL_PATHS: Record<string, string> = {
  キンググランジャー: "/assets/cards/SF2/Cards/SP_G01TribeKing.gif",
  ラムー: "/assets/cards/SF2/Cards/SP_G02RaMu.gif",
};
const MMSF1_BOKTAI_CARD_ASSET_LOCAL_PATHS: Record<string, string> = {
  タイヨウジュウ: "/assets/cards/SF1/Cards/e01_TaiyouJuu.png",
  タイヨウジュウv2: "/assets/cards/SF1/Cards/e02_TaiyouJuuV2.png",
  タイヨウジュウv3: "/assets/cards/SF1/Cards/e03_TaiyouJuuV3_actual.png",
  アンコクケン: "/assets/cards/SF1/Cards/e04_AnkokuKen.png",
  アンコクケンv2: "/assets/cards/SF1/Cards/e05_AnkokuKenV2.png",
  アンコクケンv3: "/assets/cards/SF1/Cards/e06_AnkokuKenV3_actual.png",
  アーシュラ: "/assets/cards/SF1/Cards/e07_Ursula.png",
  アーシュラv2: "/assets/cards/SF1/Cards/e08_UrsulaV2.png",
  アーシュラv3: "/assets/cards/SF1/Cards/e09_UrsulaV3_actual.png",
  トーベ: "/assets/cards/SF1/Cards/e10_Tove.png",
  トーベv2: "/assets/cards/SF1/Cards/e11_ToveV2.png",
  トーベv3: "/assets/cards/SF1/Cards/e12_ToveV3_actual.png",
  オトフリート: "/assets/cards/SF1/Cards/e13_Otfried.png",
  オトフリートv2: "/assets/cards/SF1/Cards/e14_OtfriedV2.png",
  オトフリートv3: "/assets/cards/SF1/Cards/e15_OtfriedV3_actual.png",
  リザ: "/assets/cards/SF1/Cards/e16_Liza.png",
  リザv2: "/assets/cards/SF1/Cards/e17_LizaV2.png",
  リザv3: "/assets/cards/SF1/Cards/e18_LizaV3_actual.png",
  アンドロメダ: "/assets/cards/SF1/Cards/Andromeda.png",
};

function buildLookupTokens(name: string) {
  const rawTokens = new Set<string>([name.trim()]);
  const starlessName = name.replace(/★[123]$/u, "").trim();
  const blankIdLessName = name.replace(/^[SMG]-\d+\s+/i, "").trim();

  if (starlessName) {
    rawTokens.add(starlessName);
  }

  if (blankIdLessName) {
    rawTokens.add(blankIdLessName);
  }

  const tokens = new Set<string>();

  for (const rawToken of rawTokens) {
    const base = normalizeToken(rawToken);
    if (!base) {
      continue;
    }

    tokens.add(base);

    if (/[123]$/.test(base)) {
      tokens.add(base.replace(/[123]$/, ""));
    }

    if (base.includes("レイザー")) {
      tokens.add(base.replace(/レイザー/g, "レーザー"));
    }

    if (base.includes("レーザー")) {
      tokens.add(base.replace(/レーザー/g, "レイザー"));
    }
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

    const localizedAsset = assetManifestEntries.find((entry) => entry.localPath === localized.assetLocalPath);
    if (localizedAsset) {
      return localizedAsset;
    }
  }

  if (game === "mmsf1") {
    const boktaiAssetPath = MMSF1_BOKTAI_CARD_ASSET_LOCAL_PATHS[normalizeToken(name)];
    if (boktaiAssetPath) {
      return assetManifestEntries.find((entry) => entry.localPath === boktaiAssetPath);
    }

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

      const crossVersionAsset = assetManifestEntries.find((entry) => entry.localPath === crossVersionAlias.assetLocalPath);
      if (crossVersionAsset) {
        return crossVersionAsset;
      }
    }
  }

  if (game === "mmsf2") {
    const explicitSpecialAssetPath = MMSF2_SPECIAL_CARD_ASSET_LOCAL_PATHS[normalizeToken(name)];
    if (explicitSpecialAssetPath) {
      return assetManifestEntries.find((entry) => entry.localPath === explicitSpecialAssetPath);
    }

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
