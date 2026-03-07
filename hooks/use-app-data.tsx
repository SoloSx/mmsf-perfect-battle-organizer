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
import { DEFAULT_MMSF3_WHITE_CARD_SET_ID } from "@/lib/mmsf3-roulette-options";
import { normalizeMmsf3NoiseCardIds } from "@/lib/mmsf3-noise-cards";
import { getDefaultVersionForGame } from "@/lib/rules";
import type {
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
    cards: [],
    cardSources: [],
    abilities: [],
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
    isOwned: Boolean(entry.isOwned),
  };
}

function createDefaultGameSpecificSections(): GameSpecificSections {
  return {
    mmsf1: {
      warRockWeapon: "",
      brotherBandMode: "",
      versionFeature: "",
      crossBrotherNotes: "",
      notes: "",
    },
    mmsf2: {
      tribeNotes: "",
      brotherType: "",
      kizunaTarget: 0,
      bestCombo: "",
      legendCards: [],
      blankCards: [],
      waveCommandCards: [],
      warRockWeapon: "",
      notes: "",
    },
    mmsf3: {
      noise: "",
      noiseRate: 0,
      pgms: [],
      noiseAbilities: [],
      noiseCardIds: normalizeMmsf3NoiseCardIds(),
      nfb: "",
      mergeNoiseTarget: "",
      whiteCardSetId: DEFAULT_MMSF3_WHITE_CARD_SET_ID,
      megaCards: [],
      gigaCards: [],
      teamSize: 0,
      rezonCards: [],
      rivalNoise: "",
      rouletteNotes: "",
      notes: "",
    },
  };
}

function createBuild(game: GameId = "mmsf1"): BuildRecord {
  const timestamp = nowIso();

  return {
    id: createId(),
    title: "",
    game,
    version: getDefaultVersionForGame(game),
    commonSections: createDefaultCommonSections(),
    gameSpecificSections: createDefaultGameSpecificSections(),
    strategyTemplateId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
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
  };
  const { whiteCards: legacyWhiteCards = [], ...nextMmsf3Sections } = legacyMmsf3Sections;
  const preservedLegacyWhiteCards = legacyWhiteCards.map((item) => item.trim()).filter(Boolean);
  const legacyWhiteCardsNote =
    preservedLegacyWhiteCards.length > 0 ? `旧ホワイトカード入力: ${preservedLegacyWhiteCards.join(" / ")}` : "";
  const normalizedRouletteNotes =
    legacyWhiteCardsNote && !nextMmsf3Sections.rouletteNotes?.includes(legacyWhiteCardsNote)
      ? [nextMmsf3Sections.rouletteNotes ?? "", legacyWhiteCardsNote].filter(Boolean).join("\n")
      : (nextMmsf3Sections.rouletteNotes ?? "");
  const normalizedOverview = build.commonSections?.overview || build.commonSections?.strategyNote || "";
  const normalizedStrategyNote = build.commonSections?.strategyNote || build.commonSections?.overview || "";

  return {
    ...createBuild(build.game),
    ...build,
    commonSections: {
      ...createDefaultCommonSections(),
      ...build.commonSections,
      overview: normalizedOverview,
      strategyNote: normalizedStrategyNote,
      cards: (build.commonSections?.cards ?? []).map((entry) => normalizeBuildCardEntry(entry as BuildCardEntry)),
      cardSources: (build.commonSections?.cardSources ?? []).map((entry) => normalizeBuildSourceEntry(entry as CommonSections["cardSources"][number])),
      abilities: (build.commonSections?.abilities ?? []).map((entry) => normalizeBuildCardEntry(entry as BuildCardEntry)),
      abilitySources: (build.commonSections?.abilitySources ?? []).map((entry) =>
        normalizeBuildSourceEntry(entry as CommonSections["abilitySources"][number]),
      ),
    },
    gameSpecificSections: {
      ...createDefaultGameSpecificSections(),
      ...build.gameSpecificSections,
      mmsf3: {
        ...createDefaultGameSpecificSections().mmsf3,
        ...nextMmsf3Sections,
        noiseCardIds: normalizeMmsf3NoiseCardIds(nextMmsf3Sections.noiseCardIds),
        rouletteNotes: normalizedRouletteNotes,
      },
    },
    createdAt: build.createdAt || nowIso(),
    updatedAt: build.updatedAt || nowIso(),
  };
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

    const payload: PersistedAppState = { builds, templates };
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
