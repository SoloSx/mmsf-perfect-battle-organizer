"use client";

import { useId, useState } from "react";
import { SearchableSuggestionInput } from "@/components/searchable-suggestion-input";
import { getKnownCardSources, getSourceDescription } from "@/lib/guide-card-catalog";
import type { BuildSourceEntry, GameId, VersionId } from "@/lib/types";
import { createId, uniqueStrings } from "@/lib/utils";

const BATTLE_CARD_ROW_GRID_CLASS = "min-[1180px]:grid-cols-[minmax(0,1fr)_110px_88px_112px]";

export type KnownSourcesResolver = (name: string) => string[];

export function buildEmptySource(): BuildSourceEntry {
  return { id: createId(), name: "", source: "", notes: "", isOwned: false };
}

export function haveSameSourceEntries(left: BuildSourceEntry[], right: BuildSourceEntry[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftEntry = left[index];
    const rightEntry = right[index];

    if (
      leftEntry.id !== rightEntry.id ||
      leftEntry.name !== rightEntry.name ||
      leftEntry.source !== rightEntry.source ||
      leftEntry.notes !== rightEntry.notes ||
      leftEntry.isOwned !== rightEntry.isOwned
    ) {
      return false;
    }
  }

  return true;
}

export function getMissingSourceNames(
  entries: Array<{ name: string }>,
  sources: BuildSourceEntry[],
  resolveKnownSources: KnownSourcesResolver,
) {
  const registeredSourceNames = new Set(
    sources
      .map((entry) => ({
        name: entry.name.trim(),
        source: entry.source.trim(),
      }))
      .filter((entry) => entry.name && entry.source)
      .map((entry) => entry.name),
  );

  return uniqueStrings(entries.map((entry) => entry.name.trim()).filter(Boolean)).filter((name) => {
    if (registeredSourceNames.has(name)) {
      return false;
    }

    return resolveKnownSources(name).length === 0;
  });
}

export function syncSourceEntries(
  entries: Array<{ name: string }>,
  sources: BuildSourceEntry[],
  resolveKnownSources: KnownSourcesResolver,
) {
  const groupedExistingEntries = new Map<string, BuildSourceEntry[]>();

  for (const sourceEntry of sources) {
    const name = sourceEntry.name.trim();
    if (!name) {
      continue;
    }

    const grouped = groupedExistingEntries.get(name) ?? [];
    grouped.push(sourceEntry);
    groupedExistingEntries.set(name, grouped);
  }

  const nextEntries: BuildSourceEntry[] = [];

  for (const name of uniqueStrings(entries.map((entry) => entry.name.trim()).filter(Boolean))) {
    const existingEntries = [...(groupedExistingEntries.get(name) ?? [])];
    const pullExistingEntry = (predicate: (entry: BuildSourceEntry) => boolean) => {
      const matchIndex = existingEntries.findIndex(predicate);
      if (matchIndex === -1) {
        return null;
      }
      return existingEntries.splice(matchIndex, 1)[0] ?? null;
    };

    const knownSources = uniqueStrings(resolveKnownSources(name).map((source) => source.trim()).filter(Boolean));

    if (knownSources.length > 0) {
      for (const source of knownSources) {
        const matchedEntry =
          pullExistingEntry((entry) => entry.source.trim() === source) ?? pullExistingEntry((entry) => !entry.source.trim());

        nextEntries.push(
          matchedEntry
            ? { ...matchedEntry, name, source }
            : {
                id: createId(),
                name,
                source,
                notes: "",
                isOwned: false,
              },
        );
      }

      for (const entry of existingEntries) {
        nextEntries.push({ ...entry, name });
      }

      continue;
    }

    if (existingEntries.length > 0) {
      for (const entry of existingEntries) {
        nextEntries.push({ ...entry, name });
      }

      continue;
    }

    nextEntries.push({
      id: createId(),
      name,
      source: "",
      notes: "",
      isOwned: false,
    });
  }

  return nextEntries;
}

