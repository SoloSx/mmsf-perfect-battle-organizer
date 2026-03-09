"use client";

import { SearchableSelectInput } from "@/components/searchable-select-input";
import type { Mmsf1Sections } from "@/lib/types";

export function Mmsf1EditorSections({
  state,
  warRockWeapons,
  onWarRockWeaponChange,
  onBrotherBandModeChange,
  onVersionFeatureChange,
  onCrossBrotherNotesChange,
}: {
  state: Mmsf1Sections;
  warRockWeapons: string[];
  onWarRockWeaponChange: (value: string) => void;
  onBrotherBandModeChange: (value: string) => void;
  onVersionFeatureChange: (value: string) => void;
  onCrossBrotherNotesChange: (value: string) => void;
}) {
  const weaponOptions = warRockWeapons.map((item) => ({ value: item, label: item }));

  return (
    <div className="mt-4 grid gap-4">
      <SearchableSelectInput
        value={state.warRockWeapon}
        onChange={onWarRockWeaponChange}
        options={weaponOptions}
        placeholder="ウォーロック装備を選択"
        className="field-shell"
      />
      <input
        value={state.brotherBandMode}
        onChange={(event) => onBrotherBandModeChange(event.target.value)}
        placeholder="ブラザーバンド運用メモ"
        className="field-shell"
      />
      <textarea
        value={state.versionFeature}
        onChange={(event) => onVersionFeatureChange(event.target.value)}
        placeholder="版差・特殊仕様"
        className="field-shell min-h-28"
      />
      <textarea
        value={state.crossBrotherNotes}
        onChange={(event) => onCrossBrotherNotesChange(event.target.value)}
        placeholder="クロスブラザーバンド系メモ"
        className="field-shell min-h-28"
      />
    </div>
  );
}
