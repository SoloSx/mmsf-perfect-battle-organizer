"use client";

import { useEffect, useEffectEvent, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import {
  AlertTriangle,
  Download,
  FilePlus2,
  Save,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ExportScene } from "@/components/export-scene";
import { useAppData } from "@/hooks/use-app-data";
import {
  MMSF3_GIGA_CARD_LABELS,
  MMSF3_MEGA_CARD_LABELS,
  MMSF3_WHITE_CARD_SET_OPTIONS,
  getMmsf3WhiteCardSetCards,
  isKnownMmsf3WhiteCardSet,
} from "@/lib/mmsf3-roulette-options";
import { validateMmsf3FolderCards } from "@/lib/mmsf3-battle-rules";
import { getCardSuggestions, getSourceSuggestions, sortCardSuggestions } from "@/lib/wily-card-catalog";
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
  BuildSourceEntry,
  CommonSections,
  GameId,
  StrategyTemplate,
  VersionId,
} from "@/lib/types";
import { createId, uniqueStrings } from "@/lib/utils";

const BROTHER_KIND_OPTIONS: { value: BrotherKind; label: string }[] = [
  { value: "story", label: "ゲーム内" },
  { value: "auto", label: "オート" },
  { value: "real", label: "リアル" },
  { value: "event", label: "限定配信/イベント" },
];
const EDITOR_DRAFT_STORAGE_KEY_PREFIX = "mmsf-perfect-battle-organizer/editor-draft/v2";
const LEGACY_EDITOR_DRAFT_STORAGE_KEY_PREFIX = "mmsf-perfect-battle-organizer/editor-draft/v1";

function cloneBuild(build: BuildRecord) {
  return JSON.parse(JSON.stringify(build)) as BuildRecord;
}

function buildEmptyCard(): BuildCardEntry {
  return { id: createId(), name: "", quantity: 1, notes: "" };
}

function buildEmptySource(): BuildSourceEntry {
  return { id: createId(), name: "", source: "", notes: "" };
}

function buildEmptyBrother(): BrotherProfile {
  return { id: createId(), name: "", kind: "story", favoriteCards: [], notes: "" };
}

function clampList(values: string[], max?: number) {
  const unique = Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
  return typeof max === "number" ? unique.slice(0, max) : unique;
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

    return {
      ...baseBuild,
      ...parsed,
      commonSections: {
        ...baseBuild.commonSections,
        ...(parsed.commonSections ?? {}),
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
          ...(parsed.gameSpecificSections?.mmsf3 ?? {}),
        },
      },
    };
  } catch {
    return null;
  }
}

function getGameSpecificSummary(build: BuildRecord) {
  switch (build.game) {
    case "mmsf1":
      return [
        build.gameSpecificSections.mmsf1.warRockWeapon,
        build.gameSpecificSections.mmsf1.brotherBandMode,
        build.gameSpecificSections.mmsf1.versionFeature,
      ]
        .filter(Boolean)
        .join(" / ");
    case "mmsf2":
      return [
        build.gameSpecificSections.mmsf2.tribeNotes,
        build.gameSpecificSections.mmsf2.bestCombo,
        build.gameSpecificSections.mmsf2.warRockWeapon,
      ]
        .filter(Boolean)
        .join(" / ");
    case "mmsf3":
      return [
        build.gameSpecificSections.mmsf3.noise,
        build.gameSpecificSections.mmsf3.nfb,
        build.gameSpecificSections.mmsf3.mergeNoiseTarget,
      ]
        .filter(Boolean)
        .join(" / ");
  }
}

