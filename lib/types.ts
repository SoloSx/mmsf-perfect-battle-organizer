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

export type BrotherKind = "story" | "auto" | "real" | "event";

export interface BuildCardEntry {
  id: string;
  name: string;
  quantity: number;
  notes: string;
}

export interface BuildSourceEntry {
  id: string;
  name: string;
  source: string;
  notes: string;
}

export interface BrotherProfile {
  id: string;
  name: string;
  kind: BrotherKind;
  favoriteCards: string[];
  notes: string;
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
  warRockWeapon: string;
  brotherBandMode: string;
  versionFeature: string;
  crossBrotherNotes: string;
  notes: string;
}

export interface Mmsf2Sections {
  tribeNotes: string;
  brotherType: string;
  kizunaTarget: number;
  bestCombo: string;
  legendCards: string[];
  blankCards: string[];
  waveCommandCards: string[];
  warRockWeapon: string;
  notes: string;
}

export interface Mmsf3Sections {
  noise: string;
  noiseRate: number;
  pgms: string[];
  noiseAbilities: string[];
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
    legendCards?: number;
    blankCards?: number;
    waveCommandCards?: number;
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
