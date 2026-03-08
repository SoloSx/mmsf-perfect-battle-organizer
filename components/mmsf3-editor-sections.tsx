"use client";

import { useMemo } from "react";
import { SearchableSelectInput, type SearchableSelectOption } from "@/components/searchable-select-input";
import { SourceListEditor } from "@/components/source-list-editor";
import { getMmsf3AbilityByLabel, getMmsf3AbilityOptionsForSlot, getMmsf3AbilitySelectionErrors, getMmsf3AbilitySources } from "@/lib/mmsf3-abilities";
import { type NormalizedMmsf3State } from "@/lib/mmsf3-build-state";
import { evaluateNoiseHand } from "@/lib/mmsf3-noise-hand";
import {
  getMmsf3NoiseCardById,
  getMmsf3NoiseCardsForSlot,
  MMSF3_NOISE_CARD_SLOT_COUNT,
} from "@/lib/mmsf3-noise-cards";
import {
  MMSF3_BROTHER_ROULETTE_NOISE_OPTIONS,
  MMSF3_BROTHER_ROULETTE_SLOT_TYPE_OPTIONS,
  MMSF3_BROTHER_VERSION_OPTIONS,
  getMmsf3BrotherVersionOption,
  getMmsf3GigaCardOptionsForVersion,
  getMmsf3GigaCardOption,
  getMmsf3MegaCardOption,
  getMmsf3NoiseOption,
  getMmsf3RezonCardOption,
  getMmsf3WhiteCardSetOption,
  MMSF3_BROTHER_ROULETTE_POSITIONS,
  MMSF3_MEGA_CARD_OPTIONS,
  MMSF3_NOISE_OPTIONS,
  MMSF3_REZON_CARD_OPTIONS,
  MMSF3_WHITE_CARD_SET_OPTIONS,
  getMmsf3SssLevelOption,
  MMSF3_SSS_LEVEL_OPTIONS,
} from "@/lib/mmsf3-roulette-options";
import type {
  BuildCardEntry,
  BuildSourceEntry,
  Mmsf3BrotherRouletteSlot,
  NoiseHandEvaluation,
  VersionId,
} from "@/lib/types";
import { createId } from "@/lib/utils";

const EMPTY_SEARCHABLE_SELECT_OPTION: SearchableSelectOption = { value: "", label: "未選択" };
const MMSF3_BROTHER_ROULETTE_NOISE_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_BROTHER_ROULETTE_NOISE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];
const MMSF3_BROTHER_ROULETTE_REZON_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_REZON_CARD_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];
const MMSF3_BROTHER_ROULETTE_SLOT_TYPE_SELECT_OPTIONS: SearchableSelectOption[] = MMSF3_BROTHER_ROULETTE_SLOT_TYPE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));
const MMSF3_BROTHER_VERSION_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_BROTHER_VERSION_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];
const MMSF3_PLAYER_NOISE_OPTIONS = MMSF3_NOISE_OPTIONS
  .filter((option) => option.value !== "00")
  .map((option) => `${option.label}ノイズ`);
const MMSF3_PLAYER_REZON_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_REZON_CARD_OPTIONS.map((option) => ({ value: option.label, label: option.label })),
];
const MMSF3_SSS_LEVEL_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_SSS_LEVEL_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];
const MMSF3_BROTHER_ROULETTE_WHITE_CARD_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_WHITE_CARD_SET_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];
const MMSF3_BROTHER_ROULETTE_MEGA_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_MEGA_CARD_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

function buildEmptyCard(): BuildCardEntry {
  return { id: createId(), name: "", quantity: 1, notes: "", isRegular: false };
}

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
    <div className="rounded-[24px] border border-cyan-300/14 bg-[linear-gradient(160deg,rgba(90,72,196,0.28),rgba(255,255,255,0.05))] p-3">
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
          <p>ノイズハンドボーナスは発生しません。</p>
        </div>
      )}
    </div>
  );
}

