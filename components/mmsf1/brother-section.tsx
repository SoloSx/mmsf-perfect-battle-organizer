"use client";

import { SearchableSelectInput } from "@/components/searchable-select-input";
import { SearchableSuggestionInput } from "@/components/searchable-suggestion-input";
import {
  getMmsf1BrotherFixedFavoriteCards,
  getMmsf1BrotherKindByName,
  getMmsf1BrotherKindLabel,
  getMmsf1BrotherForcedVersion,
  getMmsf1BrotherVersionLabel,
  isMmsf1BrotherFavoriteCardsLocked,
  isMmsf1UniqueBrotherName,
  MMSF1_BROTHER_NAMES,
} from "@/lib/mmsf1/brothers";
import { VERSIONS_BY_GAME, VERSION_LABELS } from "@/lib/rules";
import type { BrotherProfile, VersionId } from "@/lib/types";

const MMSF1_VERSION_OPTIONS = VERSIONS_BY_GAME.mmsf1.map((version) => ({
  value: version,
  label: VERSION_LABELS[version],
}));

const BROTHER_POSITIONS = [
  { key: "top_left", label: "左上①" },
  { key: "top_right", label: "右上②" },
  { key: "mid_left", label: "左中③" },
  { key: "mid_right", label: "右中④" },
  { key: "btm_left", label: "左下⑤" },
  { key: "btm_right", label: "右下⑥" },
] as const;

const FAV_COUNT = 6;

function createEmptyBrother(position: string): BrotherProfile {
  return { id: position, name: "", kind: "story", favoriteCards: [], rezonCard: "", notes: "" };
}

function ensureSixSlots(entries: BrotherProfile[]): BrotherProfile[] {
  return BROTHER_POSITIONS.map((pos) => {
    const existing = entries.find((e) => e.id === pos.key || e.name === pos.key);
    if (!existing) {
      return createEmptyBrother(pos.key);
    }

    return {
      ...existing,
      id: pos.key,
      name: existing.name === pos.key ? "" : existing.name,
      kind: getMmsf1BrotherKindByName(existing.name === pos.key ? "" : existing.name) ?? existing.kind ?? "story",
    };
  });
}

