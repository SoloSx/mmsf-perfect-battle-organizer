"use client";

import { useEffect, useEffectEvent, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import {
  AlertTriangle,
  Download,
  FilePlus2,
  Save,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ExportScene } from "@/components/export-scene";
import { Mmsf3BrotherRouletteSection, Mmsf3EditorSections } from "@/components/mmsf3-editor-sections";
import { SearchableSuggestionInput } from "@/components/searchable-suggestion-input";
import { SourceListEditor, getMissingSourceNames, haveSameSourceEntries, syncSourceEntries } from "@/components/source-list-editor";
import { useAppData } from "@/hooks/use-app-data";
import { MMSF3_ABILITY_OPTIONS } from "@/lib/mmsf3-abilities";
import {
  getMissingMmsf3AbilitySourceNames,
  getNormalizedMmsf3State,
  normalizeMmsf3BuildRecord,
  normalizeMmsf3Sections,
  updateMmsf3AbilityEntries,
  updateMmsf3AbilitySources,
  updateMmsf3BrotherRouletteSlots,
  updateMmsf3Noise,
  updateMmsf3NoiseCardIds,
  updateMmsf3PlayerRezonCard,
  updateMmsf3SssLevels,
  updateMmsf3WhiteCardSetId,
  validateMmsf3BuildState,
} from "@/lib/mmsf3-build-state";
import { getCardSuggestions, getKnownCardSources, getSourceSuggestions, sortCardSuggestions } from "@/lib/guide-card-catalog";
import { MASTER_DATA } from "@/lib/seed-data";
import {
  GAME_LABELS,
  getDefaultVersionForGame,
  getVersionRuleSet,
  VERSION_LABELS,
  VERSIONS_BY_GAME,
} from "@/lib/rules";
import type {
  BrotherProfile,
  BrotherKind,
  BuildCardEntry,
  BuildRecord,
  CommonSections,
  GameId,
  VersionId,
} from "@/lib/types";
import { createId, uniqueStrings } from "@/lib/utils";

const BROTHER_KIND_OPTIONS: { value: BrotherKind; label: string }[] = [
  { value: "story", label: "ゲーム内" },
  { value: "auto", label: "オート" },
  { value: "real", label: "リアル" },
  { value: "event", label: "限定配信/イベント" },
];
const BATTLE_CARD_ROW_GRID_CLASS = "min-[1180px]:grid-cols-[minmax(0,1fr)_110px_88px_112px]";
const EDITOR_DRAFT_STORAGE_KEY_PREFIX = "mmsf-perfect-battle-organizer/editor-draft/v2";
const LEGACY_EDITOR_DRAFT_STORAGE_KEY_PREFIX = "mmsf-perfect-battle-organizer/editor-draft/v1";

function cloneBuild(build: BuildRecord) {
  return JSON.parse(JSON.stringify(build)) as BuildRecord;
}

function buildEmptyCard(): BuildCardEntry {
  return { id: createId(), name: "", quantity: 1, notes: "", isRegular: false };
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

function normalizeBuildSourceEntry(entry: CommonSections["abilitySources"][number]): CommonSections["abilitySources"][number] {
  return {
    id: entry.id,
    name: entry.name ?? "",
    source: entry.source ?? "",
    notes: entry.notes ?? "",
    isOwned: Boolean(entry.isOwned),
  };
}

function buildEmptyBrother(): BrotherProfile {
  return { id: createId(), name: "", kind: "story", favoriteCards: [], rezonCard: "", notes: "" };
}

function clampList(values: string[], max?: number) {
  const unique = Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
  return typeof max === "number" ? unique.slice(0, max) : unique;
}

function normalizeBrotherProfile(entry: BrotherProfile): BrotherProfile {
  return {
    id: entry.id,
    name: entry.name ?? "",
    kind: entry.kind ?? "story",
    favoriteCards: clampList(entry.favoriteCards ?? []),
    rezonCard: entry.rezonCard ?? "",
    notes: entry.notes ?? "",
  };
}

function resolveRequestedGameVersion(requestedGame: string | null, requestedVersion: string | null) {
  const fallbackGame: GameId = "mmsf1";

  if (requestedGame && requestedGame in VERSIONS_BY_GAME) {
    const game = requestedGame as GameId;
    const version = requestedVersion && VERSIONS_BY_GAME[game].includes(requestedVersion as VersionId)
      ? (requestedVersion as VersionId)
      : getDefaultVersionForGame(game);
    return { game, version };
  }

  if (requestedVersion) {
    const matchedGame = (Object.keys(VERSIONS_BY_GAME) as GameId[]).find((game) =>
      VERSIONS_BY_GAME[game].includes(requestedVersion as VersionId),
    );

    if (matchedGame) {
      return { game: matchedGame, version: requestedVersion as VersionId };
    }
  }

  return { game: fallbackGame, version: getDefaultVersionForGame(fallbackGame) };
}

function buildEditorHref(game: GameId, version: VersionId, buildId?: string | null) {
  const params = new URLSearchParams({
    game,
    version,
  });

  if (buildId) {
    params.set("buildId", buildId);
  }

  return `/editor?${params.toString()}`;
}

function buildEditorDraftStorageKey(
  buildId: string | null,
  requestedGame: string | null,
  requestedVersion: string | null,
  prefix = EDITOR_DRAFT_STORAGE_KEY_PREFIX,
) {
  if (buildId) {
    return `${prefix}/build/${buildId}`;
  }

  const { game, version } = resolveRequestedGameVersion(requestedGame, requestedVersion);
  return `${prefix}/new/${game}/${version}`;
}

function restoreEditorDraft(baseBuild: BuildRecord, rawDraft: string | null) {
  if (!rawDraft) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawDraft) as Partial<BuildRecord>;
    return normalizeMmsf3BuildRecord({
      ...baseBuild,
      ...parsed,
      commonSections: {
        ...baseBuild.commonSections,
        ...(parsed.commonSections ?? {}),
        brothers: (parsed.commonSections?.brothers ?? baseBuild.commonSections.brothers).map((entry) =>
          normalizeBrotherProfile(entry as BrotherProfile),
        ),
        abilities: (parsed.commonSections?.abilities ?? baseBuild.commonSections.abilities).map((entry) =>
          normalizeBuildCardEntry(entry as BuildCardEntry),
        ),
        abilitySources: (parsed.commonSections?.abilitySources ?? baseBuild.commonSections.abilitySources).map((entry) =>
          normalizeBuildSourceEntry(entry as CommonSections["abilitySources"][number]),
        ),
      },
      gameSpecificSections: {
        ...baseBuild.gameSpecificSections,
        ...(parsed.gameSpecificSections ?? {}),
        mmsf1: {
          ...baseBuild.gameSpecificSections.mmsf1,
          ...(parsed.gameSpecificSections?.mmsf1 ?? {}),
        },
        mmsf2: {
          ...baseBuild.gameSpecificSections.mmsf2,
          ...(parsed.gameSpecificSections?.mmsf2 ?? {}),
        },
        mmsf3: {
          ...baseBuild.gameSpecificSections.mmsf3,
          ...normalizeMmsf3Sections(parsed.gameSpecificSections?.mmsf3, baseBuild.gameSpecificSections.mmsf3),
        },
      },
    });
  } catch {
    return null;
  }
}