function NoiseCardEditor({
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
    <div className="glass-panel-soft relative z-0 p-6 focus-within:z-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="text-sm font-semibold text-white">ノイズカード</label>
          <p className="mt-1 text-xs leading-5 text-white/52">役判定は順不同。流星マークは 1 枚までです。</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {values.map((value, index) => (
          <div
            key={`noise-card-slot-${index}`}
            className="relative z-0 rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-3 focus-within:z-10"
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
              options={optionsBySlot[index] ?? [EMPTY_SEARCHABLE_SELECT_OPTION]}
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

function Mmsf3AbilityEditor({
  entries,
  onChange,
  noise,
  sssSlotCount,
  version,
}: {
  entries: BuildCardEntry[];
  onChange: (entries: BuildCardEntry[]) => void;
  noise: string;
  sssSlotCount: number;
  version: VersionId;
}) {
  const { totalCost, limit } = getMmsf3AbilitySelectionErrors(entries, noise, sssSlotCount);

  return (
    <div className="glass-panel-soft relative z-0 p-6 focus-within:z-20">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-white">アビリティ</label>
        <span className="text-xs text-white/45">合計P {totalCost}/{limit}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-white/52">ランダム入手ありは最大9個、その他は1個。SSS は1枠ごとに上限 -140P、ブライノイズ時は上限 900P です。</p>
      <div className="mt-4 space-y-3">
        {entries.map((entry, index) => {
          const selectedAbility = getMmsf3AbilityByLabel(entry.name.trim());
          const options: SearchableSelectOption[] = [
            EMPTY_SEARCHABLE_SELECT_OPTION,
            ...getMmsf3AbilityOptionsForSlot(entries, index, version).map((option) => ({
              value: option.label,
              label: option.label,
            })),
          ];

          return (
            <div
              key={entry.id}
              className="relative z-0 grid gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 focus-within:z-10 md:grid-cols-[minmax(0,1fr)_112px]"
            >
              <SearchableSelectInput
                value={selectedAbility?.label ?? ""}
                onChange={(value) => {
                  const selectedOption = getMmsf3AbilityByLabel(value);
                  onChange(
                    entries.map((item) =>
                      item.id === entry.id
                        ? selectedOption
                          ? { ...item, name: selectedOption.label, quantity: selectedOption.cost }
                          : { ...item, name: "", quantity: 1 }
                        : item,
                    ),
                  );
                }}
                options={options}
                placeholder="アビリティを検索"
                displayValue={selectedAbility?.label ?? entry.name}
                className="field-shell min-h-[52px] w-full"
              />
              <button
                type="button"
                className="danger-button w-full justify-center"
                onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}
              >
                削除
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" className="secondary-button mt-4" onClick={() => onChange([...entries, buildEmptyCard()])}>
        行を追加
      </button>
    </div>
  );
}

export function Mmsf3BrotherRouletteSection({
  slots,
  sssLevels,
  onBrotherChange,
  onSssChange,
  isDisabled,
}: {
  slots: Mmsf3BrotherRouletteSlot[];
  sssLevels: string[];
  onBrotherChange: (slots: Mmsf3BrotherRouletteSlot[]) => void;
  onSssChange: (sssLevels: string[]) => void;
  isDisabled: boolean;
}) {
  const slotsByPosition = useMemo(
    () => new Map(slots.map((slot) => [slot.position, slot] as const)),
    [slots],
  );
  const sssSlotCount = useMemo(() => slots.filter((slot) => slot.slotType === "sss").length, [slots]);

  const updateSlot = (position: Mmsf3BrotherRouletteSlot["position"], patch: Partial<Mmsf3BrotherRouletteSlot>) => {
    onBrotherChange(slots.map((slot) => (slot.position === position ? { ...slot, ...patch } : slot)));
  };

  return (
    <div className="glass-panel-soft relative z-0 overflow-visible p-6 focus-within:z-30">
      <label className="text-sm font-semibold text-white">ブラザー情報</label>
      <p className="mt-1 text-xs leading-5 text-white/52">SSS はブラザー枠の中で最大3枠まで設定でき、1枠ごとにアビリティ上限が 140P 下がります。</p>
      <div className="mt-4 grid gap-4">
        {isDisabled ? (
          <>
            <div className="rounded-[24px] border border-amber-300/18 bg-amber-400/8 px-4 py-4 text-sm leading-6 text-amber-50/88">
              ブライノイズではブラザーは設定できませんが、SSSは設定できます。
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
              <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">シークレットサテライトサーバー</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={`sss-slot-${index}`} className="grid gap-2">
                    <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">
                      SSS {String(index + 1).padStart(2, "0")}
                    </p>
                    <SearchableSelectInput
                      value={sssLevels[index] ?? ""}
                      onChange={(value) => {
                        const nextLevels = [...sssLevels];
                        nextLevels[index] = value;
                        onSssChange(nextLevels);
                      }}
                      options={MMSF3_SSS_LEVEL_SELECT_OPTIONS}
                      placeholder="SSS を検索"
                      displayValue={getMmsf3SssLevelOption(sssLevels[index] ?? "")?.label ?? ""}
                      className="field-shell min-h-[52px] w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
        {!isDisabled ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {MMSF3_BROTHER_ROULETTE_POSITIONS.map((position) => {
              const slot = slotsByPosition.get(position.key) ?? {
                position: position.key,
                slotType: "brother",
                sssLevel: "",
                version: "",
                noise: "",
                rezon: "",
                whiteCardSetId: "",
                gigaCard: "",
                megaCard: "",
              };
              const gigaOptions = [
                EMPTY_SEARCHABLE_SELECT_OPTION,
                ...getMmsf3GigaCardOptionsForVersion(slot.version).map((option) => ({ value: option.value, label: option.label })),
              ];

              return (
                <div
                  key={position.key}
                  className="relative z-0 overflow-visible rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 focus-within:z-10"
                >
                  <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">{position.label}</p>

                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <p className="text-xs font-semibold tracking-[0.24em] text-white/42">枠種別</p>
                      <SearchableSelectInput
                        value={slot.slotType}
                        onChange={(value) => {
                          if (value === "sss" && slot.slotType !== "sss" && sssSlotCount >= 3) {
                            return;
                          }

                          updateSlot(
                            position.key,
                            value === "sss"
                              ? {
                                slotType: "sss",
                                sssLevel: slot.sssLevel,
                                version: "",
                                noise: "",
                                rezon: "",
                                whiteCardSetId: "",
                                  gigaCard: "",
                                  megaCard: "",
                                }
                              : {
                                  slotType: "brother",
                                  sssLevel: "",
                                },
                          );
                        }}
                        options={
                          slot.slotType === "sss" || sssSlotCount < 3
                            ? MMSF3_BROTHER_ROULETTE_SLOT_TYPE_SELECT_OPTIONS
                            : MMSF3_BROTHER_ROULETTE_SLOT_TYPE_SELECT_OPTIONS.filter((option) => option.value !== "sss")
                        }
                        placeholder="種別を選択"
                        displayValue={slot.slotType === "sss" ? "SSS" : "ブラザー"}
                        className="field-shell min-h-[52px] w-full"
                      />
                    </div>

                    {slot.slotType === "sss" ? (
                      <div className="grid gap-2">
                        <p className="text-xs font-semibold tracking-[0.24em] text-white/42">シークレットサテライトサーバー</p>
                        <SearchableSelectInput
                          value={slot.sssLevel}
                          onChange={(value) => updateSlot(position.key, { slotType: "sss", sssLevel: value })}
                          options={MMSF3_SSS_LEVEL_SELECT_OPTIONS}
                          placeholder="SSS を検索"
                          displayValue={getMmsf3SssLevelOption(slot.sssLevel)?.label ?? ""}
                          className="field-shell min-h-[52px] w-full"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-2">
                          <p className="text-xs font-semibold tracking-[0.24em] text-white/42">バージョン</p>
                          <SearchableSelectInput
                            value={slot.version}
                            onChange={(value) => updateSlot(position.key, { version: value as typeof slot.version })}
                            options={MMSF3_BROTHER_VERSION_SELECT_OPTIONS}
                            placeholder="バージョンを選択"
                            displayValue={getMmsf3BrotherVersionOption(slot.version)?.label ?? ""}
                            className="field-shell min-h-[52px] w-full"
                          />
                        </div>

                        <div className="grid gap-2">
                          <p className="text-xs font-semibold tracking-[0.24em] text-white/42">マージノイズ</p>
                          <SearchableSelectInput
                            value={slot.noise}
                            onChange={(value) => updateSlot(position.key, { noise: value })}
                            options={MMSF3_BROTHER_ROULETTE_NOISE_SELECT_OPTIONS}
                            placeholder="マージノイズを検索"
                            displayValue={getMmsf3NoiseOption(slot.noise)?.label ?? ""}
                            className="field-shell min-h-[52px] w-full"
                          />
                        </div>

                        <div className="grid gap-2">
                          <p className="text-xs font-semibold tracking-[0.24em] text-white/42">レゾンカード</p>
                          <SearchableSelectInput
                            value={slot.rezon}
                            onChange={(value) => updateSlot(position.key, { rezon: value })}
                            options={MMSF3_BROTHER_ROULETTE_REZON_SELECT_OPTIONS}
                            placeholder="レゾンカードを検索"
                            displayValue={getMmsf3RezonCardOption(slot.rezon)?.label ?? ""}
                            className="field-shell min-h-[52px] w-full"
                          />
                        </div>

                        <div className="grid gap-2">
                          <p className="text-xs font-semibold tracking-[0.24em] text-white/42">ホワイトカード</p>
                          <SearchableSelectInput
                            value={slot.whiteCardSetId}
                            onChange={(value) => updateSlot(position.key, { whiteCardSetId: value })}
                            options={MMSF3_BROTHER_ROULETTE_WHITE_CARD_SELECT_OPTIONS}
                            placeholder="ホワイトカードを検索"
                            displayValue={getMmsf3WhiteCardSetOption(slot.whiteCardSetId)?.label ?? ""}
                            className="field-shell min-h-[52px] w-full"
                          />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="grid gap-2">
                            <p className="text-xs font-semibold tracking-[0.24em] text-white/42">ギガカード</p>
                            <SearchableSelectInput
                              value={slot.gigaCard}
                              onChange={(value) => updateSlot(position.key, { gigaCard: value })}
                              options={gigaOptions}
                              placeholder="ギガカードを検索"
                              displayValue={getMmsf3GigaCardOption(slot.gigaCard)?.label ?? ""}
                              className="field-shell min-h-[52px] w-full"
                            />
                          </div>

                          <div className="grid gap-2">
                            <p className="text-xs font-semibold tracking-[0.24em] text-white/42">メガカード</p>
                            <SearchableSelectInput
                              value={slot.megaCard}
                              onChange={(value) => updateSlot(position.key, { megaCard: value })}
                              options={MMSF3_BROTHER_ROULETTE_MEGA_SELECT_OPTIONS}
                              placeholder="メガカードを検索"
                              displayValue={getMmsf3MegaCardOption(slot.megaCard)?.label ?? ""}
                              className="field-shell min-h-[52px] w-full"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

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

export function Mmsf3AbilitySection({
  state,
  version,
  abilityNameSuggestions,
  sourceSuggestions,
  missingAbilitySourceNames,
  onAbilitiesChange,
  onAbilitySourcesChange,
}: {
  state: NormalizedMmsf3State;
  version: VersionId;
  abilityNameSuggestions: string[];
  sourceSuggestions: string[];
  missingAbilitySourceNames: string[];
  onAbilitiesChange: (entries: BuildCardEntry[]) => void;
  onAbilitySourcesChange: (entries: BuildSourceEntry[]) => void;
}) {
  return (
    <>
      <Mmsf3AbilityEditor
        entries={state.abilities}
        onChange={onAbilitiesChange}
        noise={state.noise}
        sssSlotCount={state.sssSlotCount}
        version={version}
      />
      <SourceListEditor
        title="アビリティ入手方法"
        entries={state.abilitySources}
        onChange={onAbilitySourcesChange}
        game="mmsf3"
        version={version}
        nameSuggestions={abilityNameSuggestions}
        sourceSuggestions={sourceSuggestions}
        missingNames={missingAbilitySourceNames}
        useKnownSourceSuggestions
        actionMode="owned"
        resolveKnownSources={(name) => getMmsf3AbilitySources(name)}
        emptyOwnedMessage="未所持のアビリティはありません。すべて所持済みです。"
      />
    </>
  );
}

export function Mmsf3EditorSections({
  version,
  state,
  abilityNameSuggestions,
  sourceSuggestions,
  missingAbilitySourceNames,
  onNoiseChange,
  onPlayerRezonCardChange,
  onWhiteCardSetIdChange,
  onNoiseCardIdsChange,
  onAbilitiesChange,
  onAbilitySourcesChange,
}: {
  version: VersionId;
  state: NormalizedMmsf3State;
  abilityNameSuggestions: string[];
  sourceSuggestions: string[];
  missingAbilitySourceNames: string[];
  onNoiseChange: (noise: string) => void;
  onPlayerRezonCardChange: (value: string) => void;
  onWhiteCardSetIdChange: (value: string) => void;
  onNoiseCardIdsChange: (values: string[]) => void;
  onAbilitiesChange: (entries: BuildCardEntry[]) => void;
  onAbilitySourcesChange: (entries: BuildSourceEntry[]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4">
      <Mmsf3RockmanSection
        state={state}
        onNoiseChange={onNoiseChange}
        onPlayerRezonCardChange={onPlayerRezonCardChange}
        onWhiteCardSetIdChange={onWhiteCardSetIdChange}
        onNoiseCardIdsChange={onNoiseCardIdsChange}
      />
      <Mmsf3AbilitySection
        state={state}
        version={version}
        abilityNameSuggestions={abilityNameSuggestions}
        sourceSuggestions={sourceSuggestions}
        missingAbilitySourceNames={missingAbilitySourceNames}
        onAbilitiesChange={onAbilitiesChange}
        onAbilitySourcesChange={onAbilitySourcesChange}
      />
    </div>
  );
}
