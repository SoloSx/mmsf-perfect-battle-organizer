"use client";

import { SearchableSelectInput, type SearchableSelectOption } from "@/components/searchable-select-input";
import { getMmsf3NoiseCardById, MMSF3_NOISE_CARD_SLOT_COUNT } from "@/lib/mmsf3/noise-cards";
import type { NoiseHandEvaluation } from "@/lib/types";

function NoiseHandSummary({
  evaluation,
  selectedCount,
}: {
  evaluation: NoiseHandEvaluation;
  selectedCount: number;
}) {
  const bestHand = evaluation.bestHand;
  const bonusLines = bestHand?.bonusEffect.split("\n") ?? [];

  return (
    <div className="rounded-[24px] border border-cyan-300/20 bg-[linear-gradient(150deg,rgba(100,82,212,0.34),rgba(70,122,214,0.22),rgba(255,255,255,0.07))] p-3">
      <div className="mb-3">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">Noise Hand Bonus</p>
      </div>
      {evaluation.errors.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-red-100">
          {evaluation.errors.map((error) => (
            <li key={error}>• {error}</li>
          ))}
        </ul>
      ) : selectedCount < MMSF3_NOISE_CARD_SLOT_COUNT ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <p className="text-lg font-semibold text-white">判定待ち</p>
            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium text-white/72">
              {selectedCount}/{MMSF3_NOISE_CARD_SLOT_COUNT}
            </span>
          </div>
          <p className="text-sm leading-6 text-white/75">5枚そろうとノイズハンドボーナスを判定します。</p>
        </div>
      ) : bestHand ? (
        <div className="mt-4 space-y-4 text-sm leading-6 text-white/82">
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-start">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">成立役</p>
              <p className="mt-1 text-xl font-semibold text-white">{bestHand.label}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">ボーナス効果</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {bonusLines.length > 0 ? (
                  bonusLines.map((line) => (
                    <li key={line} className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium text-white/86">
                      {line}
                    </li>
                  ))
                ) : (
                  <li className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium text-white/72">効果なし</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2 text-sm leading-6 text-white/75">
          <p className="text-lg font-semibold text-white">役なし</p>
          {evaluation.rolelessBugEffects.length > 0 ? (
            <div className="pt-1">
              <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">バグ効果</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {evaluation.rolelessBugEffects.map((line) => (
                  <li key={line} className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium text-white/86">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function NoiseCardEditor({
  values,
  onChange,
  optionsBySlot,
  evaluation,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  optionsBySlot: SearchableSelectOption[][];
  evaluation: NoiseHandEvaluation;
}) {
  const selectedCount = values.filter(Boolean).length;

  return (
    <div className="glass-panel-soft relative z-0 overflow-visible p-6 focus-within:z-30">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="text-sm font-semibold text-white">ノイズドカード</label>
          <p className="mt-1 text-xs leading-5 text-white/52">役判定は順不同。流星マークは 1 枚までです。</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {values.map((value, index) => (
          <div
            key={`noise-card-slot-${index}`}
            className="relative z-0 overflow-visible rounded-[24px] border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.1),rgba(150,117,255,0.08),rgba(255,255,255,0.035))] p-3 focus-within:z-30"
          >
            <div className="mb-3">
              <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">
                SLOT {String(index + 1).padStart(2, "0")}
              </p>
            </div>
            <SearchableSelectInput
              value={value}
              onChange={(nextValue) => {
                const nextValues = [...values];
                nextValues[index] = nextValue;
                onChange(nextValues);
              }}
              options={optionsBySlot[index] ?? ([] as SearchableSelectOption[])}
              placeholder="カードを検索"
              displayValue={
                value
                  ? (() => {
                      const card = getMmsf3NoiseCardById(value);
                      return card ? `${card.mark}${card.rank ?? ""} ${card.cardName}`.trim() : "";
                    })()
                  : ""
              }
              className="field-shell min-h-[52px] w-full"
            />
            {value ? (
              <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-white/62">
                {getMmsf3NoiseCardById(value)?.cardEffect}
              </p>
            ) : (
              <p className="mt-3 min-h-10 text-xs leading-5 text-white/35">未選択</p>
            )}
          </div>
        ))}
        <NoiseHandSummary evaluation={evaluation} selectedCount={selectedCount} />
      </div>
    </div>
  );
}
