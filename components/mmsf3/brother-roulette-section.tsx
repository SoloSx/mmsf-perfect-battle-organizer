"use client";

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
import { getMmsf3GigaCardOptionsForVersion } from "@/lib/mmsf3/giga-version-rules";
import {
  MMSF3_BROTHER_ROULETTE_POSITIONS,
  getMmsf3BrotherVersionOption,
  getMmsf3GigaCardOption,
  getMmsf3MegaCardOption,
  getMmsf3NoiseOption,
  getMmsf3RezonCardOption,
  getMmsf3SssLevelOption,
  getMmsf3WhiteCardSetOption,
} from "@/lib/mmsf3/roulette-data";
import type { Mmsf3BrotherRouletteSlot } from "@/lib/types";

function createEmptyBrotherSlot(position: Mmsf3BrotherRouletteSlot["position"]): Mmsf3BrotherRouletteSlot {
  return {
    position,
    slotType: "brother",
    sssLevel: "",
    version: "",
    noise: "",
    rezon: "",
    whiteCardSetId: "",
    gigaCard: "",
    megaCard: "",
  };
}

function buildSssSlotPatch(slot: Mmsf3BrotherRouletteSlot): Partial<Mmsf3BrotherRouletteSlot> {
  return {
    slotType: "sss" as const,
    sssLevel: slot.sssLevel,
    version: "",
    noise: "",
    rezon: "",
    whiteCardSetId: "",
    gigaCard: "",
    megaCard: "",
  };
}

function DisabledSssSection({
  sssLevels,
  onSssChange,
}: {
  sssLevels: string[];
  onSssChange: (sssLevels: string[]) => void;
}) {
  return (
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
  );
}

function BrotherSlotCard({
  slot,
  sssSlotCount,
  positionLabel,
  onChange,
}: {
  slot: Mmsf3BrotherRouletteSlot;
  sssSlotCount: number;
  positionLabel: string;
  onChange: (patch: Partial<Mmsf3BrotherRouletteSlot>) => void;
}) {
  const gigaOptions = [
    EMPTY_SEARCHABLE_SELECT_OPTION,
    ...getMmsf3GigaCardOptionsForVersion(slot.version).map((option) => ({ value: option.value, label: option.label })),
  ];
  const slotTypeOptions =
    slot.slotType === "sss" || sssSlotCount < 3
      ? MMSF3_BROTHER_ROULETTE_SLOT_TYPE_SELECT_OPTIONS
      : MMSF3_BROTHER_ROULETTE_SLOT_TYPE_SELECT_OPTIONS.filter((option) => option.value !== "sss");
  const brotherSlotPatch: Partial<Mmsf3BrotherRouletteSlot> = { slotType: "brother", sssLevel: "" };

  return (
    <div className="relative z-0 overflow-visible rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 focus-within:z-10">
      <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45">{positionLabel}</p>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-2">
          <p className="text-xs font-semibold tracking-[0.24em] text-white/42">枠種別</p>
          <SearchableSelectInput
            value={slot.slotType}
            onChange={(value) => {
              if (value === "sss" && slot.slotType !== "sss" && sssSlotCount >= 3) {
                return;
              }

              onChange(value === "sss" ? buildSssSlotPatch(slot) : brotherSlotPatch);
            }}
            options={slotTypeOptions}
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
              onChange={(value) => onChange({ slotType: "sss", sssLevel: value })}
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
                onChange={(value) => onChange({ version: value as typeof slot.version })}
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
                onChange={(value) => onChange({ noise: value })}
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
                onChange={(value) => onChange({ rezon: value })}
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
                onChange={(value) => onChange({ whiteCardSetId: value })}
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
                  onChange={(value) => onChange({ gigaCard: value })}
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
                  onChange={(value) => onChange({ megaCard: value })}
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
  const slotsByPosition = new Map(slots.map((slot) => [slot.position, slot] as const));
  const sssSlotCount = slots.filter((slot) => slot.slotType === "sss").length;

  const updateSlot = (position: Mmsf3BrotherRouletteSlot["position"], patch: Partial<Mmsf3BrotherRouletteSlot>) => {
    onBrotherChange(slots.map((slot) => (slot.position === position ? { ...slot, ...patch } : slot)));
  };

  return (
    <div className="glass-panel-soft relative z-0 overflow-visible p-6 focus-within:z-30">
      <label className="text-sm font-semibold text-white">ブラザー情報</label>
      <p className="mt-1 text-xs leading-5 text-white/52">SSS はブラザー枠の中で最大3枠まで設定でき、1枠ごとにアビリティ上限が 140P 下がります。</p>
      <div className="mt-4 grid gap-4">
        {isDisabled ? (
          <DisabledSssSection sssLevels={sssLevels} onSssChange={onSssChange} />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {MMSF3_BROTHER_ROULETTE_POSITIONS.map((position) => {
              const slot = slotsByPosition.get(position.key) ?? createEmptyBrotherSlot(position.key);

              return (
                <BrotherSlotCard
                  key={position.key}
                  slot={slot}
                  sssSlotCount={sssSlotCount}
                  positionLabel={position.label}
                  onChange={(patch) => updateSlot(position.key, patch)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
