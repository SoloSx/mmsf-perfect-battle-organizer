"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import { AppShell } from "@/components/app-shell";
import { BasicInfoSection } from "@/components/editor/basic-info-section";
import { BrotherListEditor } from "@/components/editor/brother-list-editor";
import {
  buildEditorHref,
  buildEmptyBrother,
  cloneBuild,
  createMmsf2BlankCardDraftEntries,
  EDITOR_DRAFT_STORAGE_KEY_PREFIX,
  getMissingAbilitySourceNames,
  getMissingCardSourceNames,
  getMissingWarRockWeaponSourceNames,
  getMmsf2TrackedCards,
  haveSameBrotherProfiles,
  haveSameCardEntries,
  restoreEditorDraft,
  stripTransientBuildFlags,
  syncMmsf1WarRockWeaponSources,
  syncMmsf2WarRockWeaponSources,
  validateBuild,
  withAutoExpandedEditorRows,
} from "@/components/editor/build-editor-state";
import { BuildEditorToolbar } from "@/components/editor/build-editor-toolbar";
import { BuildEditorValidationPanel } from "@/components/editor/build-editor-validation-panel";
import { CardListEditor } from "@/components/editor/card-list-editor";
import { PngPreviewModal } from "@/components/editor/png-preview-modal";
import { ExportScene } from "@/components/export-scene";
import { Mmsf1BrotherSection } from "@/components/mmsf1/brother-section";
import { Mmsf1EditorSections, Mmsf1WarRockSection } from "@/components/mmsf1/editor-sections";
import { Mmsf2AbilitySection } from "@/components/mmsf2/ability-section";
import { Mmsf2BrotherSection } from "@/components/mmsf2/brother-section";
import { Mmsf2EditorSections, Mmsf2WarRockSection } from "@/components/mmsf2/editor-sections";
import { Mmsf3BrotherRouletteSection, Mmsf3EditorSections } from "@/components/mmsf3/editor-sections";
import { SourceListEditor, haveSameSourceEntries, syncSourceEntries } from "@/components/source-list-editor";
import { useAppData } from "@/hooks/use-app-data";
import { normalizeMmsf1BrotherProfile } from "@/lib/mmsf1/brothers";
import { getMmsf1WarRockWeaponSources } from "@/lib/mmsf1/war-rock-weapons";
import { MMSF3_ABILITY_OPTIONS } from "@/lib/mmsf3/abilities";
import {
  getMmsf2AbilityNameSuggestions,
  getMmsf2AbilitySources,
  normalizeMmsf2AbilityEntries,
} from "@/lib/mmsf2/abilities";
import {
  getNormalizedMmsf3State,
  isMmsf3GeminiNoise,
  normalizeMmsf3BuildRecord,
  updateMmsf3AbilityEntries,
  updateMmsf3AbilitySources,
  updateMmsf3BrotherRouletteSlots,
  updateMmsf3Noise,
  updateMmsf3NoiseCardIds,
  updateMmsf3PlayerRezonCard,
  updateMmsf3SssLevels,
  updateMmsf3WarRockWeapon,
  updateMmsf3WarRockWeaponSources,
  updateMmsf3WhiteCardSetId,
} from "@/lib/mmsf3/build-state";
import {
  getCardSourceNameSuggestions,
  getCardSuggestions,
  getKnownCardSources,
  getMmsf2BlankCardSuggestions,
  getMmsf2StarCardSuggestions,
  getSourceSuggestions,
  sortCardSuggestions,
} from "@/lib/guide-card-catalog";
import {
  getMmsf2BlankCardTotalLimit,
  getMmsf2NormalCardTotalLimit,
} from "@/lib/mmsf2/battle-rules";
import { getMmsf2WarRockWeaponSources } from "@/lib/mmsf2/war-rock-weapons";
import { MASTER_DATA } from "@/lib/seed-data";
import {
  GAME_LABELS,
  getDefaultVersionForGame,
  getVersionRuleSet,
  VERSION_LABELS,
  VERSIONS_BY_GAME,
} from "@/lib/rules";
import type { BuildCardEntry, BuildRecord, CommonSections, GameId, VersionId } from "@/lib/types";
import { uniqueStrings } from "@/lib/utils";

const DEFAULT_VALIDATION = {
  errors: [],
  totalCards: 0,
  hasFolderErrors: false,
  cardTotalLabel: "0 / 30",
};

