"use client";

import { SearchableSelectInput, type SearchableSelectOption } from "@/components/searchable-select-input";
import { EMPTY_SEARCHABLE_SELECT_OPTION } from "@/components/mmsf3/select-options";
import { SourceListEditor } from "@/components/source-list-editor";
import {
  getMmsf2AbilityByLabel,
  getMmsf2AbilityOptionsForSlot,
  getMmsf2AbilitySelectionErrors,
  getMmsf2AbilitySources,
  isMmsf2VersionDefaultAbility,
} from "@/lib/mmsf2/abilities";
import type { BuildCardEntry, BuildSourceEntry, VersionId } from "@/lib/types";
import { createId } from "@/lib/utils";

function buildEmptyCard(): BuildCardEntry {
  return { id: createId(), name: "", quantity: 1, notes: "", isRegular: false };
}

export function Mmsf2AbilitySection({
  entries,
  abilitySources,
  defaultTribeAbilityEnabled,
  kokouNoKakera,
  version,
  abilityNameSuggestions,
  sourceSuggestions,
  missingAbilitySourceNames,
  onAbilitiesChange,
  onAbilitySourcesChange,
  onDefaultTribeAbilityEnabledChange,
}: {
  entries: BuildCardEntry[];
  abilitySources: BuildSourceEntry[];
  defaultTribeAbilityEnabled: boolean;
  kokouNoKakera: boolean;
  version: VersionId;
  abilityNameSuggestions: string[];
  sourceSuggestions: string[];
  missingAbilitySourceNames: string[];
  onAbilitiesChange: (entries: BuildCardEntry[]) => void;
  onAbilitySourcesChange: (entries: BuildSourceEntry[]) => void;
  onDefaultTribeAbilityEnabledChange: (value: boolean) => void;
}) {
  const { totalCost, limit } = getMmsf2AbilitySelectionErrors(entries, kokouNoKakera, version, defaultTribeAbilityEnabled);

  return (
    <div className="mt-4 grid gap-4">
      <div className="glass-panel-soft relative z-0 p-6 focus-within:z-20">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-white">アビリティ</label>
          <span className="text-xs text-white/45">合計P {totalCost}/{limit}</span>
        </div>
        <div className="mt-4 space-y-3">
          {entries.map((entry, index) => {
            const selectedAbility = getMmsf2AbilityByLabel(entry.name, version);
            const isDefaultAbility = isMmsf2VersionDefaultAbility(entry.name, version);
            const options: SearchableSelectOption[] = [
              EMPTY_SEARCHABLE_SELECT_OPTION,
              ...getMmsf2AbilityOptionsForSlot(entries, index, version).map((option) => ({
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
                    const selectedOption = getMmsf2AbilityByLabel(value, version);
                    onAbilitiesChange(
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
                  onClick={() => {
                    if (isDefaultAbility) {
                      onDefaultTribeAbilityEnabledChange(false);
                    }

                    onAbilitiesChange(entries.filter((item) => item.id !== entry.id));
                  }}
                >
                  削除
                </button>
              </div>
            );
          })}
        </div>
        <button type="button" className="secondary-button mt-4" onClick={() => onAbilitiesChange([...entries, buildEmptyCard()])}>
          行を追加
        </button>
      </div>

      <SourceListEditor
        title="アビリティ入手方法"
        entries={abilitySources}
        onChange={onAbilitySourcesChange}
        game="mmsf2"
        version={version}
        nameSuggestions={abilityNameSuggestions}
        sourceSuggestions={sourceSuggestions}
        missingNames={missingAbilitySourceNames}
        useKnownSourceSuggestions
        actionMode="owned"
        resolveKnownSources={(name) => getMmsf2AbilitySources(name, version)}
        emptyOwnedMessage="未所持のアビリティはありません。すべて所持済みです。"
      />
    </div>
  );
}