function validateBuild(build: BuildRecord) {
  const errors: string[] = [];
  const rule = getVersionRuleSet(build.version);
  const totalCards = build.commonSections.cards.reduce((sum, entry) => sum + (Number.isFinite(entry.quantity) ? entry.quantity : 0), 0);
  const regularCardCount = build.commonSections.cards.filter((entry) => entry.name.trim() && entry.isRegular).length;

  if (!VERSIONS_BY_GAME[build.game].includes(build.version)) {
    errors.push("作品とバージョンの組み合わせが一致していません。");
  }

  if (totalCards > rule.folderLimit) {
    errors.push(`カード総数は ${rule.folderLimit} 枚以内にしてください。`);
  }

  if (regularCardCount > 1) {
    errors.push("REG カードは1枚だけ指定してください。");
  }

  if (build.game === "mmsf3") {
    const state = getNormalizedMmsf3State(build);
    const mmsf3Validation = validateMmsf3BuildState(build, state);
    errors.push(...mmsf3Validation.errors);
  }

  return { errors, totalCards };
}

function TagEditor({
  label,
  values,
  onChange,
  suggestions,
  maxItems,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  maxItems?: number;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const listId = useId();

  const addValue = (value: string) => {
    const next = clampList([...values, value], maxItems);
    onChange(next);
    setInput("");
  };

  return (
    <div className="glass-panel-soft">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-white">{label}</label>
        {typeof maxItems === "number" && <span className="text-xs text-white/45">{values.length}/{maxItems}</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          list={listId}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (input.trim()) {
                addValue(input.trim());
              }
            }
          }}
          placeholder={placeholder ?? "値を追加"}
          className="field-shell flex-1"
        />
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            if (input.trim()) {
              addValue(input.trim());
            }
          }}
        >
          追加
        </button>
        <datalist id={listId}>
          {suggestions?.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <button
              key={value}
              type="button"
              className="chip"
              onClick={() => onChange(values.filter((item) => item !== value))}
            >
              {value} ×
            </button>
          ))
        ) : (
          <span className="text-xs text-white/45">未登録</span>
        )}
      </div>
    </div>
  );
}

