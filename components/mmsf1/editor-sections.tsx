"use client";

import { SearchableSelectInput } from "@/components/searchable-select-input";
import { SourceListEditor } from "@/components/source-list-editor";
import { normalizeMmsf1EnhancementValue } from "@/lib/mmsf1/enhancement";
import type { BuildSourceEntry, Mmsf1Sections } from "@/lib/types";

const ENHANCEMENT_OPTIONS = [
  { value: "", label: "強化Off" },
  { value: "on", label: "強化On" },
];

export function Mmsf1EditorSections({
  state,
  onEnhancementChange,
}: {
  state: Mmsf1Sections;
  onEnhancementChange: (value: string) => void;
}) {
  return (
    <div className="mt-4 grid gap-2">
      <label className="text-xs font-semibold tracking-[0.24em] text-white/42">強化</label>
      <SearchableSelectInput
        value={normalizeMmsf1EnhancementValue(state.enhancement)}
        onChange={(value) => onEnhancementChange(normalizeMmsf1EnhancementValue(value))}
        options={ENHANCEMENT_OPTIONS}
        placeholder="強化On/Offを選択"
        className="field-shell min-h-[52px] w-full"
      />
    </div>
  );
}

export function Mmsf1WarRockSection({
  state,
  warRockWeapons,
  sourceSuggestions,
  missingWarRockWeaponSourceNames,
  resolveKnownSources,
  onWarRockWeaponChange,
  onWarRockWeaponSourcesChange,
}: {
  state: Mmsf1Sections;
  warRockWeapons: string[];
  sourceSuggestions: string[];
  missingWarRockWeaponSourceNames: string[];
  resolveKnownSources: (name: string) => string[];
  onWarRockWeaponChange: (value: string) => void;
  onWarRockWeaponSourcesChange: (entries: BuildSourceEntry[]) => void;
}) {
  const weaponOptions = [
    { value: "", label: "未選択" },
    ...warRockWeapons.map((item) => ({ value: item, label: item })),
  ];

  return (
    <div className="mt-4 grid gap-4">
      <div className="glass-panel-soft relative z-0 overflow-visible p-6 focus-within:z-30">
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-white">ウォーロック装備</label>
          <SearchableSelectInput
            value={state.warRockWeapon}
            onChange={onWarRockWeaponChange}
            options={weaponOptions}
            placeholder="ウォーロック装備を検索"
            displayValue={state.warRockWeapon}
            className="field-shell min-h-[52px] w-full"
          />
        </div>
      </div>
      <SourceListEditor
        title="ウォーロック装備入手方法"
        entries={state.warRockWeaponSources}
        onChange={onWarRockWeaponSourcesChange}
        game="mmsf1"
        version="pegasus"
        nameSuggestions={warRockWeapons}
        sourceSuggestions={sourceSuggestions}
        missingNames={missingWarRockWeaponSourceNames}
        useKnownSourceSuggestions
        resolveKnownSources={resolveKnownSources}
        actionMode="owned"
      />
    </div>
  );
}
