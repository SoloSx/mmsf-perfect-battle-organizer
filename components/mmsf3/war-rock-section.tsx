"use client";

import { SearchableSelectInput } from "@/components/searchable-select-input";
import { SourceListEditor } from "@/components/source-list-editor";
import { MMSF3_WAR_ROCK_WEAPON_OPTIONS, getMmsf3WarRockWeaponSources } from "@/lib/mmsf3/war-rock-weapons";
import type { NormalizedMmsf3State } from "@/lib/mmsf3/build-state";
import type { BuildSourceEntry, VersionId } from "@/lib/types";

export function Mmsf3WarRockSection({
  state,
  version,
  sourceSuggestions,
  missingWarRockWeaponSourceNames,
  onWarRockWeaponChange,
  onWarRockWeaponSourcesChange,
}: {
  state: NormalizedMmsf3State;
  version: VersionId;
  sourceSuggestions: string[];
  missingWarRockWeaponSourceNames: string[];
  onWarRockWeaponChange: (value: string) => void;
  onWarRockWeaponSourcesChange: (entries: BuildSourceEntry[]) => void;
}) {
  return (
    <>
      <div className="glass-panel-soft relative z-0 overflow-visible p-6 focus-within:z-30">
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-white">ウォーロック装備</label>
          <SearchableSelectInput
            value={state.warRockWeapon}
            onChange={onWarRockWeaponChange}
            options={MMSF3_WAR_ROCK_WEAPON_OPTIONS}
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
        game="mmsf3"
        version={version}
        nameSuggestions={MMSF3_WAR_ROCK_WEAPON_OPTIONS.map((option) => option.label)}
        sourceSuggestions={sourceSuggestions}
        missingNames={missingWarRockWeaponSourceNames}
        useKnownSourceSuggestions
        actionMode="owned"
        resolveKnownSources={(name) => getMmsf3WarRockWeaponSources(name)}
        emptyOwnedMessage="未所持のウォーロック装備はありません。すべて所持済みです。"
      />
    </>
  );
}
