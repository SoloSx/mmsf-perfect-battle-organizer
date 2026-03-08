"use client";

import { useMemo } from "react";
import { NoiseCardEditor } from "@/components/mmsf3/noise-card-editor";
import {
  EMPTY_SEARCHABLE_SELECT_OPTION,
  MMSF3_BROTHER_ROULETTE_WHITE_CARD_SELECT_OPTIONS,
  MMSF3_PLAYER_NOISE_OPTIONS,
  MMSF3_PLAYER_REZON_SELECT_OPTIONS,
} from "@/components/mmsf3/select-options";
import { SearchableSelectInput } from "@/components/searchable-select-input";
import { evaluateNoiseHand } from "@/lib/mmsf3-noise-hand";
import { getMmsf3NoiseCardsForSlot } from "@/lib/mmsf3-noise-cards";
import {
  getMmsf3RezonCardOption,
  getMmsf3WhiteCardSetOption,
} from "@/lib/mmsf3-roulette-data";
import type { NormalizedMmsf3State } from "@/lib/mmsf3-build-state";

export function Mmsf3RockmanSection({
  state,
  onNoiseChange,
  onPlayerRezonCardChange,
  onWhiteCardSetIdChange,
  onNoiseCardIdsChange,
}: {
  state: NormalizedMmsf3State;
  onNoiseChange: (noise: string) => void;
  onPlayerRezonCardChange: (value: string) => void;
  onWhiteCardSetIdChange: (value: string) => void;
  onNoiseCardIdsChange: (values: string[]) => void;
}) {
  const noiseCardEvaluation = useMemo(() => evaluateNoiseHand(state.noiseCardIds), [state.noiseCardIds]);
  const noiseCardOptionsBySlot = useMemo(
    () =>
      state.noiseCardIds.map((_, slotIndex) => [
        EMPTY_SEARCHABLE_SELECT_OPTION,
        ...getMmsf3NoiseCardsForSlot(state.noiseCardIds, slotIndex).map((card) => ({
          value: card.id,
          label: card.label,
        })),
      ]),
    [state.noiseCardIds],
  );

  return (
    <>
      <select value={state.noise} onChange={(event) => onNoiseChange(event.target.value)} className="field-shell">
        <option value="">ノイズを選択</option>
        {MMSF3_PLAYER_NOISE_OPTIONS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-white">レゾンカード</label>
          <SearchableSelectInput
            value={state.playerRezonCard}
            onChange={onPlayerRezonCardChange}
            options={MMSF3_PLAYER_REZON_SELECT_OPTIONS}
            placeholder="レゾンカードを検索"
            displayValue={getMmsf3RezonCardOption(state.playerRezonCard)?.label ?? state.playerRezonCard}
            className="field-shell min-h-[52px] w-full"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-white">ホワイトカード</label>
          <SearchableSelectInput
            value={state.whiteCardSetId}
            onChange={onWhiteCardSetIdChange}
            options={MMSF3_BROTHER_ROULETTE_WHITE_CARD_SELECT_OPTIONS}
            placeholder="ホワイトカードを検索"
            displayValue={getMmsf3WhiteCardSetOption(state.whiteCardSetId)?.label ?? ""}
            className="field-shell min-h-[52px] w-full"
          />
        </div>
      </div>
      <NoiseCardEditor
        values={state.noiseCardIds}
        onChange={onNoiseCardIdsChange}
        optionsBySlot={noiseCardOptionsBySlot}
        evaluation={noiseCardEvaluation}
      />
    </>
  );
}
