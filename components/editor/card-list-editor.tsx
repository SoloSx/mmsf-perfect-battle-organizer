"use client";

import { SearchableSuggestionInput } from "@/components/searchable-suggestion-input";
import { ensureTrailingEmptyCardEntry } from "@/components/editor/build-editor-state";
import type { BuildCardEntry } from "@/lib/types";

const BATTLE_CARD_ROW_GRID_CLASS =
  "min-[1180px]:grid-cols-[minmax(0,1fr)_110px_88px_112px]";

export function CardListEditor({
  title,
  cardEntries,
  onChange,
  suggestions,
  allowRegularSelection = false,
  regularLabel = "REG",
  regularLimit = 1,
  regularSelectionMode = "entry-toggle",
  regularActiveTone = "red",
  secondarySelectionLabel,
  secondarySelectionLimit,
  hideQuantity = false,
  hideDelete = false,
  maxEntries,
  totalLimit,
}: {
  title: string;
  cardEntries: BuildCardEntry[];
  onChange: (cardEntries: BuildCardEntry[]) => void;
  suggestions: string[];
  allowRegularSelection?: boolean;
  regularLabel?: string;
  regularLimit?: number;
  regularSelectionMode?: "copy-count" | "entry-toggle";
  regularActiveTone?: "red" | "ice-blue";
  secondarySelectionLabel?: string;
  secondarySelectionLimit?: number;
  hideQuantity?: boolean;
  hideDelete?: boolean;
  maxEntries?: number;
  totalLimit?: number;
}) {
  const total = cardEntries.reduce(
    (sum, cardEntry) => sum + (cardEntry.name.trim() ? cardEntry.quantity : 0),
    0,
  );
  const secondarySelectionEnabled =
    typeof secondarySelectionLabel === "string" &&
    secondarySelectionLabel.length > 0 &&
    typeof secondarySelectionLimit === "number";
  const hasSelectedRegularCard = cardEntries.some((cardEntry) => cardEntry.name.trim() && cardEntry.isRegular);
  const regularCount =
    regularSelectionMode === "copy-count"
      ? cardEntries.reduce(
          (sum, cardEntry) =>
            sum +
            (cardEntry.name.trim()
              ? Math.max(0, Math.min(cardEntry.quantity, cardEntry.favoriteCount ?? 0))
              : 0),
          0,
        )
      : cardEntries.filter((cardEntry) => cardEntry.name.trim() && cardEntry.isRegular).length;
  const secondarySelectionCount = secondarySelectionEnabled
    ? cardEntries.reduce(
        (sum, cardEntry) =>
          sum +
          (cardEntry.name.trim()
            ? Math.max(0, Math.min(cardEntry.quantity, cardEntry.favoriteCount ?? 0))
            : 0),
        0,
      )
    : 0;
  const activeSelectionButtonClassName =
    regularActiveTone === "ice-blue"
      ? "border-sky-200/80 bg-sky-300/16 text-sky-50"
      : "border-red-300/70 bg-red-500/15 text-red-100";
  const activeSecondarySelectionFieldClassName =
    "field-shell border-sky-200/80 bg-sky-300/16 text-sky-50 placeholder:text-sky-50/55";

  const updateCardEntries = (nextCardEntries: BuildCardEntry[]) => {
    onChange(ensureTrailingEmptyCardEntry(nextCardEntries, { maxEntries, totalLimit }));
  };

  return (
    <div className="glass-panel-soft relative z-0 overflow-visible p-6 focus-within:z-30">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-white">{title}</label>
        <div className="flex items-center gap-3 text-xs text-white/45">
          {allowRegularSelection ? (
            secondarySelectionEnabled ? (
              <>
                <span>
                  {regularLabel} {regularCount}/{regularLimit}
                </span>
                <span>
                  {secondarySelectionLabel} {secondarySelectionCount}/{secondarySelectionLimit}
                </span>
              </>
            ) : (
              <span>
                {regularLabel} {regularCount}/{regularLimit}
              </span>
            )
          ) : null}
          {!hideQuantity && (
            <span>
              合計 {total}
              {typeof totalLimit === "number" ? `/${totalLimit}` : ""}
            </span>
          )}
          {typeof maxEntries === "number" ? (
            <span>
              行 {cardEntries.length}/{maxEntries}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {cardEntries.map((cardEntry) => {
          const otherEntriesTotal = cardEntries.reduce(
            (sum, item) =>
              sum + (item.id !== cardEntry.id && item.name.trim() ? item.quantity : 0),
            0,
          );
          const maxQuantity =
            typeof totalLimit === "number"
              ? Math.max(1, totalLimit - otherEntriesTotal)
              : 99;
          const renderSecondarySelection =
            secondarySelectionEnabled && hasSelectedRegularCard && !cardEntry.isRegular;
          const remainingSecondarySelections = secondarySelectionEnabled
            ? Math.max(
                0,
                secondarySelectionLimit - secondarySelectionCount + (cardEntry.favoriteCount ?? 0),
              )
            : 0;

          return (
            <div
              key={cardEntry.id}
              className={`relative z-0 grid gap-3 overflow-visible rounded-2xl border border-white/10 bg-white/6 p-4 focus-within:z-30 ${
                hideQuantity && hideDelete
                  ? ""
                  : hideQuantity
                    ? "min-[1180px]:grid-cols-[minmax(0,1fr)_112px]"
                    : BATTLE_CARD_ROW_GRID_CLASS
              }`}
            >
              <SearchableSuggestionInput
                value={cardEntry.name}
                onChange={(value) =>
                  updateCardEntries(
                    cardEntries.map((item) =>
                      item.id === cardEntry.id ? { ...item, name: value } : item,
                    ),
                  )
                }
                suggestions={suggestions}
                placeholder="カード名"
                className="field-shell"
              />
              {!hideQuantity ? (
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={cardEntry.quantity}
                  onChange={(event) =>
                    updateCardEntries(
                      cardEntries.map((item) =>
                        item.id === cardEntry.id
                          ? {
                              ...item,
                              quantity: Math.max(
                                1,
                                Math.min(maxQuantity, Number(event.target.value || 1)),
                              ),
                              favoriteCount:
                                regularSelectionMode === "copy-count"
                                  ? Math.min(
                                      item.favoriteCount ?? 0,
                                      Math.max(
                                        1,
                                        Math.min(maxQuantity, Number(event.target.value || 1)),
                                      ),
                                    )
                                  : item.favoriteCount,
                            }
                          : item,
                      ),
                    )
                  }
                  className="field-shell"
                />
              ) : null}
              {allowRegularSelection ? (
                renderSecondarySelection ? (
                  <div className="min-w-0">
                    {(cardEntry.favoriteCount ?? 0) > 0 ? (
                      <input
                        type="number"
                        min={0}
                        max={Math.min(cardEntry.quantity, remainingSecondarySelections)}
                        value={Math.max(
                          0,
                          Math.min(
                            cardEntry.quantity,
                            remainingSecondarySelections,
                            cardEntry.favoriteCount ?? 0,
                          ),
                        )}
                        onChange={(event) =>
                          updateCardEntries(
                            cardEntries.map((item) =>
                              item.id === cardEntry.id
                                ? {
                                    ...item,
                                    favoriteCount: Math.max(
                                      0,
                                      Math.min(
                                        item.quantity,
                                        remainingSecondarySelections,
                                        Math.trunc(Number(event.target.value || 0)),
                                      ),
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        aria-label={`${secondarySelectionLabel}枚数`}
                        className={activeSecondarySelectionFieldClassName}
                      />
                    ) : (
                      <button
                        type="button"
                        aria-pressed={false}
                        disabled={remainingSecondarySelections <= 0}
                        className="field-shell w-full justify-center border-white/12 bg-white/5 text-sm font-semibold text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/4 disabled:text-white/35"
                        onClick={() =>
                          updateCardEntries(
                            cardEntries.map((item) =>
                              item.id === cardEntry.id
                                ? {
                                    ...item,
                                    favoriteCount: Math.min(
                                      Math.max(1, item.quantity),
                                      remainingSecondarySelections,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        {secondarySelectionLabel}
                      </button>
                    )}
                  </div>
                ) : regularSelectionMode === "copy-count" ? (
                  <div className="min-w-0">
                    {(cardEntry.favoriteCount ?? 0) > 0 ? (
                      <input
                        type="number"
                        min={0}
                        max={Math.min(cardEntry.quantity, regularLimit)}
                        value={Math.max(
                          0,
                          Math.min(
                            cardEntry.quantity,
                            regularLimit,
                            cardEntry.favoriteCount ?? 0,
                          ),
                        )}
                        onChange={(event) =>
                          updateCardEntries(
                            cardEntries.map((item) =>
                              item.id === cardEntry.id
                                ? {
                                    ...item,
                                    favoriteCount: Math.max(
                                      0,
                                      Math.min(
                                        item.quantity,
                                        regularLimit,
                                        Math.trunc(Number(event.target.value || 0)),
                                      ),
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        aria-label={`${regularLabel}枚数`}
                        className="field-shell"
                      />
                    ) : (
                      <button
                        type="button"
                        aria-pressed={false}
                        className="field-shell w-full justify-center border-white/12 bg-white/5 text-sm font-semibold text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                        onClick={() =>
                          updateCardEntries(
                            cardEntries.map((item) =>
                              item.id === cardEntry.id
                                ? {
                                    ...item,
                                    favoriteCount: Math.min(
                                      Math.max(1, item.quantity),
                                      regularLimit,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        {regularLabel}
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-pressed={cardEntry.isRegular}
                    disabled={!cardEntry.isRegular && regularCount >= regularLimit}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${
                      cardEntry.isRegular
                        ? activeSelectionButtonClassName
                        : "border-white/12 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/4 disabled:text-white/35"
                    } w-full justify-center`}
                    onClick={() =>
                      updateCardEntries(
                        cardEntries.map((item) => {
                          const nextIsRegular =
                            regularLimit <= 1
                              ? item.id === cardEntry.id
                                ? !item.isRegular
                                : false
                              : item.id === cardEntry.id
                                ? !item.isRegular
                                : item.isRegular;
                          const shouldClearSecondarySelection =
                            secondarySelectionEnabled && !nextIsRegular && item.id !== cardEntry.id
                              ? true
                              : secondarySelectionEnabled && item.id === cardEntry.id && !nextIsRegular;

                          return {
                            ...item,
                            isRegular: nextIsRegular,
                            favoriteCount:
                              secondarySelectionEnabled
                                ? nextIsRegular
                                  ? 0
                                  : shouldClearSecondarySelection
                                    ? 0
                                    : item.favoriteCount ?? 0
                                : nextIsRegular
                                  ? 1
                                  : 0,
                          };
                        }),
                      )
                    }
                  >
                    {regularLabel}
                  </button>
                )
              ) : !hideQuantity ? (
                <div aria-hidden="true" className="hidden min-[1180px]:block" />
              ) : null}
              {!hideDelete ? (
                <button
                  type="button"
                  className="danger-button w-full justify-center"
                  onClick={() =>
                    updateCardEntries(
                      cardEntries.filter((item) => item.id !== cardEntry.id),
                    )
                  }
                >
                  削除
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
