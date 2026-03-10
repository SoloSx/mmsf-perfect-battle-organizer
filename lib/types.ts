export type GameId = "mmsf1" | "mmsf2" | "mmsf3";

export type VersionId =
  | "pegasus"
  | "leo"
  | "dragon"
  | "berserker"
  | "shinobi"
  | "dinosaur"
  | "black-ace"
  | "red-joker";

export type BrotherKind = "story" | "auto" | "real" | "event" | "boktai";
export type NoiseCardMark = "♥" | "♦" | "♠" | "♣" | "★";
export type NoiseCardRank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
export type Mmsf3BrotherRoulettePosition = "top_left" | "top_right" | "mid_left" | "mid_right" | "btm_left" | "btm_right";
export type Mmsf3BrotherRouletteSlotType = "brother" | "sss";
export type Mmsf3BrotherVersionId = Extract<VersionId, "black-ace" | "red-joker">;
export type NoiseHandId =
  | "two-pair"
  | "three-card"
  | "straight"
  | "flush"
  | "full-house"
  | "four-card"
  | "straight-flush"
  | "royal-straight-flush"
  | "five-card";

export interface BuildCardEntry {
  id: string;
  name: string;
  quantity: number;
  notes: string;
  isRegular: boolean;
}

export interface BuildSourceEntry {
  id: string;
  name: string;
  source: string;
  notes: string;
  isOwned: boolean;
}

export interface BrotherProfile {
  id: string;
  name: string;
  kind: BrotherKind;
  favoriteCards: string[];
  rezonCard: string;
  notes: string;
}

export interface Mmsf3BrotherRouletteSlot {
  position: Mmsf3BrotherRoulettePosition;
  slotType: Mmsf3BrotherRouletteSlotType;
  sssLevel: string;
  version: Mmsf3BrotherVersionId | "";
  noise: string;
  rezon: string;
  whiteCardSetId: string;
  gigaCard: string;
  megaCard: string;
}

export interface Mmsf3NoiseCard {
  id: string;
  label: string;
  mark: NoiseCardMark;
  rank: NoiseCardRank | null;
  cardName: string;
  cardEffect: string;
  isJoker: boolean;
}

export interface NoiseHandResult {
  id: NoiseHandId;
  no: number;
  label: string;
  bonusEffect: string;
  flushSuit: Exclude<NoiseCardMark, "★"> | null;
}

export interface NoiseHandEvaluation {
  selectedCards: Mmsf3NoiseCard[];
  bestHand: NoiseHandResult | null;
  bonusEffect: string | null;
  flushSuit: Exclude<NoiseCardMark, "★"> | null;
  jokerSubstitutionNote: string | null;
  errors: string[];
}

export interface CommonSections {
  overview: string;
  tags: string[];
  cards: BuildCardEntry[];
  cardSources: BuildSourceEntry[];
  abilities: BuildCardEntry[];
  abilitySources: BuildSourceEntry[];
  brothers: BrotherProfile[];
  strategyName: string;
  strategyNote: string;
}

export interface Mmsf1Sections {
  enhancement: string;
  warRockWeapon: string;
  warRockWeaponSources: BuildSourceEntry[];
  brotherBandMode: string;
  versionFeature: string;
  crossBrotherNotes: string;
  notes: string;
}

export interface Mmsf2Sections {
  starCards: BuildCardEntry[];
  blankCards: BuildCardEntry[];
  defaultTribeAbilityEnabled: boolean;
  enhancement: string;
  warRockWeapon: string;
  warRockWeaponSources: BuildSourceEntry[];
  kokouNoKakera: boolean;
  notes: string;
}

export interface Mmsf3Sections {
  noise: string;
  warRockWeapon: string;
  warRockWeaponSources: BuildSourceEntry[];
  pgms: string[];
  noiseAbilities: string[];
  noiseCardIds: string[];
  brotherRouletteSlots: Mmsf3BrotherRouletteSlot[];
  sssLevels: string[];
  nfb: string;
  mergeNoiseTarget: string;
  whiteCardSetId: string;
  megaCards: string[];
  gigaCards: string[];
  teamSize: number;
  rezonCards: string[];
  rivalNoise: string;
  rouletteNotes: string;
  notes: string;
}

export interface GameSpecificSections {
  mmsf1: Mmsf1Sections;
  mmsf2: Mmsf2Sections;
  mmsf3: Mmsf3Sections;
}

export interface BuildRecord {
  id: string;
  title: string;
  game: GameId;
  version: VersionId;
  commonSections: CommonSections;
  gameSpecificSections: GameSpecificSections;
  strategyTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyTemplateDefaults {
  strategyName?: string;
  strategyNote?: string;
  overview?: string;
  tags?: string[];
}

export interface StrategyTemplate {
  id: string;
  name: string;
  tags: string[];
  notes: string;
  defaultValues: StrategyTemplateDefaults;
  createdAt: string;
  updatedAt: string;
}

export interface VersionRuleSet {
  game: GameId;
  version: VersionId;
  label: string;
  description: string;
  folderLimit: number;
  notes: string[];
  limits: {
    brothers?: number;
    megaCards?: number;
    gigaCards?: number;
    starCards?: number;
  };
  accent: {
    from: string;
    to: string;
  };
}

export interface AssetManifestEntry {
  game: GameId;
  name: string;
  localPath: string;
  remotePath: string | null;
  aliases: string[];
  attribution: string;
}

export interface CardAssetAliasEntry {
  game: GameId;
  version: VersionId | null;
  name: string;
  assetLocalPath: string;
}

export interface GuideCardCatalogEntry {
  game: GameId;
  section: string;
  number: number;
  version: VersionId | null;
  name: string;
  details: string[];
  assetLocalPath: string | null;
}

export interface MasterDataIndex {
  cardsByGame: Record<GameId, string[]>;
  abilitiesByGame: Record<GameId, string[]>;
  warRockWeaponsByGame: Record<"mmsf1" | "mmsf2", string[]>;
  brothersByGame: Record<GameId, string[]>;
  sourceTagsByGame: Record<GameId, string[]>;
  tribes: string[];
  noises: string[];
  pgms: string[];
  rezonCards: string[];
  nfbs: string[];
  versionHighlights: Record<VersionId, string[]>;
}

export interface ExportSceneProps {
  build: BuildRecord;
  versionRuleSet: VersionRuleSet;
  mainCardTiles: Array<{ title: string; imageSrc?: string }>;
  abilities: string[];
  brothers: string[];
  specialNotes: string[];
}

export interface PersistedAppState {
  builds: BuildRecord[];
  templates: StrategyTemplate[];
}
