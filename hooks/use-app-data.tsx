"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_STRATEGY_TEMPLATES } from "@/lib/seed-data";
import { normalizeBrotherFavoriteCardSlots } from "@/lib/brother-profiles";
import { normalizeMmsf2AbilityEntries } from "@/lib/mmsf2/abilities";
import {
  createDefaultMmsf3Sections,
  normalizeMmsf3BuildRecord,
} from "@/lib/mmsf3/build-state";
import { getDefaultVersionForGame } from "@/lib/rules";
import type {
  BrotherProfile,
  BuildCardEntry,
  BuildRecord,
  CommonSections,
  GameId,
  GameSpecificSections,
  PersistedAppState,
  StrategyTemplate,
} from "@/lib/types";
import { createId } from "@/lib/utils";

const APP_DATA_STORAGE_KEY = "mmsf-perfect-battle-organizer/v3";

interface AppDataContextValue {
  builds: BuildRecord[];
  templates: StrategyTemplate[];
  loaded: boolean;
  createEmptyBuild: (game?: GameId) => BuildRecord;
  upsertBuild: (build: BuildRecord) => BuildRecord;
  importBuilds: (builds: BuildRecord[]) => number;
  deleteBuild: (id: string) => void;
  duplicateBuild: (id: string) => BuildRecord | null;
  getBuildById: (id: string) => BuildRecord | undefined;
  upsertTemplate: (template: StrategyTemplate) => StrategyTemplate;
  importTemplates: (templates: StrategyTemplate[]) => number;
  deleteTemplate: (id: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}

function createEmptyBuildCardEntry(): BuildCardEntry {
  return { id: createId(), name: "", quantity: 1, notes: "", isRegular: false, favoriteCount: 0 };
}

function createDefaultCommonSections(): CommonSections {
  return {
    overview: "",
    tags: [],
    cards: [createEmptyBuildCardEntry()],
    cardSources: [],
    abilities: [createEmptyBuildCardEntry()],
    abilitySources: [],
    brothers: [],
    strategyName: "",
    strategyNote: "",
  };
}

function normalizeBuildCardEntry(entry: BuildCardEntry): BuildCardEntry {
  const quantity = Number.isFinite(entry.quantity) ? Math.max(1, Math.trunc(entry.quantity)) : 1;
  const rawFavoriteCount = entry.favoriteCount;
  const favoriteCount = typeof rawFavoriteCount === "number" && Number.isFinite(rawFavoriteCount)
    ? Math.max(0, Math.min(quantity, Math.trunc(rawFavoriteCount)))
    : entry.isRegular
      ? 1
      : 0;

  return {
    id: entry.id,
    name: entry.name ?? "",
    quantity,
    notes: entry.notes ?? "",
    isRegular: Boolean(entry.isRegular),
    favoriteCount,
  };
}

function normalizeBuildSourceEntry(entry: CommonSections["cardSources"][number]): CommonSections["cardSources"][number] {
  return {
    id: entry.id,
    name: entry.name ?? "",
    source: entry.source ?? "",
    notes: entry.notes ?? "",
    isOwned: false,
  };
}

function stripTransientBuildFlags(build: BuildRecord): BuildRecord {
  return {
    ...build,
    commonSections: {
      ...build.commonSections,
      cardSources: build.commonSections.cardSources.map((entry) => ({ ...entry, isOwned: false })),
      abilitySources: build.commonSections.abilitySources.map((entry) => ({ ...entry, isOwned: false })),
    },
    gameSpecificSections: {
      ...build.gameSpecificSections,
      mmsf3: {
        ...build.gameSpecificSections.mmsf3,
        warRockWeaponSources: build.gameSpecificSections.mmsf3.warRockWeaponSources.map((entry) => ({
          ...entry,
          isOwned: false,
        })),
      },
    },
  };
}

function normalizeBrotherProfile(entry: BrotherProfile): BrotherProfile {
  return {
    id: entry.id,
    name: entry.name ?? "",
    kind: entry.kind ?? "story",
    favoriteCards: normalizeBrotherFavoriteCardSlots(entry.favoriteCards),
    rezonCard: entry.rezonCard ?? "",
    notes: entry.notes ?? "",
  };
}

function createEmptyStarCards(): BuildCardEntry[] {
  return Array.from({ length: 3 }, () => createEmptyBuildCardEntry());
}

function createEmptyBlankCards(): BuildCardEntry[] {
  return [createEmptyBuildCardEntry()];
}

function normalizeMmsf2StarCards(starCardEntries: BuildCardEntry[] | undefined): BuildCardEntry[] {
  if (!Array.isArray(starCardEntries) || starCardEntries.length === 0) {
    return createEmptyStarCards();
  }

  const normalizedStarCardEntries = starCardEntries.map((starCardEntry) => normalizeBuildCardEntry(starCardEntry));

  while (normalizedStarCardEntries.length < 3) {
    normalizedStarCardEntries.push(createEmptyBuildCardEntry());
  }

  return normalizedStarCardEntries.slice(0, 3);
}

function normalizeMmsf2BlankCards(blankCardEntries: BuildCardEntry[] | undefined): BuildCardEntry[] {
  if (!Array.isArray(blankCardEntries) || blankCardEntries.length === 0) {
    return createEmptyBlankCards();
  }

  return blankCardEntries.map((blankCardEntry) => normalizeBuildCardEntry(blankCardEntry));
}

function createDefaultGameSpecificSections(): GameSpecificSections {
  return {
    mmsf1: {
      enhancement: "",
      warRockWeapon: "",
      warRockWeaponSources: [],
      brotherBandMode: "",
      versionFeature: "",
      crossBrotherNotes: "",
      notes: "",
    },
    mmsf2: {
      starCards: createEmptyStarCards(),
      blankCards: createEmptyBlankCards(),
      defaultTribeAbilityEnabled: true,
      enhancement: "",
      warRockWeapon: "",
      warRockWeaponSources: [],
      kokouNoKakera: false,
      notes: "",
    },
    mmsf3: {
      ...createDefaultMmsf3Sections(),
    },
  };
}

function createBuild(game: GameId = "mmsf1"): BuildRecord {
  const timestamp = nowIso();
  const version = getDefaultVersionForGame(game);
  const commonSections = createDefaultCommonSections();

  const build = {
    id: createId(),
    title: "",
    game,
    version,
    commonSections,
    gameSpecificSections: createDefaultGameSpecificSections(),
    strategyTemplateId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (game === "mmsf3") {
    return normalizeMmsf3BuildRecord(build);
  }

  return build;
}

function normalizeTemplate(template: StrategyTemplate): StrategyTemplate {
  const timestamp = template.updatedAt || nowIso();
  return {
    ...template,
    tags: template.tags ?? [],
    notes: template.notes ?? "",
    defaultValues: template.defaultValues ?? {},
    createdAt: template.createdAt || timestamp,
    updatedAt: timestamp,
  };
}

export function normalizeBuild(build: BuildRecord): BuildRecord {
  const defaultBuild = createBuild(build.game);
  const defaultGameSpecificSections = createDefaultGameSpecificSections();
  const rawCommonSections = build.commonSections ?? defaultBuild.commonSections;
  const rawMmsf1Sections = build.gameSpecificSections?.mmsf1 ?? defaultGameSpecificSections.mmsf1;
  const rawMmsf2Sections = build.gameSpecificSections?.mmsf2 ?? defaultGameSpecificSections.mmsf2;
  const rawMmsf3Sections = build.gameSpecificSections?.mmsf3 ?? defaultGameSpecificSections.mmsf3;
  const rawAbilityEntries = (rawCommonSections.abilities ?? []).map((abilityEntry) =>
    normalizeBuildCardEntry(abilityEntry as BuildCardEntry),
  );
  const normalizedAbilityEntries = rawAbilityEntries.length > 0
    ? build.game === "mmsf2"
      ? normalizeMmsf2AbilityEntries(
          rawAbilityEntries,
          build.version,
          Boolean(rawMmsf2Sections.defaultTribeAbilityEnabled ?? true),
        )
      : rawAbilityEntries
    : [createEmptyBuildCardEntry()];

  const normalizedBuild = {
    ...defaultBuild,
    ...build,
    commonSections: {
      ...createDefaultCommonSections(),
      ...rawCommonSections,
      overview: rawCommonSections.overview ?? defaultBuild.commonSections.overview,
      strategyNote: rawCommonSections.strategyNote ?? defaultBuild.commonSections.strategyNote,
      cards: (rawCommonSections.cards ?? []).length > 0
        ? (rawCommonSections.cards ?? []).map((folderEntry) => normalizeBuildCardEntry(folderEntry as BuildCardEntry))
        : [createEmptyBuildCardEntry()],
      cardSources: (rawCommonSections.cardSources ?? []).map((sourceEntry) =>
        normalizeBuildSourceEntry(sourceEntry as CommonSections["cardSources"][number]),
      ),
      abilities: normalizedAbilityEntries,
      abilitySources: (rawCommonSections.abilitySources ?? []).map((sourceEntry) =>
        normalizeBuildSourceEntry(sourceEntry as CommonSections["abilitySources"][number]),
      ),
      brothers: (rawCommonSections.brothers ?? []).map((brotherProfile) =>
        normalizeBrotherProfile(brotherProfile as BrotherProfile),
      ),
    },
    gameSpecificSections: {
      ...defaultGameSpecificSections,
      ...build.gameSpecificSections,
      mmsf2: {
        ...defaultGameSpecificSections.mmsf2,
        ...rawMmsf2Sections,
        starCards: normalizeMmsf2StarCards(rawMmsf2Sections.starCards),
        blankCards: normalizeMmsf2BlankCards(rawMmsf2Sections.blankCards),
      },
      mmsf1: {
        ...defaultGameSpecificSections.mmsf1,
        ...rawMmsf1Sections,
        enhancement:
          typeof rawMmsf1Sections.enhancement === "string"
            ? rawMmsf1Sections.enhancement
            : defaultGameSpecificSections.mmsf1.enhancement,
      },
      mmsf3: {
        ...defaultGameSpecificSections.mmsf3,
        ...rawMmsf3Sections,
      },
    },
    createdAt: build.createdAt || nowIso(),
    updatedAt: build.updatedAt || nowIso(),
  };

  return normalizeMmsf3BuildRecord(normalizedBuild);
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [builds, setBuilds] = useState<BuildRecord[]>([]);
  const [templates, setTemplates] = useState<StrategyTemplate[]>(DEFAULT_STRATEGY_TEMPLATES);

  useEffect(() => {
    try {
      const rawPersistedState = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
      if (!rawPersistedState) {
        setLoaded(true);
        return;
      }

      const persistedState = JSON.parse(rawPersistedState) as PersistedAppState;
      setBuilds((persistedState.builds ?? []).map(normalizeBuild).sort((leftBuild, rightBuild) => rightBuild.updatedAt.localeCompare(leftBuild.updatedAt)));
      setTemplates((persistedState.templates ?? DEFAULT_STRATEGY_TEMPLATES).map(normalizeTemplate));
    } catch {
      setBuilds([]);
      setTemplates(DEFAULT_STRATEGY_TEMPLATES);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    const payload: PersistedAppState = { builds: builds.map(stripTransientBuildFlags), templates };
    window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(payload));
  }, [builds, templates, loaded]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      builds,
      templates,
      loaded,
      createEmptyBuild: createBuild,
      upsertBuild: (build) => {
        const next = normalizeBuild({
          ...build,
          updatedAt: nowIso(),
        });

        setBuilds((currentBuilds) => {
          const exists = currentBuilds.some((item) => item.id === next.id);
          const nextItems = exists
            ? currentBuilds.map((item) => (item.id === next.id ? next : item))
            : [next, ...currentBuilds];

          return nextItems.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });

        return next;
      },
      importBuilds: (incomingBuilds) => {
        const normalizedIncoming = incomingBuilds.map((build) =>
          normalizeBuild({
            ...build,
            id: build.id || createId(),
            createdAt: build.createdAt || nowIso(),
            updatedAt: build.updatedAt || nowIso(),
          }),
        );

        setBuilds((currentBuilds) => {
          const merged = new Map(currentBuilds.map((item) => [item.id, item] as const));
          normalizedIncoming.forEach((build) => {
            merged.set(build.id, build);
          });
          return Array.from(merged.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });

        return normalizedIncoming.length;
      },
      deleteBuild: (id) => {
        setBuilds((currentBuilds) => currentBuilds.filter((item) => item.id !== id));
      },
      duplicateBuild: (id) => {
        const target = builds.find((item) => item.id === id);
        if (!target) {
          return null;
        }

        const duplicate = normalizeBuild({
          ...target,
          id: createId(),
          title: target.title ? `${target.title} (複製)` : "新しい複製構築",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });

        setBuilds((currentBuilds) => [duplicate, ...currentBuilds].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
        return duplicate;
      },
      getBuildById: (id) => builds.find((item) => item.id === id),
      upsertTemplate: (template) => {
        const next = normalizeTemplate({
          ...template,
          id: template.id || createId(),
          createdAt: template.createdAt || nowIso(),
          updatedAt: nowIso(),
        });

        setTemplates((currentTemplates) => {
          const exists = currentTemplates.some((item) => item.id === next.id);
          return exists ? currentTemplates.map((item) => (item.id === next.id ? next : item)) : [next, ...currentTemplates];
        });

        return next;
      },
      importTemplates: (incomingTemplates) => {
        const normalizedIncoming = incomingTemplates.map((template) =>
          normalizeTemplate({
            ...template,
            id: template.id || createId(),
            createdAt: template.createdAt || nowIso(),
            updatedAt: template.updatedAt || nowIso(),
          }),
        );

        setTemplates((currentTemplates) => {
          const merged = new Map(currentTemplates.map((item) => [item.id, item] as const));
          normalizedIncoming.forEach((template) => {
            merged.set(template.id, template);
          });
          return Array.from(merged.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });

        return normalizedIncoming.length;
      },
      deleteTemplate: (id) => {
        setTemplates((currentTemplates) => currentTemplates.filter((item) => item.id !== id));
        setBuilds((currentBuilds) =>
          currentBuilds.map((item) =>
            item.strategyTemplateId === id ? { ...item, strategyTemplateId: null, updatedAt: nowIso() } : item,
          ),
        );
      },
    }),
    [builds, loaded, templates],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }

  return context;
}
