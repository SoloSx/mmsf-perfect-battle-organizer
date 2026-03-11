const LEGACY_MMSF1_ENHANCEMENT_VALUES = new Set(["fire_leo", "ice_pegasus", "green_dragon", "on"]);

export function normalizeMmsf1EnhancementValue(value: string | null | undefined) {
  return LEGACY_MMSF1_ENHANCEMENT_VALUES.has((value ?? "").trim()) ? "on" : "";
}

export function isMmsf1EnhancementEnabled(value: string | null | undefined) {
  return normalizeMmsf1EnhancementValue(value) === "on";
}

export function getMmsf1EnhancementLabel(value: string | null | undefined) {
  return isMmsf1EnhancementEnabled(value) ? "強化On" : "強化Off";
}