function validateBuild(build: BuildRecord) {
  const errors: string[] = [];
  const rule = getVersionRuleSet(build.version);
  const totalCards = build.commonSections.cards.reduce((sum, entry) => sum + (Number.isFinite(entry.quantity) ? entry.quantity : 0), 0);

  if (!VERSIONS_BY_GAME[build.game].includes(build.version)) {
    errors.push("作品とバージョンの組み合わせが一致していません。");
  }

  if (totalCards > rule.folderLimit) {
    errors.push(`カード総数は ${rule.folderLimit} 枚以内にしてください。`);
  }

  if (build.game === "mmsf3") {
    const { whiteCardSetId, megaCards, gigaCards, noise, rivalNoise } = build.gameSpecificSections.mmsf3;
    const folderValidation = validateMmsf3FolderCards(build.commonSections.cards, build.version);
    errors.push(...folderValidation.errors);

    if (!isKnownMmsf3WhiteCardSet(whiteCardSetId)) {
      errors.push("ホワイトカードセットが不正です。");
    }
    if (megaCards.length > (rule.limits.megaCards ?? 5)) {
      errors.push("メガカード候補は最大5枚までです。");
    }
    if (gigaCards.length > (rule.limits.gigaCards ?? 1)) {
      errors.push("ギガカード候補は最大1枚までです。");
    }

    if (noise === "ブライノイズ") {
      const realBrothers = build.commonSections.brothers.filter((entry) => entry.kind === "real" && entry.name.trim()).length;
      if (realBrothers > 0) {
        errors.push("ブライノイズ構築ではリアルブラザー登録を外してください。");
      }
      if (rivalNoise.trim()) {
        errors.push("ブライノイズ構築ではライバルノイズを空にしてください。");
      }
    }
  }

  return { errors, totalCards };
}

function applyTemplateToBuild(build: BuildRecord, template: StrategyTemplate | undefined) {
  if (!template) {
    return build;
  }

  return {
    ...build,
    strategyTemplateId: template.id,
    commonSections: {
      ...build.commonSections,
      strategyName: template.defaultValues.strategyName || build.commonSections.strategyName,
      strategyNote: template.defaultValues.strategyNote || build.commonSections.strategyNote,
      overview: template.defaultValues.overview || build.commonSections.overview,
      tags: clampList([...(template.defaultValues.tags ?? []), ...build.commonSections.tags]),
    },
  };
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
}: {
  title: string;
  entries: BuildCardEntry[];
  onChange: (entries: BuildCardEntry[]) => void;
  suggestions: string[];
}) {
  const listId = useId();
  const total = entries.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <div className="glass-panel-soft">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-white">{title}</label>
        <span className="text-xs text-white/45">合計 {total}</span>
      </div>
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/6 p-3 md:grid-cols-[1fr_110px_1fr_auto]">
            <input
              list={listId}
              value={entry.name}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, name: event.target.value } : item)))
              }
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
            <input
              value={entry.notes}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, notes: event.target.value } : item)))
              }
              placeholder="メモ"
              className="field-shell"
            />
            <button
              type="button"
              className="secondary-button"
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

function SourceListEditor({
  title,
  entries,
  onChange,
  nameSuggestions,
  sourceSuggestions,
}: {
  title: string;
  entries: BuildSourceEntry[];
  onChange: (entries: BuildSourceEntry[]) => void;
  nameSuggestions: string[];
  sourceSuggestions: string[];
}) {
  const nameListId = useId();
  const sourceListId = useId();

  return (
    <div className="glass-panel-soft">
      <label className="text-sm font-semibold text-white">{title}</label>
      <datalist id={nameListId}>
        {nameSuggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      <datalist id={sourceListId}>
        {sourceSuggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/6 p-3 md:grid-cols-[0.9fr_1.1fr_0.8fr_auto]">
            <input
              list={nameListId}
              value={entry.name}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, name: event.target.value } : item)))
              }
              placeholder="対象名"
              className="field-shell"
            />
            <input
              list={sourceListId}
              value={entry.source}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, source: event.target.value } : item)))
              }
              placeholder="入手元"
              className="field-shell"
            />
            <input
              value={entry.notes}
              onChange={(event) =>
                onChange(entries.map((item) => (item.id === entry.id ? { ...item, notes: event.target.value } : item)))
              }
              placeholder="補足"
              className="field-shell"
            />
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const nextEntries = entries.filter((item) => item.id !== entry.id);
                onChange(nextEntries.length > 0 ? nextEntries : [buildEmptySource()]);
              }}
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrotherListEditor({
  entries,
  onChange,
  suggestions,
}: {
  entries: BrotherProfile[];
  onChange: (entries: BrotherProfile[]) => void;
  suggestions: string[];
}) {
  const listId = useId();

  return (
    <div className="glass-panel-soft">
      <label className="text-sm font-semibold text-white">ブラザー情報</label>
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/6 p-3 md:grid-cols-[1fr_180px_1fr_auto]">
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
              className="secondary-button"
              onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}
            >
              削除
            </button>
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
    </div>
  );
}

