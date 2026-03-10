"use client";

import { SearchableSelectInput } from "@/components/searchable-select-input";
import { SourceListEditor } from "@/components/source-list-editor";
import type { BuildSourceEntry, Mmsf2Sections } from "@/lib/types";

const ENHANCEMENT_OPTIONS = [
  { value: "", label: "強化なし" },
  { value: "berserker", label: "ベルセルク" },
  { value: "shinobi", label: "シノビ" },
  { value: "dinosaur", label: "ダイナソー" },
  { value: "burai", label: "ブライ" },
];

export function Mmsf2EditorSections({
  state,
  onEnhancementChange,
}: {
  state: Mmsf2Sections;
  onEnhancementChange: (value: string) => void;
}) {
  return (
    <div className="mt-4 grid gap-2">
      <label className="text-xs font-semibold tracking-[0.24em] text-white/42">強化On</label>
      <SearchableSelectInput
        value={state.enhancement}
        onChange={onEnhancementChange}
        options={ENHANCEMENT_OPTIONS}
        placeholder="強化Onを選択"
        className="field-shell min-h-[52px] w-full"
      />
    </div>
  );
}

export function Mmsf2WarRockSection({
  state,
  warRockWeapons,
  sourceSuggestions,
  missingWarRockWeaponSourceNames,
  resolveKnownSources,
  onWarRockWeaponChange,
  onWarRockWeaponSourcesChange,
}: {
  state: Mmsf2Sections;
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
      <div className="glass-panel-soft relative z-0 p-6 focus-within:z-20">
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
        game="mmsf2"
        version="berserker"
        nameSuggestions={warRockWeapons}
        sourceSuggestions={sourceSuggestions}
        missingNames={missingWarRockWeaponSourceNames}
        useKnownSourceSuggestions
        actionMode="owned"
        resolveKnownSources={resolveKnownSources}
      />
    </div>
  );
}