function BrotherCard({
  entry,
  positionLabel,
  nameOptions,
  cardSuggestions,
  currentVersion,
  onChange,
}: {
  entry: BrotherProfile;
  positionLabel: string;
  nameOptions: Array<{ value: string; label: string }>;
  cardSuggestions: string[];
  currentVersion: Extract<VersionId, "pegasus" | "leo" | "dragon">;
  onChange: (patch: Partial<BrotherProfile>) => void;
}) {
  const filledFavCount = entry.favoriteCards.filter((c) => c.trim()).length;
  const forcedVersion = getMmsf1BrotherForcedVersion(entry.name, currentVersion);
  const lockedFavoriteCards = getMmsf1BrotherFixedFavoriteCards(entry.name);
  const favoriteCardsLocked = isMmsf1BrotherFavoriteCardsLocked(entry.name);

  return (
    <div className="relative z-0 overflow-visible rounded-[24px] border border-cyan-300/14 bg-[linear-gradient(160deg,rgba(87,60,180,0.24),rgba(56,189,248,0.12),rgba(255,255,255,0.04))] p-4 shadow-[0_18px_40px_rgba(24,24,72,0.18)] focus-within:z-10">
      <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">{positionLabel}</p>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.24em] text-white/42">名前</p>
            <span className="text-xs text-white/45">{getMmsf1BrotherKindLabel(entry.kind)}</span>
          </div>
          <SearchableSelectInput
            value={entry.name}
            onChange={(value) =>
              {
                const nextFixedFavoriteCards = getMmsf1BrotherFixedFavoriteCards(value);
                onChange({
                  name: value,
                  kind: getMmsf1BrotherKindByName(value) ?? "story",
                  rezonCard: getMmsf1BrotherForcedVersion(value, currentVersion) ?? entry.rezonCard,
                  favoriteCards:
                    nextFixedFavoriteCards.length > 0 ? nextFixedFavoriteCards
                    : favoriteCardsLocked ? []
                    : entry.favoriteCards,
                });
              }
            }
            options={nameOptions}
            placeholder="ブラザー名を選択"
            displayValue={entry.name}
            className="field-shell min-h-[52px] w-full"
          />
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-semibold tracking-[0.24em] text-white/42">バージョン</p>
          {forcedVersion ? (
            <div className="field-shell flex min-h-[52px] items-center justify-between">
              <span>{getMmsf1BrotherVersionLabel(forcedVersion)}</span>
              <span className="text-xs text-white/45">固定</span>
            </div>
          ) : (
            <SearchableSelectInput
              value={entry.rezonCard}
              onChange={(value) => onChange({ rezonCard: value })}
              options={MMSF1_VERSION_OPTIONS}
              placeholder="バージョンを選択"
              displayValue={MMSF1_VERSION_OPTIONS.find((opt) => opt.value === entry.rezonCard)?.label ?? ""}
              className="field-shell min-h-[52px] w-full"
            />
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.24em] text-white/42">FAV カード</p>
            <span className="text-xs text-white/45">
              {favoriteCardsLocked ? "固定 6/6" : `${filledFavCount}/${FAV_COUNT}`}
            </span>
          </div>
          {favoriteCardsLocked ? (
            <div className="grid gap-2">
              {lockedFavoriteCards.map((cardName, index) => (
                <div key={`${cardName}-${index}`} className="field-shell flex min-h-[44px] items-center justify-between">
                  <span>{cardName}</span>
                  <span className="text-xs text-white/45">固定</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-2">
              {Array.from({ length: FAV_COUNT }, (_, index) => (
                <SearchableSuggestionInput
                  key={`fav-${index}`}
                  value={entry.favoriteCards[index] ?? ""}
                  onChange={(value) => {
                    const next = Array.from({ length: FAV_COUNT }, (_, i) => entry.favoriteCards[i] ?? "");
                    next[index] = value;
                    onChange({ favoriteCards: next });
                  }}
                  suggestions={cardSuggestions}
                  placeholder={`FAV カード ${index + 1}`}
                  className="field-shell min-h-[44px]"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Mmsf1BrotherSection({
  entries,
  onChange,
  cardSuggestions,
  currentVersion,
  isDisabled,
}: {
  entries: BrotherProfile[];
  onChange: (entries: BrotherProfile[]) => void;
  cardSuggestions: string[];
  currentVersion: Extract<VersionId, "pegasus" | "leo" | "dragon">;
  isDisabled: boolean;
}) {
  const slots = ensureSixSlots(entries);
  const selectedUniqueNames = slots
    .map((entry) => entry.name.trim())
    .filter((name) => isMmsf1UniqueBrotherName(name));

  return (
    <div className="glass-panel-soft relative z-0 overflow-visible bg-[linear-gradient(135deg,rgba(42,26,98,0.28),rgba(31,58,147,0.18),rgba(255,255,255,0.03))] p-6 focus-within:z-30">
      <label className="text-sm font-semibold text-white">ブラザー情報</label>
      <p className="mt-1 text-xs leading-5 text-white/52">ゲーム内ブラザー、LM・シン、リアルブラザー、ボクタイを枠ごとに設定できます。</p>
      <div className="mt-4 grid gap-4">
        {isDisabled ? (
          <div className="rounded-[24px] border border-amber-300/18 bg-amber-400/8 px-4 py-4 text-sm leading-6 text-amber-50/88">
            スターフォース強化ではブラザーは設定できません。
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {BROTHER_POSITIONS.map((pos, index) => (
              <BrotherCard
                key={pos.key}
                entry={slots[index]}
                positionLabel={pos.label}
                nameOptions={MMSF1_BROTHER_NAMES
                  .filter((name) => {
                    if (name === slots[index]?.name.trim()) {
                      return true;
                    }

                    if (!isMmsf1UniqueBrotherName(name)) {
                      return true;
                    }

                    return !selectedUniqueNames.includes(name);
                  })
                  .map((name) => ({ value: name, label: name }))}
                cardSuggestions={cardSuggestions}
                currentVersion={currentVersion}
                onChange={(patch) => {
                  const nextSlots = slots.map((slot, i) =>
                    i === index ? { ...slot, ...patch, id: pos.key } : slot,
                  );
                  onChange(nextSlots);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
