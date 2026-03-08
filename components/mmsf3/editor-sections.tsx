"use client";

import { Mmsf3AbilitySection } from "@/components/mmsf3/ability-section";
import { Mmsf3RockmanSection } from "@/components/mmsf3/rockman-section";
import type { NormalizedMmsf3State } from "@/lib/mmsf3/build-state";
import type { BuildCardEntry, BuildSourceEntry, VersionId } from "@/lib/types";

export { Mmsf3BrotherRouletteSection } from "@/components/mmsf3/brother-roulette-section";

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
