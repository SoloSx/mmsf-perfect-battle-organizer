"use client";

import { useId, type ReactNode } from "react";
import type { BrotherKind, BrotherProfile } from "@/lib/types";

const BROTHER_KIND_OPTIONS: { value: BrotherKind; label: string }[] = [
  { value: "story", label: "ゲーム内" },
  { value: "auto", label: "オート" },
  { value: "real", label: "リアル" },
  { value: "event", label: "限定配信/イベント" },
];

export function BrotherListEditor({
  brotherEntries,
  onChange,
  suggestions,
  buildEmptyBrother,
  rezonCardOptions,
  extraContent,
}: {
  brotherEntries: BrotherProfile[];
  onChange: (brotherEntries: BrotherProfile[]) => void;
  suggestions: string[];
  buildEmptyBrother: () => BrotherProfile;
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
        {brotherEntries.map((brotherEntry) => (
          <div
            key={brotherEntry.id}
            className="grid gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 md:grid-cols-[1fr_180px_1fr_auto]"
          >
            <input
              list={listId}
              value={brotherEntry.name}
              onChange={(event) =>
                onChange(
                  brotherEntries.map((item) =>
                    item.id === brotherEntry.id
                      ? { ...item, name: event.target.value }
                      : item,
                  ),
                )
              }
              placeholder="ブラザー名"
              className="field-shell"
            />
            <select
              value={brotherEntry.kind}
              onChange={(event) =>
                onChange(
                  brotherEntries.map((item) =>
                    item.id === brotherEntry.id
                      ? { ...item, kind: event.target.value as BrotherKind }
                      : item,
                  ),
                )
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
              value={brotherEntry.favoriteCards.join(", ")}
              onChange={(event) =>
                onChange(
                  brotherEntries.map((item) =>
                    item.id === brotherEntry.id
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
              onClick={() =>
                onChange(
                  brotherEntries.filter((item) => item.id !== brotherEntry.id),
                )
              }
            >
              削除
            </button>
            {rezonCardOptions?.length ? (
              <div className="md:col-span-2">
                <p className="mb-2 text-[11px] font-semibold tracking-[0.28em] text-white/45">
                  REZON CARD
                </p>
                <select
                  value={brotherEntry.rezonCard ?? ""}
                  onChange={(event) =>
                    onChange(
                      brotherEntries.map((item) =>
                        item.id === brotherEntry.id
                          ? { ...item, rezonCard: event.target.value }
                          : item,
                      ),
                    )
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
              value={brotherEntry.notes}
              onChange={(event) =>
                onChange(
                  brotherEntries.map((item) =>
                    item.id === brotherEntry.id
                      ? { ...item, notes: event.target.value }
                      : item,
                  ),
                )
              }
              placeholder="ブラザーの補足"
              className="field-shell md:col-span-4 min-h-24"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="secondary-button mt-4"
        onClick={() => onChange([...brotherEntries, buildEmptyBrother()])}
      >
        ブラザーを追加
      </button>
      {extraContent ? <div className="mt-4 grid gap-4">{extraContent}</div> : null}
    </div>
  );
}