function buildDraftStorageKey(buildId: string | null, requestedGame: string | null, requestedVersion: string | null) {
  if (buildId) {
    return `${EDITOR_DRAFT_STORAGE_KEY_PREFIX}/build/${buildId}`;
  }

  const fallbackGame: GameId = "mmsf1";
  const game =
    requestedGame && requestedGame in VERSIONS_BY_GAME ? (requestedGame as GameId) : fallbackGame;
  const version =
    requestedVersion && VERSIONS_BY_GAME[game].includes(requestedVersion as VersionId)
      ? (requestedVersion as VersionId)
      : getDefaultVersionForGame(game);
  return `${EDITOR_DRAFT_STORAGE_KEY_PREFIX}/new/${game}/${version}`;
}

export function BuildEditorPage() {
  const { createEmptyBuild, duplicateBuild, getBuildById, loaded, upsertBuild } = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildId = searchParams.get("buildId");
  const requestedGame = searchParams.get("game");
  const requestedVersion = searchParams.get("version");
  const draftStorageKey = useMemo(
    () => buildDraftStorageKey(buildId, requestedGame, requestedVersion),
    [buildId, requestedGame, requestedVersion],
  );
  const exportRef = useRef<HTMLDivElement>(null);
  const [buildDraft, setBuildDraft] = useState<BuildRecord | null>(null);
  const [buildStatus, setBuildStatus] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [pngBackgroundMode, setPngBackgroundMode] = useState<"solid" | "transparent">("solid");

  const persistDraftSnapshot = useEffectEvent(() => {
    if (!buildDraft) {
      return;
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(stripTransientBuildFlags(buildDraft)));
  });

  useEffect(() => {
    if (!loaded) {
      return;
    }

    let nextDraft: BuildRecord;

    if (buildId) {
      const existingBuild = getBuildById(buildId);
      nextDraft = existingBuild ? cloneBuild(existingBuild) : createEmptyBuild();
    } else {
      const game =
        requestedGame && requestedGame in VERSIONS_BY_GAME ? (requestedGame as GameId) : "mmsf1";
      nextDraft = createEmptyBuild(game);
      nextDraft.version =
        requestedVersion && VERSIONS_BY_GAME[game].includes(requestedVersion as VersionId)
          ? (requestedVersion as VersionId)
          : getDefaultVersionForGame(game);
    }

    const restoredDraft = restoreEditorDraft(nextDraft, window.localStorage.getItem(draftStorageKey));
    setBuildDraft(withAutoExpandedEditorRows(restoredDraft ?? nextDraft));

    if (restoredDraft) {
      setBuildStatus("未保存の編集内容を復元しました。");
    }
  }, [buildId, createEmptyBuild, draftStorageKey, getBuildById, loaded, requestedGame, requestedVersion]);

  useEffect(() => {
    if (!loaded || !buildDraft) {
      return;
    }

    persistDraftSnapshot();
  }, [buildDraft, loaded]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistDraftSnapshot();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    setBuildDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      const trackedCardEntries =
        currentDraft.game === "mmsf2"
          ? getMmsf2TrackedCards(currentDraft)
          : currentDraft.commonSections.cards;
      const nextCardSourceEntries = syncSourceEntries(
        trackedCardEntries,
        currentDraft.commonSections.cardSources,
        (name) => getKnownCardSources(currentDraft.game, name, currentDraft.version),
      );

      if (haveSameSourceEntries(currentDraft.commonSections.cardSources, nextCardSourceEntries)) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        commonSections: {
          ...currentDraft.commonSections,
          cardSources: nextCardSourceEntries,
        },
      };
    });
  }, [buildDraft?.game, buildDraft?.version, buildDraft?.commonSections.cards]);

  useEffect(() => {
    setBuildDraft((currentDraft) => {
      if (!currentDraft || currentDraft.game !== "mmsf1") {
        return currentDraft;
      }

      const normalizedBrotherEntries = currentDraft.commonSections.brothers.map((brotherEntry) =>
        normalizeMmsf1BrotherProfile(
          brotherEntry,
          currentDraft.version as Extract<VersionId, "pegasus" | "leo" | "dragon">,
        ),
      );

      if (haveSameBrotherProfiles(currentDraft.commonSections.brothers, normalizedBrotherEntries)) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        commonSections: {
          ...currentDraft.commonSections,
          brothers: normalizedBrotherEntries,
        },
      };
    });
  }, [buildDraft?.game, buildDraft?.version, buildDraft?.commonSections.brothers]);

  useEffect(() => {
    setBuildDraft((currentDraft) => {
      if (!currentDraft || currentDraft.game !== "mmsf1") {
        return currentDraft;
      }

      const nextWeaponSourceEntries = syncMmsf1WarRockWeaponSources(
        currentDraft.gameSpecificSections.mmsf1.warRockWeapon,
        currentDraft.gameSpecificSections.mmsf1.warRockWeaponSources,
      );

      if (
        haveSameSourceEntries(
          currentDraft.gameSpecificSections.mmsf1.warRockWeaponSources,
          nextWeaponSourceEntries,
        )
      ) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        gameSpecificSections: {
          ...currentDraft.gameSpecificSections,
          mmsf1: {
            ...currentDraft.gameSpecificSections.mmsf1,
            warRockWeaponSources: nextWeaponSourceEntries,
          },
        },
      };
    });
  }, [buildDraft?.game, buildDraft?.gameSpecificSections.mmsf1.warRockWeapon]);

  useEffect(() => {
    setBuildDraft((currentDraft) => {
      if (!currentDraft || currentDraft.game !== "mmsf2") {
        return currentDraft;
      }

      const normalizedAbilityEntries = withAutoExpandedEditorRows(currentDraft).commonSections.abilities;
      const nextAbilitySourceEntries = syncSourceEntries(
        normalizedAbilityEntries,
        currentDraft.commonSections.abilitySources,
        (name) => getMmsf2AbilitySources(name, currentDraft.version),
      );

      if (
        haveSameCardEntries(currentDraft.commonSections.abilities, normalizedAbilityEntries) &&
        haveSameSourceEntries(currentDraft.commonSections.abilitySources, nextAbilitySourceEntries)
      ) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        commonSections: {
          ...currentDraft.commonSections,
          abilities: normalizedAbilityEntries,
          abilitySources: nextAbilitySourceEntries,
        },
      };
    });
  }, [buildDraft?.game, buildDraft?.version, buildDraft?.commonSections.abilities]);

  useEffect(() => {
    setBuildDraft((currentDraft) => {
      if (!currentDraft || currentDraft.game !== "mmsf2") {
        return currentDraft;
      }

      const nextWeaponSourceEntries = syncMmsf2WarRockWeaponSources(
        currentDraft.gameSpecificSections.mmsf2.warRockWeapon,
        currentDraft.gameSpecificSections.mmsf2.warRockWeaponSources,
      );

      if (
        haveSameSourceEntries(
          currentDraft.gameSpecificSections.mmsf2.warRockWeaponSources,
          nextWeaponSourceEntries,
        )
      ) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        gameSpecificSections: {
          ...currentDraft.gameSpecificSections,
          mmsf2: {
            ...currentDraft.gameSpecificSections.mmsf2,
            warRockWeaponSources: nextWeaponSourceEntries,
          },
        },
      };
    });
  }, [buildDraft?.game, buildDraft?.gameSpecificSections.mmsf2.warRockWeapon]);

  const validation = useMemo(
    () => (buildDraft ? validateBuild(buildDraft) : DEFAULT_VALIDATION),
    [buildDraft],
  );
  const statusToneClass =
    buildStatus.includes("解消") || buildStatus.includes("失敗") || buildStatus.includes("エラー")
      ? "text-red-200/90"
      : "text-cyan-200/80";

  if (!loaded || !buildDraft) {
    return (
      <AppShell>
        <section className="glass-panel text-sm text-white/70">構築エディタを読み込み中です。</section>
      </AppShell>
    );
  }

  const versionRule = getVersionRuleSet(buildDraft.version);
  const normalizedMmsf3State =
    buildDraft.game === "mmsf3" ? getNormalizedMmsf3State(withAutoExpandedEditorRows(buildDraft)) : null;
  const cardSuggestions =
    buildDraft.game === "mmsf3"
      ? getCardSuggestions(buildDraft.game, buildDraft.version)
      : sortCardSuggestions(
          buildDraft.game,
          uniqueStrings([
            ...getCardSuggestions(buildDraft.game, buildDraft.version),
            ...MASTER_DATA.cardsByGame[buildDraft.game],
          ]),
          buildDraft.version,
        );
  const cardSourceNameSuggestions =
    buildDraft.game === "mmsf3"
      ? cardSuggestions
      : sortCardSuggestions(
          buildDraft.game,
          uniqueStrings([
            ...getCardSourceNameSuggestions(buildDraft.game, buildDraft.version),
            ...MASTER_DATA.cardsByGame[buildDraft.game],
          ]),
          buildDraft.version,
        );
  const abilitySuggestions = MASTER_DATA.abilitiesByGame[buildDraft.game];
  const abilityNameSuggestions =
    buildDraft.game === "mmsf3"
      ? MMSF3_ABILITY_OPTIONS.map((option) => option.label)
      : buildDraft.game === "mmsf2"
        ? getMmsf2AbilityNameSuggestions(buildDraft.version)
        : abilitySuggestions;
  const brotherSuggestions = MASTER_DATA.brothersByGame[buildDraft.game];
  const sourceSuggestions = uniqueStrings([
    ...getSourceSuggestions(buildDraft.game, buildDraft.version),
    ...MASTER_DATA.sourceTagsByGame[buildDraft.game],
  ]);
  const missingCardSourceNames = getMissingCardSourceNames(buildDraft);
  const missingAbilitySourceNames = getMissingAbilitySourceNames(buildDraft);
  const missingWarRockWeaponSourceNames = getMissingWarRockWeaponSourceNames(buildDraft);

  const updateCommonSection = <K extends keyof CommonSections>(key: K, value: CommonSections[K]) => {
    setBuildDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, commonSections: { ...currentDraft.commonSections, [key]: value } } : currentDraft,
    );
  };

  const updateFolderEntries = (folderEntries: BuildCardEntry[]) => {
    setBuildDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      const nextDraft = withAutoExpandedEditorRows({
        ...currentDraft,
        commonSections: {
          ...currentDraft.commonSections,
          cards: folderEntries,
        },
      });
      const nextTrackedCardEntries =
        nextDraft.game === "mmsf2"
          ? [
              ...nextDraft.commonSections.cards,
              ...nextDraft.gameSpecificSections.mmsf2.starCards,
              ...nextDraft.gameSpecificSections.mmsf2.blankCards,
            ]
          : nextDraft.commonSections.cards;
      const nextCardSourceEntries = syncSourceEntries(
        nextTrackedCardEntries,
        currentDraft.commonSections.cardSources,
        (name) => getKnownCardSources(currentDraft.game, name, currentDraft.version),
      );

      return {
        ...nextDraft,
        commonSections: {
          ...nextDraft.commonSections,
          cardSources: nextCardSourceEntries,
        },
      };
    });
  };

  const updateAbilityEntries = (abilityEntries: BuildCardEntry[]) => {
    setBuildDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      const normalizedAbilityEntries =
        currentDraft.game === "mmsf2"
          ? normalizeMmsf2AbilityEntries(
              abilityEntries,
              currentDraft.version,
              currentDraft.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled,
            )
          : abilityEntries;
      const nextDraft = withAutoExpandedEditorRows({
        ...currentDraft,
        commonSections: {
          ...currentDraft.commonSections,
          abilities: normalizedAbilityEntries,
        },
      });
      const nextAbilitySourceEntries = syncSourceEntries(
        nextDraft.commonSections.abilities,
        currentDraft.commonSections.abilitySources,
        (name) =>
          currentDraft.game === "mmsf2"
            ? getMmsf2AbilitySources(name, currentDraft.version)
            : getKnownCardSources(currentDraft.game, name, currentDraft.version),
      );

      return {
        ...nextDraft,
        commonSections: {
          ...nextDraft.commonSections,
          abilitySources: nextAbilitySourceEntries,
        },
      };
    });
  };

  const updateMmsf2BlankCardEntries = (blankCardEntries: BuildCardEntry[]) => {
    setBuildDraft((currentDraft) => {
      if (!currentDraft || currentDraft.game !== "mmsf2") {
        return currentDraft;
      }

      const normalizedBlankCardEntries = createMmsf2BlankCardDraftEntries(
        blankCardEntries,
        getMmsf2BlankCardTotalLimit(
          currentDraft.commonSections.cards,
          currentDraft.gameSpecificSections.mmsf2.starCards,
          getVersionRuleSet(currentDraft.version).folderLimit,
        ),
      );
      const nextCardSourceEntries = syncSourceEntries(
        [...currentDraft.commonSections.cards, ...currentDraft.gameSpecificSections.mmsf2.starCards, ...normalizedBlankCardEntries],
        currentDraft.commonSections.cardSources,
        (name) => getKnownCardSources(currentDraft.game, name, currentDraft.version),
      );

      return {
        ...currentDraft,
        commonSections: {
          ...currentDraft.commonSections,
          cardSources: nextCardSourceEntries,
        },
        gameSpecificSections: {
          ...currentDraft.gameSpecificSections,
          mmsf2: {
            ...currentDraft.gameSpecificSections.mmsf2,
            blankCards: normalizedBlankCardEntries,
          },
        },
      };
    });
  };

  const renderExportSceneToPng = async () => {
    if (!exportRef.current) {
      return null;
    }

    return toPng(exportRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: pngBackgroundMode === "solid" ? "#05050f" : undefined,
    });
  };

  const mmsf2StarCardSuggestions = buildDraft.game === "mmsf2" ? getMmsf2StarCardSuggestions(buildDraft.version) : [];
  const mmsf2BlankCardSuggestions = buildDraft.game === "mmsf2" ? getMmsf2BlankCardSuggestions(buildDraft.version) : [];
  const mmsf3GeminiTagMode =
    buildDraft.game === "mmsf3" && isMmsf3GeminiNoise(buildDraft.gameSpecificSections.mmsf3.noise);

  return (
    <AppShell>
      <section className="glass-panel">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/75">{GAME_LABELS[buildDraft.game]}</p>
            <h2 className="mt-3 text-4xl font-black text-white">{VERSION_LABELS[buildDraft.version]}</h2>
          </div>

          <BuildEditorToolbar
            canDuplicate={Boolean(buildId)}
            isExporting={isExporting}
            isPreviewing={isPreviewing}
            pngBackgroundMode={pngBackgroundMode}
            onDuplicate={() => {
              if (!buildId) {
                return;
              }

              const duplicatedBuild = duplicateBuild(buildId);
              if (duplicatedBuild) {
                router.replace(buildEditorHref(duplicatedBuild.game, duplicatedBuild.version, duplicatedBuild.id));
              }
            }}
            onExport={async () => {
              setIsExporting(true);
              try {
                const dataUrl = await renderExportSceneToPng();
                if (!dataUrl) {
                  return;
                }

                const anchor = document.createElement("a");
                anchor.download = `${buildDraft.title || VERSION_LABELS[buildDraft.version]}-build.png`;
                anchor.href = dataUrl;
                anchor.click();
                setBuildStatus("PNG を出力しました。");
              } catch {
                setBuildStatus("PNG の出力に失敗しました。");
              } finally {
                setIsExporting(false);
              }
            }}
            onPreview={async () => {
              setIsPreviewing(true);
              try {
                const dataUrl = await renderExportSceneToPng();
                if (!dataUrl) {
                  return;
                }

                setPreviewImageUrl(dataUrl);
                setBuildStatus("PNG プレビューを更新しました。");
              } catch {
                setBuildStatus("PNG プレビューの生成に失敗しました。");
              } finally {
                setIsPreviewing(false);
              }
            }}
            onReset={() => {
              const resetBuild = createEmptyBuild(buildDraft.game);
              resetBuild.version = buildDraft.version;
              setBuildDraft(resetBuild);
              router.replace(buildEditorHref(buildDraft.game, buildDraft.version));
            }}
            onSave={() => {
              if (validation.errors.length > 0) {
                setBuildStatus("保存前にエラーを解消してください。");
                return;
              }

              const savedBuild = upsertBuild(buildDraft);
              window.localStorage.removeItem(draftStorageKey);
              setBuildDraft(savedBuild);
              setBuildStatus("構築を保存しました。");
              router.replace(buildEditorHref(savedBuild.game, savedBuild.version, savedBuild.id));
            }}
            onPngBackgroundModeChange={setPngBackgroundMode}
          />
        </div>

        {buildStatus ? <p className={`mt-4 text-sm ${statusToneClass}`}>{buildStatus}</p> : null}
        <p className="mt-3 text-xs text-white/45">この画面の入力内容はブラウザに一時保存されるため、保存前にリロードしても復元されます。</p>
      </section>

      <section className="relative z-0 grid gap-6 overflow-visible 2xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="grid min-w-0 gap-6">
          <BasicInfoSection
            buildRecord={buildDraft}
            onGameChange={(game) =>
              setBuildDraft((currentDraft) =>
                currentDraft
                  ? normalizeMmsf3BuildRecord({
                      ...currentDraft,
                      game,
                      version: getDefaultVersionForGame(game),
                    })
                  : currentDraft,
              )
            }
            onOverviewChange={(value) => updateCommonSection("overview", value)}
            onTagsChange={(values) => updateCommonSection("tags", values)}
            onTitleChange={(value) =>
              setBuildDraft((currentDraft) => (currentDraft ? { ...currentDraft, title: value } : currentDraft))
            }
            onVersionChange={(version) =>
              setBuildDraft((currentDraft) =>
                currentDraft
                  ? normalizeMmsf3BuildRecord({
                      ...currentDraft,
                      version,
                      gameSpecificSections:
                        currentDraft.game === "mmsf2"
                          ? {
                              ...currentDraft.gameSpecificSections,
                              mmsf2: {
                                ...currentDraft.gameSpecificSections.mmsf2,
                                defaultTribeAbilityEnabled: true,
                              },
                            }
                          : currentDraft.gameSpecificSections,
                    })
                  : currentDraft,
              )
            }
          />

          <div className="glass-panel relative z-0 grid gap-4 overflow-visible focus-within:z-40">
            <p className="text-sm font-semibold text-white">ロックマン</p>

            {buildDraft.game === "mmsf1" ? (
              <>
                <Mmsf1EditorSections
                  state={buildDraft.gameSpecificSections.mmsf1}
                  onEnhancementChange={(value) =>
                    setBuildDraft((currentDraft) =>
                      currentDraft
                        ? { ...currentDraft, gameSpecificSections: { ...currentDraft.gameSpecificSections, mmsf1: { ...currentDraft.gameSpecificSections.mmsf1, enhancement: value } } }
                        : currentDraft,
                    )
                  }
                />
                <Mmsf1WarRockSection
                  state={buildDraft.gameSpecificSections.mmsf1}
                  warRockWeapons={MASTER_DATA.warRockWeaponsByGame.mmsf1}
                  sourceSuggestions={sourceSuggestions}
                  missingWarRockWeaponSourceNames={missingWarRockWeaponSourceNames}
                  resolveKnownSources={getMmsf1WarRockWeaponSources}
                  onWarRockWeaponChange={(value) =>
                    setBuildDraft((currentDraft) =>
                      currentDraft
                        ? {
                            ...currentDraft,
                            gameSpecificSections: {
                              ...currentDraft.gameSpecificSections,
                              mmsf1: {
                                ...currentDraft.gameSpecificSections.mmsf1,
                                warRockWeapon: value,
                                warRockWeaponSources: syncMmsf1WarRockWeaponSources(value, currentDraft.gameSpecificSections.mmsf1.warRockWeaponSources),
                              },
                            },
                          }
                        : currentDraft,
                    )
                  }
                  onWarRockWeaponSourcesChange={(sourceEntries) =>
                    setBuildDraft((currentDraft) =>
                      currentDraft
                        ? { ...currentDraft, gameSpecificSections: { ...currentDraft.gameSpecificSections, mmsf1: { ...currentDraft.gameSpecificSections.mmsf1, warRockWeaponSources: sourceEntries } } }
                        : currentDraft,
                    )
                  }
                />
              </>
            ) : null}

            {buildDraft.game === "mmsf2" ? (
              <>
                <Mmsf2EditorSections
                  state={buildDraft.gameSpecificSections.mmsf2}
                  onEnhancementChange={(value) =>
                    setBuildDraft((currentDraft) =>
                      currentDraft
                        ? { ...currentDraft, gameSpecificSections: { ...currentDraft.gameSpecificSections, mmsf2: { ...currentDraft.gameSpecificSections.mmsf2, enhancement: value } } }
                        : currentDraft,
                    )
                  }
                />
                <Mmsf2WarRockSection
                  state={buildDraft.gameSpecificSections.mmsf2}
                  warRockWeapons={MASTER_DATA.warRockWeaponsByGame.mmsf2}
                  sourceSuggestions={sourceSuggestions}
                  missingWarRockWeaponSourceNames={missingWarRockWeaponSourceNames}
                  resolveKnownSources={getMmsf2WarRockWeaponSources}
                  onWarRockWeaponChange={(value) =>
                    setBuildDraft((currentDraft) =>
                      currentDraft
                        ? {
                            ...currentDraft,
                            gameSpecificSections: {
                              ...currentDraft.gameSpecificSections,
                              mmsf2: {
                                ...currentDraft.gameSpecificSections.mmsf2,
                                warRockWeapon: value,
                                warRockWeaponSources: syncMmsf2WarRockWeaponSources(value, currentDraft.gameSpecificSections.mmsf2.warRockWeaponSources),
                              },
                            },
                          }
                        : currentDraft,
                    )
                  }
                  onWarRockWeaponSourcesChange={(sourceEntries) =>
                    setBuildDraft((currentDraft) =>
                      currentDraft
                        ? { ...currentDraft, gameSpecificSections: { ...currentDraft.gameSpecificSections, mmsf2: { ...currentDraft.gameSpecificSections.mmsf2, warRockWeaponSources: sourceEntries } } }
                        : currentDraft,
                    )
                  }
                />
              </>
            ) : null}

            {buildDraft.game === "mmsf3" && normalizedMmsf3State ? (
              <Mmsf3EditorSections
                version={buildDraft.version}
                state={normalizedMmsf3State}
                abilityNameSuggestions={abilityNameSuggestions}
                sourceSuggestions={sourceSuggestions}
                missingAbilitySourceNames={missingAbilitySourceNames}
                missingWarRockWeaponSourceNames={missingWarRockWeaponSourceNames}
                onNoiseChange={(noise) => setBuildDraft((currentDraft) => (currentDraft ? updateMmsf3Noise(currentDraft, noise) : currentDraft))}
                onWarRockWeaponChange={(value) => setBuildDraft((currentDraft) => (currentDraft ? updateMmsf3WarRockWeapon(currentDraft, value) : currentDraft))}
                onWarRockWeaponSourcesChange={(sourceEntries) => setBuildDraft((currentDraft) => (currentDraft ? updateMmsf3WarRockWeaponSources(currentDraft, sourceEntries) : currentDraft))}
                onPlayerRezonCardChange={(value) => setBuildDraft((currentDraft) => (currentDraft ? updateMmsf3PlayerRezonCard(currentDraft, value) : currentDraft))}
                onWhiteCardSetIdChange={(value) => setBuildDraft((currentDraft) => (currentDraft ? updateMmsf3WhiteCardSetId(currentDraft, value) : currentDraft))}
                onNoiseCardIdsChange={(values) => setBuildDraft((currentDraft) => (currentDraft ? updateMmsf3NoiseCardIds(currentDraft, values) : currentDraft))}
                onAbilitiesChange={(abilityEntries) => setBuildDraft((currentDraft) => (currentDraft ? updateMmsf3AbilityEntries(currentDraft, abilityEntries) : currentDraft))}
                onAbilitySourcesChange={(sourceEntries) => setBuildDraft((currentDraft) => (currentDraft ? updateMmsf3AbilitySources(currentDraft, sourceEntries) : currentDraft))}
              />
            ) : null}

            {buildDraft.game === "mmsf2" ? (
              <Mmsf2AbilitySection
                entries={buildDraft.commonSections.abilities}
                abilitySources={buildDraft.commonSections.abilitySources}
                defaultTribeAbilityEnabled={buildDraft.gameSpecificSections.mmsf2.defaultTribeAbilityEnabled}
                kokouNoKakera={buildDraft.gameSpecificSections.mmsf2.kokouNoKakera}
                version={buildDraft.version}
                abilityNameSuggestions={abilityNameSuggestions}
                sourceSuggestions={sourceSuggestions}
                missingAbilitySourceNames={missingAbilitySourceNames}
                onAbilitiesChange={updateAbilityEntries}
                onAbilitySourcesChange={(sourceEntries) => updateCommonSection("abilitySources", sourceEntries)}
                onDefaultTribeAbilityEnabledChange={(value) =>
                  setBuildDraft((currentDraft) =>
                    currentDraft && currentDraft.game === "mmsf2"
                      ? {
                          ...currentDraft,
                          gameSpecificSections: {
                            ...currentDraft.gameSpecificSections,
                            mmsf2: {
                              ...currentDraft.gameSpecificSections.mmsf2,
                              defaultTribeAbilityEnabled: value,
                            },
                          },
                        }
                      : currentDraft,
                  )
                }
              />
            ) : null}
          </div>

          <div className="glass-panel relative z-0 grid gap-4 overflow-visible focus-within:z-40">
            <p className="text-sm font-semibold text-white">フォルダー</p>

            <CardListEditor
              title="対戦構築カード"
              cardEntries={buildDraft.commonSections.cards}
              onChange={updateFolderEntries}
              suggestions={cardSuggestions}
              totalLimit={
                buildDraft.game === "mmsf2"
                  ? getMmsf2NormalCardTotalLimit(
                      buildDraft.gameSpecificSections.mmsf2.starCards,
                      buildDraft.gameSpecificSections.mmsf2.blankCards,
                      versionRule.folderLimit,
                    )
                  : undefined
              }
              allowRegularSelection
              regularLabel={
                buildDraft.game === "mmsf1" || buildDraft.game === "mmsf2" ? "FAV" : "REG"
              }
              regularLimit={
                buildDraft.game === "mmsf1" ? 6 : buildDraft.game === "mmsf2" ? 4 : 1
              }
              regularSelectionMode={
                buildDraft.game === "mmsf1" || buildDraft.game === "mmsf2" ? "copy-count" : "entry-toggle"
              }
              regularActiveTone="red"
              secondarySelectionLabel={buildDraft.game === "mmsf3" && mmsf3GeminiTagMode ? "TAG" : undefined}
              secondarySelectionLimit={buildDraft.game === "mmsf3" && mmsf3GeminiTagMode ? 2 : undefined}
            />

            {buildDraft.game === "mmsf2" ? (
              <CardListEditor
                title="スターカード"
                cardEntries={buildDraft.gameSpecificSections.mmsf2.starCards}
                onChange={(starCardEntries) =>
                  setBuildDraft((currentDraft) => {
                    if (!currentDraft || currentDraft.game !== "mmsf2") {
                      return currentDraft;
                    }

                    const normalizedBlankCardEntries = createMmsf2BlankCardDraftEntries(
                      currentDraft.gameSpecificSections.mmsf2.blankCards,
                      getMmsf2BlankCardTotalLimit(currentDraft.commonSections.cards, starCardEntries, getVersionRuleSet(currentDraft.version).folderLimit),
                      true,
                    );
                    const nextCardSourceEntries = syncSourceEntries(
                      [...currentDraft.commonSections.cards, ...starCardEntries, ...normalizedBlankCardEntries],
                      currentDraft.commonSections.cardSources,
                      (name) => getKnownCardSources(currentDraft.game, name, currentDraft.version),
                    );

                    return {
                      ...currentDraft,
                      commonSections: { ...currentDraft.commonSections, cardSources: nextCardSourceEntries },
                      gameSpecificSections: {
                        ...currentDraft.gameSpecificSections,
                        mmsf2: {
                          ...currentDraft.gameSpecificSections.mmsf2,
                          starCards: starCardEntries,
                          blankCards: normalizedBlankCardEntries,
                        },
                      },
                    };
                  })
                }
                suggestions={mmsf2StarCardSuggestions}
                hideQuantity
                hideDelete
              />
            ) : null}

            {buildDraft.game === "mmsf2" ? (
              <CardListEditor
                title="ブランクカード"
                cardEntries={buildDraft.gameSpecificSections.mmsf2.blankCards}
                onChange={updateMmsf2BlankCardEntries}
                suggestions={mmsf2BlankCardSuggestions}
                hideQuantity
              />
            ) : null}

            <SourceListEditor
              title="カード入手方法"
              entries={buildDraft.commonSections.cardSources}
              onChange={(sourceEntries) => updateCommonSection("cardSources", sourceEntries)}
              game={buildDraft.game}
              version={buildDraft.version}
              nameSuggestions={cardSourceNameSuggestions}
              sourceSuggestions={sourceSuggestions}
              missingNames={missingCardSourceNames}
              useKnownSourceSuggestions
              actionMode="owned"
            />
          </div>

          {buildDraft.game === "mmsf3" ? (
            normalizedMmsf3State ? (
              <Mmsf3BrotherRouletteSection
                slots={normalizedMmsf3State.brotherRouletteSlots}
                sssLevels={normalizedMmsf3State.sssLevels}
                onBrotherChange={(brotherRouletteSlots) =>
                  setBuildDraft((currentDraft) => (currentDraft ? updateMmsf3BrotherRouletteSlots(currentDraft, brotherRouletteSlots) : currentDraft))
                }
                onSssChange={(sssLevels) =>
                  setBuildDraft((currentDraft) => (currentDraft ? updateMmsf3SssLevels(currentDraft, sssLevels) : currentDraft))
                }
                isDisabled={normalizedMmsf3State.noise === "ブライノイズ"}
              />
            ) : null
          ) : buildDraft.game === "mmsf2" ? (
            <Mmsf2BrotherSection
              entries={buildDraft.commonSections.brothers}
              onChange={(brotherEntries) => updateCommonSection("brothers", brotherEntries)}
              getCardSuggestionsForVersion={(version) => {
                const resolvedVersion = (version || buildDraft.version) as VersionId;
                return sortCardSuggestions(
                  "mmsf2",
                  uniqueStrings([
                    ...getCardSuggestions("mmsf2", resolvedVersion),
                    ...getMmsf2BlankCardSuggestions(resolvedVersion),
                  ]),
                  resolvedVersion,
                );
              }}
              isDisabled={buildDraft.gameSpecificSections.mmsf2.enhancement === "burai"}
              kokouNoKakera={buildDraft.gameSpecificSections.mmsf2.kokouNoKakera}
              onKokouNoKakeraChange={(value) =>
                setBuildDraft((currentDraft) =>
                  currentDraft
                    ? { ...currentDraft, gameSpecificSections: { ...currentDraft.gameSpecificSections, mmsf2: { ...currentDraft.gameSpecificSections.mmsf2, kokouNoKakera: value } } }
                    : currentDraft,
                )
              }
            />
          ) : buildDraft.game === "mmsf1" ? (
            <Mmsf1BrotherSection
              entries={buildDraft.commonSections.brothers}
              onChange={(brotherEntries) => updateCommonSection("brothers", brotherEntries)}
              cardSuggestions={cardSuggestions}
              currentVersion={buildDraft.version as Extract<VersionId, "pegasus" | "leo" | "dragon">}
              isDisabled={false}
            />
          ) : (
            <BrotherListEditor
              brotherEntries={buildDraft.commonSections.brothers}
              onChange={(brotherEntries) => updateCommonSection("brothers", brotherEntries)}
              suggestions={brotherSuggestions}
              buildEmptyBrother={buildEmptyBrother}
            />
          )}
        </div>

        <div className="grid min-w-0 gap-6">
          <BuildEditorValidationPanel validation={validation} />
        </div>
      </section>

      <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0">
        <ExportScene ref={exportRef} build={buildDraft} backgroundEnabled={pngBackgroundMode === "solid"} />
      </div>

      <PngPreviewModal previewImageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
    </AppShell>
  );
}