export function BuildEditorPage() {
  const { createEmptyBuild, duplicateBuild, getBuildById, loaded, templates, upsertBuild } = useAppData();
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
  const cardSuggestions =
    draft.game === "mmsf3"
      ? getCardSuggestions(draft.game, draft.version)
      : sortCardSuggestions(
          draft.game,
          uniqueStrings([...getCardSuggestions(draft.game, draft.version), ...MASTER_DATA.cardsByGame[draft.game]]),
        );
  const abilitySuggestions = MASTER_DATA.abilitiesByGame[draft.game];
  const brotherSuggestions = MASTER_DATA.brothersByGame[draft.game];
  const sourceSuggestions = uniqueStrings([
    ...getSourceSuggestions(draft.game, draft.version),
    ...MASTER_DATA.sourceTagsByGame[draft.game],
  ]);
  const whiteCardSetCards = getMmsf3WhiteCardSetCards(draft.gameSpecificSections.mmsf3.whiteCardSetId);
  const selectedTemplate = templates.find((item) => item.id === draft.strategyTemplateId);

  const updateCommon = <K extends keyof CommonSections>(key: K, value: CommonSections[K]) => {
    setDraft((current) => (current ? { ...current, commonSections: { ...current.commonSections, [key]: value } } : current));
  };

  return (
    <AppShell>
      <section className="glass-panel">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/75">{GAME_LABELS[draft.game]}</p>
            <h2 className="mt-3 text-4xl font-black text-white">{VERSION_LABELS[draft.version]}</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="secondary-button"
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
                className="secondary-button"
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
              className="primary-button"
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
              className="primary-button"
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

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          <div className="glass-panel">
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.45fr_0.45fr]">
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
                      ? {
                          ...current,
                          game: nextGame,
                          version: getDefaultVersionForGame(nextGame),
                        }
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
                  setDraft((current) => (current ? { ...current, version: event.target.value as BuildRecord["version"] } : current))
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

            <div className="mt-4">
              <textarea
                value={draft.commonSections.overview}
                onChange={(event) => updateCommon("overview", event.target.value)}
                placeholder="構築全体の概要や狙い"
                className="field-shell min-h-28"
              />
            </div>
          </div>

          <TagEditor
            label="構築タグ"
            values={draft.commonSections.tags}
            onChange={(values) => updateCommon("tags", values)}
            suggestions={["対戦用", "大会想定", "速攻", "コントロール", "安定重視"]}
            placeholder="タグ追加"
          />

          <CardListEditor
            title="対戦構築カード"
            entries={draft.commonSections.cards}
            onChange={(entries) => updateCommon("cards", entries)}
            suggestions={cardSuggestions}
          />

          <SourceListEditor
            title="カード入手元"
            entries={draft.commonSections.cardSources}
            onChange={(entries) => updateCommon("cardSources", entries)}
            nameSuggestions={cardSuggestions}
            sourceSuggestions={sourceSuggestions}
          />

          <CardListEditor
            title="アビリティ"
            entries={draft.commonSections.abilities}
            onChange={(entries) => updateCommon("abilities", entries)}
            suggestions={abilitySuggestions}
          />

          <SourceListEditor
            title="アビリティ入手元"
            entries={draft.commonSections.abilitySources}
            onChange={(entries) => updateCommon("abilitySources", entries)}
            nameSuggestions={abilitySuggestions}
            sourceSuggestions={sourceSuggestions}
          />

          <BrotherListEditor
            entries={draft.commonSections.brothers}
            onChange={(entries) => updateCommon("brothers", entries)}
            suggestions={brotherSuggestions}
          />

          <div className="glass-panel">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">戦法保存</p>
                <p className="text-sm text-white/60">テンプレートの適用と、構築固有の戦法メモをここで管理します。</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={draft.strategyTemplateId ?? ""}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, strategyTemplateId: event.target.value || null } : current,
                    )
                  }
                  className="field-shell min-w-60"
                >
                  <option value="">テンプレート未選択</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setDraft((current) => (current ? applyTemplateToBuild(current, selectedTemplate) : current));
                    setStatus("テンプレートを構築に適用しました。");
                  }}
                >
                  <WandSparkles className="mr-2 size-4" />
                  適用
                </button>
                <Link href="/templates" className="secondary-button">
                  テンプレ一覧へ
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                value={draft.commonSections.strategyName}
                onChange={(event) => updateCommon("strategyName", event.target.value)}
                placeholder="戦法名"
                className="field-shell"
              />
              <textarea
                value={draft.commonSections.strategyNote}
                onChange={(event) => updateCommon("strategyNote", event.target.value)}
                placeholder="立ち回りや狙い"
                className="field-shell min-h-28"
              />
            </div>
          </div>

          <div className="glass-panel">
            <p className="text-sm font-semibold text-white">作品固有セクション</p>
            <p className="mt-1 text-sm text-white/60">{GAME_LABELS[draft.game]} / {VERSION_LABELS[draft.version]}</p>

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
              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                  <select
                    value={draft.gameSpecificSections.mmsf3.noise}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              gameSpecificSections: {
                                ...current.gameSpecificSections,
                                mmsf3: { ...current.gameSpecificSections.mmsf3, noise: event.target.value },
                              },
                            }
                          : current,
                      )
                    }
                    className="field-shell"
                  >
                    <option value="">ノイズを選択</option>
                    {MASTER_DATA.noises.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={draft.gameSpecificSections.mmsf3.noiseRate}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              gameSpecificSections: {
                                ...current.gameSpecificSections,
                                mmsf3: {
                                  ...current.gameSpecificSections.mmsf3,
                                  noiseRate: Number(event.target.value || 0),
                                },
                              },
                            }
                          : current,
                      )
                    }
                    placeholder="ノイズ率"
                    className="field-shell"
                  />
                </div>
                <TagEditor
                  label="PGM"
                  values={draft.gameSpecificSections.mmsf3.pgms}
                  onChange={(values) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            gameSpecificSections: {
                              ...current.gameSpecificSections,
                              mmsf3: { ...current.gameSpecificSections.mmsf3, pgms: clampList(values, 2) },
                            },
                          }
                        : current,
                    )
                  }
                  suggestions={MASTER_DATA.pgms}
                  maxItems={2}
                />
                <TagEditor
                  label="ノイズ別能力"
                  values={draft.gameSpecificSections.mmsf3.noiseAbilities}
                  onChange={(values) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            gameSpecificSections: {
                              ...current.gameSpecificSections,
                              mmsf3: { ...current.gameSpecificSections.mmsf3, noiseAbilities: clampList(values, 8) },
                            },
                          }
                        : current,
                    )
                  }
                  suggestions={abilitySuggestions}
                  maxItems={8}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    value={draft.gameSpecificSections.mmsf3.nfb}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              gameSpecificSections: {
                                ...current.gameSpecificSections,
                                mmsf3: { ...current.gameSpecificSections.mmsf3, nfb: event.target.value },
                              },
                            }
                          : current,
                      )
                    }
                    className="field-shell"
                  >
                    <option value="">NFB を選択</option>
                    {MASTER_DATA.nfbs.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <input
                    value={draft.gameSpecificSections.mmsf3.mergeNoiseTarget}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              gameSpecificSections: {
                                ...current.gameSpecificSections,
                                mmsf3: { ...current.gameSpecificSections.mmsf3, mergeNoiseTarget: event.target.value },
                              },
                            }
                          : current,
                      )
                    }
                    placeholder="マージノイズ先"
                    className="field-shell"
                  />
                </div>
                <div className="glass-panel-soft">
                  <label className="text-sm font-semibold text-white">ホワイトカードセット</label>
                  <select
                    value={draft.gameSpecificSections.mmsf3.whiteCardSetId}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              gameSpecificSections: {
                                ...current.gameSpecificSections,
                                mmsf3: { ...current.gameSpecificSections.mmsf3, whiteCardSetId: event.target.value },
                              },
                            }
                          : current,
                      )
                    }
                    className="field-shell mt-3"
                  >
                    {MMSF3_WHITE_CARD_SET_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value}: {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-3 text-xs leading-6 text-white/60">
                    {whiteCardSetCards.length > 0 ? whiteCardSetCards.join(" / ") : "ホワイトカードなし"}
                  </p>
                </div>
                <TagEditor
                  label="メガカード候補"
                  values={draft.gameSpecificSections.mmsf3.megaCards}
                  onChange={(values) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            gameSpecificSections: {
                              ...current.gameSpecificSections,
                              mmsf3: { ...current.gameSpecificSections.mmsf3, megaCards: clampList(values, 5) },
                            },
                          }
                        : current,
                    )
                  }
                  suggestions={MMSF3_MEGA_CARD_LABELS}
                  maxItems={5}
                />
                <TagEditor
                  label="ギガカード候補"
                  values={draft.gameSpecificSections.mmsf3.gigaCards}
                  onChange={(values) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            gameSpecificSections: {
                              ...current.gameSpecificSections,
                              mmsf3: { ...current.gameSpecificSections.mmsf3, gigaCards: clampList(values, 1) },
                            },
                          }
                        : current,
                    )
                  }
                  suggestions={MMSF3_GIGA_CARD_LABELS}
                  maxItems={1}
                />
                <TagEditor
                  label="レゾンカード"
                  values={draft.gameSpecificSections.mmsf3.rezonCards}
                  onChange={(values) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            gameSpecificSections: {
                              ...current.gameSpecificSections,
                              mmsf3: { ...current.gameSpecificSections.mmsf3, rezonCards: clampList(values, 5) },
                            },
                          }
                        : current,
                    )
                  }
                  suggestions={MASTER_DATA.rezonCards}
                  maxItems={5}
                />
                <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={draft.gameSpecificSections.mmsf3.teamSize}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              gameSpecificSections: {
                                ...current.gameSpecificSections,
                                mmsf3: {
                                  ...current.gameSpecificSections.mmsf3,
                                  teamSize: Number(event.target.value || 0),
                                },
                              },
                            }
                          : current,
                      )
                    }
                    placeholder="チーム人数"
                    className="field-shell"
                  />
                  <input
                    value={draft.gameSpecificSections.mmsf3.rivalNoise}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              gameSpecificSections: {
                                ...current.gameSpecificSections,
                                mmsf3: { ...current.gameSpecificSections.mmsf3, rivalNoise: event.target.value },
                              },
                            }
                          : current,
                      )
                    }
                    placeholder="ライバルノイズ"
                    className="field-shell"
                  />
                </div>
                <textarea
                  value={draft.gameSpecificSections.mmsf3.rouletteNotes}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            gameSpecificSections: {
                              ...current.gameSpecificSections,
                              mmsf3: { ...current.gameSpecificSections.mmsf3, rouletteNotes: event.target.value },
                            },
                          }
                        : current,
                    )
                  }
                  placeholder="ブラザールーレット・チーム共有メモ"
                  className="field-shell min-h-28"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6">
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

              <div className="glass-panel-soft">
                <p className="text-sm font-semibold text-white">構築サマリー</p>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  {getGameSpecificSummary(draft) || "作品固有情報はまだ入力されていません。"}
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
              <div className="origin-top-left scale-[0.34] md:scale-[0.45] xl:scale-[0.58]">
                <ExportScene ref={exportRef} build={draft} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
