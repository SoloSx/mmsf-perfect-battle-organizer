"use client";

import { useMemo } from "react";
import {
  EMPTY_SEARCHABLE_SELECT_OPTION,
  MMSF3_BROTHER_ROULETTE_MEGA_SELECT_OPTIONS,
  MMSF3_BROTHER_ROULETTE_NOISE_SELECT_OPTIONS,
  MMSF3_BROTHER_ROULETTE_REZON_SELECT_OPTIONS,
  MMSF3_BROTHER_ROULETTE_SLOT_TYPE_SELECT_OPTIONS,
  MMSF3_BROTHER_ROULETTE_WHITE_CARD_SELECT_OPTIONS,
  MMSF3_BROTHER_VERSION_SELECT_OPTIONS,
  MMSF3_SSS_LEVEL_SELECT_OPTIONS,
} from "@/components/mmsf3/select-options";
import { SearchableSelectInput } from "@/components/searchable-select-input";
import { getMmsf3GigaCardOptionsForVersion } from "@/lib/mmsf3-giga-version-rules";
import {
  MMSF3_BROTHER_ROULETTE_POSITIONS,
  getMmsf3BrotherVersionOption,
  getMmsf3GigaCardOption,
  getMmsf3MegaCardOption,
  getMmsf3NoiseOption,
  getMmsf3RezonCardOption,
  getMmsf3SssLevelOption,
  getMmsf3WhiteCardSetOption,
} from "@/lib/mmsf3-roulette-data";
import type { Mmsf3BrotherRouletteSlot } from "@/lib/types";

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
