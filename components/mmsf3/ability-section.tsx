"use client";

import { SearchableSelectInput, type SearchableSelectOption } from "@/components/searchable-select-input";
import { SourceListEditor } from "@/components/source-list-editor";
import { getMmsf3AbilityByLabel, getMmsf3AbilityOptionsForSlot, getMmsf3AbilitySelectionErrors, getMmsf3AbilitySources } from "@/lib/mmsf3/abilities";
import type { NormalizedMmsf3State } from "@/lib/mmsf3/build-state";
import type { BuildCardEntry, BuildSourceEntry, VersionId } from "@/lib/types";

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
    <div className="glass-panel-soft relative z-0 overflow-visible p-6 focus-within:z-30">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-white">アビリティ</label>
        <span className="text-xs text-white/45">合計P {totalCost}/{limit}</span>
      </div>
      <div className="mt-4 space-y-3">
        {entries.map((entry, index) => {
          const selectedAbility = getMmsf3AbilityByLabel(entry.name.trim());
          const options: SearchableSelectOption[] = getMmsf3AbilityOptionsForSlot(entries, index, version).map((option) => ({
            value: option.label,
            label: option.label,
          }));

          return (
            <div
              key={entry.id}
              className="relative z-0 grid gap-3 overflow-visible rounded-2xl border border-white/10 bg-white/6 p-4 focus-within:z-30 md:grid-cols-[minmax(0,1fr)_112px]"
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
    </div>
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
    <div className="relative z-0 overflow-visible focus-within:z-40">
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
    </div>
  );
}