export function SourceListEditor({
  title,
  entries,
  onChange,
  game,
  version,
  nameSuggestions,
  sourceSuggestions,
  missingNames = [],
  useKnownSourceSuggestions = false,
  actionMode = "delete",
  resolveKnownSources,
  emptyOwnedMessage = "未所持のカードはありません。すべて所持済みです。",
}: {
  title: string;
  entries: BuildSourceEntry[];
  onChange: (entries: BuildSourceEntry[]) => void;
  game: GameId;
  version: VersionId;
  nameSuggestions: string[];
  sourceSuggestions: string[];
  missingNames?: string[];
  useKnownSourceSuggestions?: boolean;
  actionMode?: "delete" | "owned";
  resolveKnownSources?: KnownSourcesResolver;
  emptyOwnedMessage?: string;
}) {
  const [selectedSourceInfo, setSelectedSourceInfo] = useState<{
    name: string;
    items: Array<{
      source: string;
      description: string | null;
    }>;
  } | null>(null);
  const sourceInfoTitleId = useId();

  const groupedOwnedEntries =
    actionMode === "owned"
      ? uniqueStrings(entries.map((entry) => entry.name.trim()).filter(Boolean)).map((name) => {
          const groupedEntries = entries.filter((entry) => entry.name.trim() === name);
          const items = uniqueStrings(groupedEntries.map((entry) => entry.source.trim()).filter(Boolean)).map((source) => ({
            source,
            description: getSourceDescription(game, source),
          }));

          return {
            name,
            isOwned: groupedEntries.every((entry) => entry.isOwned),
            items,
          };
        })
      : [];
  const visibleOwnedEntries = actionMode === "owned" ? groupedOwnedEntries.filter((entry) => !entry.isOwned) : [];

  return (
    <div className="glass-panel-soft relative z-0 p-6 focus-within:z-20">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-white">{title}</label>
        {missingNames.length > 0 ? <span className="text-xs font-medium text-red-200/85">{missingNames.length}件未入力</span> : null}
      </div>
      {missingNames.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {missingNames.map((name) => (
            <span key={name} className="rounded-full border border-red-300/35 bg-red-500/12 px-3 py-1 text-xs font-medium text-red-100">
              {name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {actionMode === "owned"
          ? visibleOwnedEntries.length > 0
            ? visibleOwnedEntries.map((entry) => (
              <div
                key={entry.name}
                className={`relative z-0 grid items-center gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 focus-within:z-10 ${BATTLE_CARD_ROW_GRID_CLASS}`}
              >
                <div className="field-shell flex min-w-0 items-center">
                  <span className="truncate">{entry.name}</span>
                </div>
                <button
                  type="button"
                  className="secondary-button w-full justify-center md:col-span-2"
                  onClick={() =>
                    setSelectedSourceInfo((current) =>
                      current?.name === entry.name
                        ? null
                        : {
                            name: entry.name,
                            items: entry.items,
                          },
                    )
                  }
                >
                  入手方法詳細
                </button>
                <button
                  type="button"
                  aria-pressed={entry.isOwned}
                  className={`secondary-button w-full justify-center font-medium ${
                    entry.isOwned
                      ? "border-emerald-200/80 bg-emerald-500/24 text-emerald-50 hover:bg-emerald-500/30"
                      : "border-emerald-300/65 bg-emerald-500/16 text-emerald-100 hover:bg-emerald-500/24"
                  }`}
                  onClick={() =>
                    onChange(
                      entries.map((item) =>
                        item.name.trim() === entry.name ? { ...item, isOwned: !entry.isOwned } : item,
                      ),
                    )
                  }
                >
                  所持済み
                </button>
              </div>
            ))
            : (
              <div className="rounded-3xl border border-emerald-300/28 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
                {emptyOwnedMessage}
              </div>
            )
          : entries.map((entry) => {
              const knownSources =
                useKnownSourceSuggestions && entry.name.trim()
                  ? (resolveKnownSources?.(entry.name.trim()) ?? getKnownCardSources(game, entry.name.trim(), version))
                  : [];
              const rowSourceSuggestions = knownSources.length > 0 ? uniqueStrings([...knownSources, ...sourceSuggestions]) : sourceSuggestions;

              return (
                <div
                  key={entry.id}
                  className="relative z-0 grid items-center gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 focus-within:z-10 md:grid-cols-[1fr_110px_auto]"
                >
                  <SearchableSuggestionInput
                    value={entry.name}
                    onChange={(value) => onChange(entries.map((item) => (item.id === entry.id ? { ...item, name: value } : item)))}
                    suggestions={nameSuggestions}
                    placeholder="対象名"
                    className="field-shell"
                  />
                  <SearchableSuggestionInput
                    value={entry.source}
                    onChange={(value) =>
                      onChange(entries.map((item) => (item.id === entry.id ? { ...item, source: value } : item)))
                    }
                    suggestions={rowSourceSuggestions}
                    placeholder="入手方法"
                    className="field-shell"
                  />
                  <button
                    type="button"
                    className="danger-button w-full justify-center"
                    onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}
                  >
                    削除
                  </button>
                  <textarea
                    value={entry.notes}
                    onChange={(event) =>
                      onChange(entries.map((item) => (item.id === entry.id ? { ...item, notes: event.target.value } : item)))
                    }
                    placeholder="補足メモ"
                    className="field-shell min-h-24 md:col-span-3"
                  />
                </div>
              );
            })}
      </div>
      {actionMode === "delete" ? (
        <button type="button" className="secondary-button mt-4" onClick={() => onChange([...entries, buildEmptySource()])}>
          行を追加
        </button>
      ) : null}
      {selectedSourceInfo ? (
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/6 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p id={sourceInfoTitleId} className="text-sm font-semibold text-white">
                {selectedSourceInfo.name}
              </p>
              <p className="mt-1 text-xs text-white/52">既知の入手方法一覧</p>
            </div>
            <button type="button" className="secondary-button" onClick={() => setSelectedSourceInfo(null)}>
              閉じる
            </button>
          </div>
          <ul aria-labelledby={sourceInfoTitleId} className="mt-3 space-y-3 text-sm leading-6 text-white/78">
            {selectedSourceInfo.items.map((item) => (
              <li key={`${selectedSourceInfo.name}-${item.source}`}>
                <p className="font-medium text-white">{item.source}</p>
                {item.description ? <p className="mt-1 text-white/58">{item.description}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