function CardListEditor({
  title,
  entries,
  onChange,
  suggestions,
  allowRegularSelection = false,
}: {
  title: string;
  entries: BuildCardEntry[];
  onChange: (entries: BuildCardEntry[]) => void;
  suggestions: string[];
  allowRegularSelection?: boolean;
}) {
  const total = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const regularCount = entries.filter((entry) => entry.name.trim() && entry.isRegular).length;

  return (
    <div className="glass-panel-soft relative z-0 p-6 focus-within:z-20">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-white">{title}</label>
        <div className="flex items-center gap-3 text-xs text-white/45">
          {allowRegularSelection ? <span>REG {regularCount}/1</span> : null}
          <span>合計 {total}</span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`relative z-0 grid gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 focus-within:z-10 ${BATTLE_CARD_ROW_GRID_CLASS}`}
          >
            <SearchableSuggestionInput
              value={entry.name}
              onChange={(value) => onChange(entries.map((item) => (item.id === entry.id ? { ...item, name: value } : item)))}
              suggestions={suggestions}
              placeholder="カード名"
              className="field-shell"
            />
            <input
              type="number"
              min={1}
              max={99}
              value={entry.quantity}
              onChange={(event) =>
                onChange(
                  entries.map((item) =>
                    item.id === entry.id ? { ...item, quantity: Math.max(1, Number(event.target.value || 1)) } : item,
                  ),
                )
              }
              className="field-shell"
            />
            {allowRegularSelection ? (
              <button
                type="button"
                aria-pressed={entry.isRegular}
                className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  entry.isRegular
                    ? "border-red-300/70 bg-red-500/15 text-red-100"
                    : "border-white/12 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white"
                } w-full justify-center`}
                onClick={() =>
                  onChange(
                    entries.map((item) => ({
                      ...item,
                      isRegular: item.id === entry.id ? !item.isRegular : false,
                    })),
                  )
                }
              >
                REG
              </button>
            ) : (
              <div aria-hidden="true" className="hidden min-[1180px]:block" />
            )}
            <button
              type="button"
              className="danger-button w-full justify-center"
              onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}
            >
              削除
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="secondary-button mt-4" onClick={() => onChange([...entries, buildEmptyCard()])}>
        行を追加
      </button>
    </div>
  );
}

function BrotherListEditor({
  entries,
  onChange,
  suggestions,
  rezonCardOptions,
  extraContent,
}: {
  entries: BrotherProfile[];
  onChange: (entries: BrotherProfile[]) => void;
  suggestions: string[];
  rezonCardOptions?: string[];
  extraContent?: ReactNode;
}) {
  const listId = useId();

  return (
    <div className="glass-panel-soft p-6">
      <label className="text-sm font-semibold text-white">ブラザー情報</label>
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 md:grid-cols-[1fr_180px_1fr_auto]">
            <input
              list={listId}
              value={entry.name}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, name: event.target.value } : item)))
              }
              placeholder="ブラザー名"
              className="field-shell"
            />
            <select
              value={entry.kind}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, kind: event.target.value as BrotherKind } : item)))
              }
              className="field-shell"
            >
              {BROTHER_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              value={entry.favoriteCards.join(", ")}
              onChange={(event) =>
                onChange(
                  entries.map((item) =>
                    item.id === entry.id
                      ? {
                          ...item,
                          favoriteCards: event.target.value
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                        }
                      : item,
                  ),
                )
              }
              placeholder="フェイバリットカードをカンマ区切り"
              className="field-shell"
            />
            <button
              type="button"
              className="danger-button"
              onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}
            >
              削除
            </button>
            {rezonCardOptions?.length ? (
              <div className="md:col-span-2">
                <p className="mb-2 text-[11px] font-semibold tracking-[0.28em] text-white/45">REZON CARD</p>
                <select
                  value={entry.rezonCard ?? ""}
                  onChange={(event) =>
                    onChange(entries.map((item) => (item.id === entry.id ? { ...item, rezonCard: event.target.value } : item)))
                  }
                  className="field-shell"
                >
                  <option value="">レゾンカードを選択</option>
                  {rezonCardOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <textarea
              value={entry.notes}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, notes: event.target.value } : item)))
              }
              placeholder="ブラザーの補足"
              className="field-shell md:col-span-4 min-h-24"
            />
          </div>
        ))}
      </div>
      <button type="button" className="secondary-button mt-4" onClick={() => onChange([...entries, buildEmptyBrother()])}>
        ブラザーを追加
      </button>
      {extraContent ? <div className="mt-4 grid gap-4">{extraContent}</div> : null}
    </div>
  );
}

export function BuildEditorPage() {
  const { createEmptyBuild, duplicateBuild, getBuildById, loaded, upsertBuild } = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildId = searchParams.get("buildId");
  const requestedGame = searchParams.get("game");
  const requestedVersion = searchParams.get("version");
  const draftStorageKey = useMemo(
    () => buildEditorDraftStorageKey(buildId, requestedGame, requestedVersion),
    [buildId, requestedGame, requestedVersion],
  );
  const legacyDraftStorageKey = useMemo(
    () => buildEditorDraftStorageKey(buildId, requestedGame, requestedVersion, LEGACY_EDITOR_DRAFT_STORAGE_KEY_PREFIX),
    [buildId, requestedGame, requestedVersion],
  );
  const exportRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<BuildRecord | null>(null);
  const [status, setStatus] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const persistDraftSnapshot = useEffectEvent(() => {
    if (!draft) {
      return;
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  });

  useEffect(() => {
    if (!loaded) {
      return;
    }

    let nextBuild: BuildRecord;

    if (buildId) {
      const existing = getBuildById(buildId);
      nextBuild = existing ? cloneBuild(existing) : createEmptyBuild();
    } else {
      const nextSelection = resolveRequestedGameVersion(requestedGame, requestedVersion);
      nextBuild = createEmptyBuild(nextSelection.game);
      nextBuild.version = nextSelection.version;
    }

    const restoredDraft = restoreEditorDraft(
      nextBuild,
      window.localStorage.getItem(draftStorageKey) ?? window.localStorage.getItem(legacyDraftStorageKey),
    );
    setDraft(restoredDraft ?? nextBuild);

    if (restoredDraft) {
      setStatus("未保存の編集内容を復元しました。");
    }
  }, [buildId, createEmptyBuild, draftStorageKey, getBuildById, legacyDraftStorageKey, loaded, requestedGame, requestedVersion]);

  useEffect(() => {
    if (!loaded || !draft) {
      return;
    }

    persistDraftSnapshot();
  }, [draft, loaded]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistDraftSnapshot();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const nextCardSources = syncSourceEntries(
        current.commonSections.cards,
        current.commonSections.cardSources,
        (name) => getKnownCardSources(current.game, name, current.version),
      );

      if (haveSameSourceEntries(current.commonSections.cardSources, nextCardSources)) {
        return current;
      }

      return {
        ...current,
        commonSections: {
          ...current.commonSections,
          cardSources: nextCardSources,
        },
      };
    });
  }, [draft?.game, draft?.version, draft?.commonSections.cards]);

  const validation = useMemo(() => (draft ? validateBuild(draft) : { errors: [], totalCards: 0 }), [draft]);
  const hasValidationErrors = validation.errors.length > 0;
  const statusToneClass =
    status.includes("解消") || status.includes("失敗") || status.includes("エラー")
      ? "text-red-200/90"
      : "text-cyan-200/80";

  if (!loaded || !draft) {
    return (
      <AppShell>
        <section className="glass-panel text-sm text-white/70">構築エディタを読み込み中です。</section>
      </AppShell>
    );
  }

  const versionRule = getVersionRuleSet(draft.version);
  const normalizedMmsf3State = draft.game === "mmsf3" ? getNormalizedMmsf3State(draft) : null;
  const cardSuggestions =
    draft.game === "mmsf3"
      ? getCardSuggestions(draft.game, draft.version)
      : sortCardSuggestions(
          draft.game,
          uniqueStrings([...getCardSuggestions(draft.game, draft.version), ...MASTER_DATA.cardsByGame[draft.game]]),
        );
  const abilitySuggestions = MASTER_DATA.abilitiesByGame[draft.game];
  const abilityNameSuggestions =
    draft.game === "mmsf3" ? MMSF3_ABILITY_OPTIONS.map((option) => option.label) : abilitySuggestions;
  const brotherSuggestions = MASTER_DATA.brothersByGame[draft.game];
  const sourceSuggestions = uniqueStrings([
    ...getSourceSuggestions(draft.game, draft.version),
    ...MASTER_DATA.sourceTagsByGame[draft.game],
  ]);
  const missingCardSourceNames = getMissingSourceNames(
    draft.commonSections.cards,
    draft.commonSections.cardSources,
    (name) => getKnownCardSources(draft.game, name, draft.version),
  );
  const missingAbilitySourceNames =
    draft.game === "mmsf3" && normalizedMmsf3State
      ? getMissingMmsf3AbilitySourceNames(normalizedMmsf3State, draft.version)
      : getMissingSourceNames(
          draft.commonSections.abilities,
          draft.commonSections.abilitySources,
          (name) => getKnownCardSources(draft.game, name, draft.version),
        );

  const updateCommon = <K extends keyof CommonSections>(key: K, value: CommonSections[K]) => {
    setDraft((current) => (current ? { ...current, commonSections: { ...current.commonSections, [key]: value } } : current));
  };

  const rockmanSection = (
    <div className="glass-panel">
      <p className="text-sm font-semibold text-white">ロックマン</p>

      {draft.game === "mmsf1" && (
        <div className="mt-4 grid gap-4">
          <select
            value={draft.gameSpecificSections.mmsf1.warRockWeapon}
            onChange={(event) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      gameSpecificSections: {
                        ...current.gameSpecificSections,
                        mmsf1: { ...current.gameSpecificSections.mmsf1, warRockWeapon: event.target.value },
                      },
                    }
                  : current,
              )
            }
            className="field-shell"
          >
            <option value="">ウォーロック装備を選択</option>
            {MASTER_DATA.warRockWeaponsByGame.mmsf1.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={draft.gameSpecificSections.mmsf1.brotherBandMode}
            onChange={(event) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      gameSpecificSections: {
                        ...current.gameSpecificSections,
                        mmsf1: { ...current.gameSpecificSections.mmsf1, brotherBandMode: event.target.value },
                      },
                    }
                  : current,
              )
            }
            placeholder="ブラザーバンド運用メモ"
            className="field-shell"
          />
          <textarea
            value={draft.gameSpecificSections.mmsf1.versionFeature}
            onChange={(event) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      gameSpecificSections: {
                        ...current.gameSpecificSections,
                        mmsf1: { ...current.gameSpecificSections.mmsf1, versionFeature: event.target.value },
                      },
                    }
                  : current,
              )
            }
            placeholder="版差・特殊仕様"
            className="field-shell min-h-28"
          />
          <textarea
            value={draft.gameSpecificSections.mmsf1.crossBrotherNotes}
            onChange={(event) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      gameSpecificSections: {
                        ...current.gameSpecificSections,
                        mmsf1: { ...current.gameSpecificSections.mmsf1, crossBrotherNotes: event.target.value },
                      },
                    }
                  : current,
              )
            }
            placeholder="クロスブラザーバンド系メモ"
            className="field-shell min-h-28"
          />
        </div>
      )}

      {draft.game === "mmsf2" && (
        <div className="mt-4 grid gap-4">
          <textarea
            value={draft.gameSpecificSections.mmsf2.tribeNotes}
            onChange={(event) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      gameSpecificSections: {
                        ...current.gameSpecificSections,
                        mmsf2: { ...current.gameSpecificSections.mmsf2, tribeNotes: event.target.value },
                      },
                    }
                  : current,
              )
            }
            placeholder="トライブ関連メモ"
            className="field-shell min-h-28"
          />
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <input
              value={draft.gameSpecificSections.mmsf2.brotherType}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        gameSpecificSections: {
                          ...current.gameSpecificSections,
                          mmsf2: { ...current.gameSpecificSections.mmsf2, brotherType: event.target.value },
                        },
                      }
                    : current,
                )
              }
              placeholder="ブラザー種別メモ"
              className="field-shell"
            />
            <input
              type="number"
              min={0}
              value={draft.gameSpecificSections.mmsf2.kizunaTarget}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        gameSpecificSections: {
                          ...current.gameSpecificSections,
                          mmsf2: {
                            ...current.gameSpecificSections.mmsf2,
                            kizunaTarget: Number(event.target.value || 0),
                          },
                        },
                      }
                    : current,
                )
              }
              placeholder="キズナ目標"
              className="field-shell"
            />
          </div>
          <input
            value={draft.gameSpecificSections.mmsf2.bestCombo}
            onChange={(event) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      gameSpecificSections: {
                        ...current.gameSpecificSections,
                        mmsf2: { ...current.gameSpecificSections.mmsf2, bestCombo: event.target.value },
                      },
                    }
                  : current,
              )
            }
            placeholder="ベストコンボ"
            className="field-shell"
          />
          <TagEditor
            label="レジェンドカード"
            values={draft.gameSpecificSections.mmsf2.legendCards}
            onChange={(values) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      gameSpecificSections: {
                        ...current.gameSpecificSections,
                        mmsf2: { ...current.gameSpecificSections.mmsf2, legendCards: clampList(values, 6) },
                      },
                    }
                  : current,
              )
            }
            suggestions={cardSuggestions}
            maxItems={6}
          />
          <TagEditor
            label="ブランクカード"
            values={draft.gameSpecificSections.mmsf2.blankCards}
            onChange={(values) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      gameSpecificSections: {
                        ...current.gameSpecificSections,
                        mmsf2: { ...current.gameSpecificSections.mmsf2, blankCards: clampList(values, 6) },
                      },
                    }
                  : current,
              )
            }
            suggestions={cardSuggestions}
            maxItems={6}
          />
          <TagEditor
            label="ウェーブコマンドカード"
            values={draft.gameSpecificSections.mmsf2.waveCommandCards}
            onChange={(values) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      gameSpecificSections: {
                        ...current.gameSpecificSections,
                        mmsf2: { ...current.gameSpecificSections.mmsf2, waveCommandCards: clampList(values, 6) },
                      },
                    }
                  : current,
              )
            }
            suggestions={cardSuggestions}
            maxItems={6}
          />
          <select
            value={draft.gameSpecificSections.mmsf2.warRockWeapon}
            onChange={(event) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      gameSpecificSections: {
                        ...current.gameSpecificSections,
                        mmsf2: { ...current.gameSpecificSections.mmsf2, warRockWeapon: event.target.value },
                      },
                    }
                  : current,
              )
            }
            className="field-shell"
          >
            <option value="">ウォーロック装備を選択</option>
            {MASTER_DATA.warRockWeaponsByGame.mmsf2.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}

      {draft.game === "mmsf3" && (
        normalizedMmsf3State ? (
          <Mmsf3EditorSections
            version={draft.version}
            state={normalizedMmsf3State}
            abilityNameSuggestions={abilityNameSuggestions}
            sourceSuggestions={sourceSuggestions}
            missingAbilitySourceNames={missingAbilitySourceNames}
            onNoiseChange={(noise) => setDraft((current) => (current ? updateMmsf3Noise(current, noise) : current))}
            onPlayerRezonCardChange={(value) =>
              setDraft((current) => (current ? updateMmsf3PlayerRezonCard(current, value) : current))
            }
            onWhiteCardSetIdChange={(value) =>
              setDraft((current) => (current ? updateMmsf3WhiteCardSetId(current, value) : current))
            }
            onNoiseCardIdsChange={(values) =>
              setDraft((current) => (current ? updateMmsf3NoiseCardIds(current, values) : current))
            }
            onAbilitiesChange={(entries) =>
              setDraft((current) => (current ? updateMmsf3AbilityEntries(current, entries) : current))
            }
            onAbilitySourcesChange={(entries) =>
              setDraft((current) => (current ? updateMmsf3AbilitySources(current, entries) : current))
            }
          />
        ) : null
      )}

      {draft.game !== "mmsf3" && (
        <div className="mt-4 grid gap-4">
          <CardListEditor
            title="アビリティ"
            entries={draft.commonSections.abilities}
            onChange={(entries) => updateCommon("abilities", entries)}
            suggestions={abilitySuggestions}
          />

          <SourceListEditor
            title="アビリティ入手方法"
            entries={draft.commonSections.abilitySources}
            onChange={(entries) => updateCommon("abilitySources", entries)}
            game={draft.game}
            version={draft.version}
            nameSuggestions={abilityNameSuggestions}
            sourceSuggestions={sourceSuggestions}
            missingNames={missingAbilitySourceNames}
            useKnownSourceSuggestions
            actionMode="owned"
            resolveKnownSources={(name) =>
              getKnownCardSources(draft.game, name, draft.version)
            }
          />
        </div>
      )}
    </div>
  );

  const battleCardsSection = (
    <div className="glass-panel grid gap-4">
      <p className="text-sm font-semibold text-white">フォルダー</p>

      <CardListEditor
        title="対戦構築カード"
        entries={draft.commonSections.cards}
        onChange={(entries) => updateCommon("cards", entries)}
        suggestions={cardSuggestions}
        allowRegularSelection
      />

      <SourceListEditor
        title="カード入手方法"
        entries={draft.commonSections.cardSources}
        onChange={(entries) => updateCommon("cardSources", entries)}
        game={draft.game}
        version={draft.version}
        nameSuggestions={cardSuggestions}
        sourceSuggestions={sourceSuggestions}
        missingNames={missingCardSourceNames}
        useKnownSourceSuggestions
        actionMode="owned"
      />
    </div>
  );

  const brotherSection =
    draft.game === "mmsf3" ? (
      normalizedMmsf3State ? (
        <Mmsf3BrotherRouletteSection
          slots={normalizedMmsf3State.brotherRouletteSlots}
          sssLevels={normalizedMmsf3State.sssLevels}
          onBrotherChange={(slots) =>
            setDraft((current) => (current ? updateMmsf3BrotherRouletteSlots(current, slots) : current))
          }
          onSssChange={(levels) => setDraft((current) => (current ? updateMmsf3SssLevels(current, levels) : current))}
          isDisabled={normalizedMmsf3State.noise === "ブライノイズ"}
        />
      ) : null
    ) : (
      <BrotherListEditor
        entries={draft.commonSections.brothers}
        onChange={(entries) => updateCommon("brothers", entries)}
        suggestions={brotherSuggestions}
      />
    );

  return (
    <AppShell>
      <section className="glass-panel">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/75">{GAME_LABELS[draft.game]}</p>
            <h2 className="mt-3 text-4xl font-black text-white">{VERSION_LABELS[draft.version]}</h2>
          </div>

          <div className="flex flex-wrap gap-3 self-start 2xl:justify-end">
            <button
              type="button"
              className="secondary-button whitespace-nowrap"
              onClick={() => {
                const reset = createEmptyBuild(draft.game);
                reset.version = draft.version;
                setDraft(reset);
                router.replace(buildEditorHref(draft.game, draft.version));
              }}
            >
              <FilePlus2 className="mr-2 size-4" />
              新規に戻す
            </button>
            {buildId && (
              <button
                type="button"
                className="secondary-button whitespace-nowrap"
                onClick={() => {
                  const duplicate = duplicateBuild(buildId);
                  if (duplicate) {
                    router.replace(buildEditorHref(duplicate.game, duplicate.version, duplicate.id));
                  }
                }}
              >
                <Sparkles className="mr-2 size-4" />
                複製して編集
              </button>
            )}
            <button
              type="button"
              className="primary-button whitespace-nowrap"
              onClick={() => {
                if (validation.errors.length > 0) {
                  setStatus("保存前にエラーを解消してください。");
                  return;
                }

                const saved = upsertBuild(draft);
                window.localStorage.removeItem(draftStorageKey);
                setDraft(saved);
                setStatus("構築を保存しました。");
                router.replace(buildEditorHref(saved.game, saved.version, saved.id));
              }}
            >
              <Save className="mr-2 size-4" />
              保存
            </button>
            <button
              type="button"
              className="primary-button whitespace-nowrap"
              disabled={isExporting}
              onClick={async () => {
                if (!exportRef.current) {
                  return;
                }
                setIsExporting(true);
                try {
                  const dataUrl = await toPng(exportRef.current, {
                    cacheBust: true,
                    pixelRatio: 2,
                    backgroundColor: "#05050f",
                  });
                  const anchor = document.createElement("a");
                  anchor.download = `${draft.title || VERSION_LABELS[draft.version]}-build.png`;
                  anchor.href = dataUrl;
                  anchor.click();
                  setStatus("PNG を出力しました。");
                } catch {
                  setStatus("PNG の出力に失敗しました。");
                } finally {
                  setIsExporting(false);
                }
              }}
            >
              <Download className="mr-2 size-4" />
              PNG 出力
            </button>
          </div>
        </div>

        {status && <p className={`mt-4 text-sm ${statusToneClass}`}>{status}</p>}
        <p className="mt-3 text-xs text-white/45">この画面の入力内容はブラウザに一時保存されるため、保存前にリロードしても復元されます。</p>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="grid min-w-0 gap-6">
          <div className="glass-panel">
            <div>
              <p className="text-sm font-semibold text-white">基本情報</p>
              <p className="mt-1 text-sm text-white/60">構築名、作品、概要、タグをまとめて編集します。</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.45fr_0.45fr]">
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                placeholder="構築名"
                className="field-shell"
              />
              <select
                value={draft.game}
                onChange={(event) => {
                  const nextGame = event.target.value as GameId;
                  setDraft((current) =>
                    current
                      ? normalizeMmsf3BuildRecord({
                          ...current,
                          game: nextGame,
                          version: getDefaultVersionForGame(nextGame),
                        })
                      : current,
                  );
                }}
                className="field-shell"
              >
                {Object.entries(GAME_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={draft.version}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? normalizeMmsf3BuildRecord({ ...current, version: event.target.value as BuildRecord["version"] })
                      : current,
                  )
                }
                className="field-shell"
              >
                {VERSIONS_BY_GAME[draft.game].map((version) => (
                  <option key={version} value={version}>
                    {VERSION_LABELS[version]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <div className="min-w-0">
                <textarea
                  value={draft.commonSections.overview}
                  onChange={(event) => updateCommon("overview", event.target.value)}
                  placeholder="構築全体の概要、環境、狙い"
                  className="field-shell min-h-48 w-full"
                />
              </div>

              <div className="grid min-w-0 gap-4">
                <TagEditor
                  label="構築タグ"
                  values={draft.commonSections.tags}
                  onChange={(values) => updateCommon("tags", values)}
                  suggestions={["対戦用", "大会想定", "速攻", "コントロール", "安定重視"]}
                  placeholder="タグ追加"
                />
              </div>
            </div>
          </div>

          {rockmanSection}

          {battleCardsSection}

          {brotherSection}
        </div>

        <div className="grid min-w-0 gap-6">
          <div className={`glass-panel ${hasValidationErrors ? "ring-1 ring-red-400/20" : ""}`}>
            <div className={`flex items-center gap-3 text-sm font-semibold ${hasValidationErrors ? "text-red-100" : "text-white"}`}>
              <AlertTriangle className={`size-4 ${hasValidationErrors ? "text-red-300" : "text-cyan-200"}`} />
              バリデーション
            </div>
            <div className="mt-4 grid gap-4">
              <div className="glass-panel-soft">
                <p className="text-sm font-semibold text-white">カード総数</p>
                <p className={`mt-2 text-sm ${validation.totalCards > versionRule.folderLimit ? "text-red-200/90" : "text-white/72"}`}>
                  {validation.totalCards} / {versionRule.folderLimit}
                </p>
              </div>

              <div className={`glass-panel-soft ${hasValidationErrors ? "bg-red-500/8 ring-1 ring-red-400/25" : ""}`}>
                <p className="text-sm font-semibold text-white">状態</p>
                {hasValidationErrors ? (
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-red-200/90">
                    {validation.errors.map((error) => (
                      <li key={error}>• {error}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-emerald-200/90">保存可能です。</p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">PNG プレビュー</p>
                <p className="mt-1 text-sm text-white/60">カード画像が未取得の項目はタイトル付きプレースホルダで出力します。</p>
              </div>
            </div>
            <div className="mt-5 overflow-auto rounded-[28px] border border-white/10 bg-black/25 p-3">
              <div className="mx-auto aspect-[1200/675] w-full max-w-[408px] md:max-w-[540px]">
                <div className="origin-top-left scale-[0.34] md:scale-[0.45]">
                  <ExportScene ref={exportRef} build={draft} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
