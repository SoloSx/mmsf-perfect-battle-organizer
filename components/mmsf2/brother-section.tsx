"use client";

import { useId } from "react";
import { SearchableSelectInput } from "@/components/searchable-select-input";
import { VERSIONS_BY_GAME, VERSION_LABELS } from "@/lib/rules";
import type { BrotherProfile } from "@/lib/types";
import { createId } from "@/lib/utils";

const MMSF2_VERSION_OPTIONS = VERSIONS_BY_GAME.mmsf2.map((version) => ({
  value: version,
  label: VERSION_LABELS[version],
}));

const MMSF2_BROTHER_POSITIONS = [
  { key: "top_left", label: "左上" },
  { key: "top_right", label: "右上" },
  { key: "mid_left", label: "左中" },
  { key: "mid_right", label: "右中" },
  { key: "btm_left", label: "左下" },
  { key: "btm_right", label: "右下" },
] as const;

function createEmptyBrother(position: string): BrotherProfile {
  return { id: position, name: position, kind: "real", favoriteCards: [], rezonCard: "", notes: "" };
}

function ensureSixSlots(entries: BrotherProfile[]): BrotherProfile[] {
  return MMSF2_BROTHER_POSITIONS.map((pos) => {
    const existing = entries.find((e) => e.id === pos.key || e.name === pos.key);
    return existing ?? createEmptyBrother(pos.key);
  });
}

function BrotherCard({
  entry,
  positionLabel,
  cardSuggestions,
  onChange,
}: {
  entry: BrotherProfile;
  positionLabel: string;
  cardSuggestions: string[];
  onChange: (patch: Partial<BrotherProfile>) => void;
}) {
  const favListId = useId();
  const filledFavCount = entry.favoriteCards.filter((c) => c.trim()).length;

  return (
    <div className="relative z-0 overflow-visible rounded-[24px] border border-cyan-300/14 bg-[linear-gradient(160deg,rgba(87,60,180,0.24),rgba(56,189,248,0.12),rgba(255,255,255,0.04))] p-4 shadow-[0_18px_40px_rgba(24,24,72,0.18)] focus-within:z-10">
      <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">{positionLabel}</p>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-2">
          <p className="text-xs font-semibold tracking-[0.24em] text-white/42">バージョン</p>
          <SearchableSelectInput
            value={entry.rezonCard}
            onChange={(value) => onChange({ rezonCard: value })}
            options={MMSF2_VERSION_OPTIONS}
            placeholder="バージョンを選択"
            displayValue={MMSF2_VERSION_OPTIONS.find((opt) => opt.value === entry.rezonCard)?.label ?? ""}
            className="field-shell min-h-[52px] w-full"
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.24em] text-white/42">FAV カード</p>
            <span className="text-xs text-white/45">{filledFavCount}/4</span>
          </div>
          <div className="grid gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <input
                key={`fav-${index}`}
                list={favListId}
                value={entry.favoriteCards[index] ?? ""}
                onChange={(event) => {
                  const next = Array.from({ length: 4 }, (_, i) => entry.favoriteCards[i] ?? "");
                  next[index] = event.target.value;
                  onChange({ favoriteCards: next });
                }}
                placeholder={`FAV カード ${index + 1}`}
                className="field-shell min-h-[44px]"
              />
            ))}
          </div>
          <datalist id={favListId}>
            {cardSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}

export function Mmsf2BrotherSection({
  entries,
  onChange,
  cardSuggestions,
  isDisabled,
  kokuuNoKakera,
  onKokuuNoKakeraChange,
}: {
  entries: BrotherProfile[];
  onChange: (entries: BrotherProfile[]) => void;
  cardSuggestions: string[];
  isDisabled: boolean;
  kokuuNoKakera: boolean;
  onKokuuNoKakeraChange: (value: boolean) => void;
}) {
  const slots = ensureSixSlots(entries);
  const brotherInputDisabled = isDisabled || kokuuNoKakera;

  return (
    <div className="glass-panel-soft relative z-0 overflow-visible bg-[linear-gradient(135deg,rgba(42,26,98,0.28),rgba(31,58,147,0.18),rgba(255,255,255,0.03))] p-6 focus-within:z-30">
      <label className="text-sm font-semibold text-white">ブラザー情報</label>
      <p className="mt-1 text-xs leading-5 text-white/52">各ブラザーのバージョンと FAV カード（4枚必須）を設定できます。</p>
      <div className="mt-4 grid gap-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={kokuuNoKakera}
            onChange={(event) => onKokuuNoKakeraChange(event.target.checked)}
            className="h-5 w-5 rounded border-white/20 bg-white/10 accent-cyan-400"
          />
          <span className="text-sm text-white/80">コクウノカケラを装備する</span>
        </label>
        {isDisabled ? (
          <div className="rounded-[24px] border border-amber-300/18 bg-amber-400/8 px-4 py-4 text-sm leading-6 text-amber-50/88">
            ブライ強化ではブラザーは設定できません。
          </div>
        ) : kokuuNoKakera ? (
          <div className="rounded-[24px] border border-amber-300/18 bg-amber-400/8 px-4 py-4 text-sm leading-6 text-amber-50/88">
            コクウノカケラ装備中はブラザーの FAV・バージョンは設定できません。
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {MMSF2_BROTHER_POSITIONS.map((pos, index) => (
              <BrotherCard
                key={pos.key}
                entry={slots[index]}
                positionLabel={pos.label}
                cardSuggestions={cardSuggestions}
                onChange={(patch) => {
                  const nextSlots = slots.map((slot, i) =>
                    i === index ? { ...slot, ...patch, id: pos.key, name: pos.key } : slot,
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
