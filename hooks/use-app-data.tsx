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
import {
  createDefaultMmsf3Sections,
  normalizeMmsf3BuildRecord,
  normalizeMmsf3Sections,
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

const STORAGE_KEY = "mmsf-perfect-battle-organizer/v2";
const LEGACY_STORAGE_KEYS = ["mmsf-perfect-battle-organizer/v1"];

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

function createDefaultCommonSections(): CommonSections {
  return {
    overview: "",
    tags: [],
    cards: [{ id: createId(), name: "", quantity: 1, notes: "", isRegular: false }],
    cardSources: [],
    abilities: [{ id: createId(), name: "", quantity: 1, notes: "", isRegular: false }],
    abilitySources: [],
    brothers: [],
    strategyName: "",
    strategyNote: "",
  };
}

function normalizeBuildCardEntry(entry: BuildCardEntry): BuildCardEntry {
  return {
    id: entry.id,
    name: entry.name ?? "",
    quantity: Number.isFinite(entry.quantity) ? Math.max(1, Math.trunc(entry.quantity)) : 1,
    notes: entry.notes ?? "",
    isRegular: Boolean(entry.isRegular),
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
    favoriteCards: (entry.favoriteCards ?? []).map((item) => item.trim()).filter(Boolean),
    rezonCard: entry.rezonCard ?? "",
    notes: entry.notes ?? "",
  };
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
      starCards: [],
      enhancement: "",
      warRockWeapon: "",
      warRockWeaponSources: [],
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

function normalizeBuild(build: BuildRecord): BuildRecord {
  const legacyMmsf3Sections = (build.gameSpecificSections?.mmsf3 ?? {}) as Partial<BuildRecord["gameSpecificSections"]["mmsf3"]> & {
    whiteCards?: string[];
    noiseRate?: number;
  };
  const normalizedOverview = build.commonSections?.overview || build.commonSections?.strategyNote || "";
  const normalizedStrategyNote = build.commonSections?.strategyNote || build.commonSections?.overview || "";
  const rawAbilities = (build.commonSections?.abilities ?? []).map((entry) => normalizeBuildCardEntry(entry as BuildCardEntry));
  const normalizedAbilities = rawAbilities.length > 0
    ? rawAbilities
    : [{ id: createId(), name: "", quantity: 1, notes: "", isRegular: false }];

  const normalizedBuild = {
    ...createBuild(build.game),
    ...build,
    commonSections: {
      ...createDefaultCommonSections(),
      ...build.commonSections,
      overview: normalizedOverview,
      strategyNote: normalizedStrategyNote,
      cards: (build.commonSections?.cards ?? []).length > 0
        ? (build.commonSections?.cards ?? []).map((entry) => normalizeBuildCardEntry(entry as BuildCardEntry))
        : [{ id: createId(), name: "", quantity: 1, notes: "", isRegular: false }],
      cardSources: (build.commonSections?.cardSources ?? []).map((entry) => normalizeBuildSourceEntry(entry as CommonSections["cardSources"][number])),
      abilities: normalizedAbilities,
      abilitySources: (build.commonSections?.abilitySources ?? []).map((entry) =>
        normalizeBuildSourceEntry(entry as CommonSections["abilitySources"][number]),
      ),
      brothers: (build.commonSections?.brothers ?? []).map((entry) => normalizeBrotherProfile(entry as BrotherProfile)),
    },
    gameSpecificSections: {
      ...createDefaultGameSpecificSections(),
      ...build.gameSpecificSections,
      mmsf2: {
        ...createDefaultGameSpecificSections().mmsf2,
        ...(build.gameSpecificSections?.mmsf2 ?? {}),
      },
      mmsf3: {
        ...createDefaultGameSpecificSections().mmsf3,
        ...normalizeMmsf3Sections(legacyMmsf3Sections, createDefaultGameSpecificSections().mmsf3),
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
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
      if (!raw) {
        setLoaded(true);
        return;
      }

      const parsed = JSON.parse(raw) as PersistedAppState;
      setBuilds((parsed.builds ?? []).map(normalizeBuild).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setTemplates((parsed.templates ?? DEFAULT_STRATEGY_TEMPLATES).map(normalizeTemplate));
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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

        setBuilds((current) => {
          const exists = current.some((item) => item.id === next.id);
          const nextItems = exists
            ? current.map((item) => (item.id === next.id ? next : item))
            : [next, ...current];

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

        setBuilds((current) => {
          const merged = new Map(current.map((item) => [item.id, item] as const));
          normalizedIncoming.forEach((build) => {
            merged.set(build.id, build);
          });
          return Array.from(merged.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });

        return normalizedIncoming.length;
      },
      deleteBuild: (id) => {
        setBuilds((current) => current.filter((item) => item.id !== id));
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

        setBuilds((current) => [duplicate, ...current].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
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

        setTemplates((current) => {
          const exists = current.some((item) => item.id === next.id);
          return exists ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current];
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

        setTemplates((current) => {
          const merged = new Map(current.map((item) => [item.id, item] as const));
          normalizedIncoming.forEach((template) => {
            merged.set(template.id, template);
          });
          return Array.from(merged.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });

        return normalizedIncoming.length;
      },
      deleteTemplate: (id) => {
        setTemplates((current) => current.filter((item) => item.id !== id));
        setBuilds((current) =>
          current.map((item) =>
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
