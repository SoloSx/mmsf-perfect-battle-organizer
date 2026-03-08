import type { SearchableSelectOption } from "@/components/searchable-select-input";
import {
  MMSF3_BROTHER_ROULETTE_NOISE_OPTIONS,
  MMSF3_BROTHER_ROULETTE_SLOT_TYPE_OPTIONS,
  MMSF3_BROTHER_VERSION_OPTIONS,
  MMSF3_MEGA_CARD_OPTIONS,
  MMSF3_NOISE_OPTIONS,
  MMSF3_REZON_CARD_OPTIONS,
  MMSF3_SSS_LEVEL_OPTIONS,
  MMSF3_WHITE_CARD_SET_OPTIONS,
} from "@/lib/mmsf3/roulette-data";

export const EMPTY_SEARCHABLE_SELECT_OPTION: SearchableSelectOption = { value: "", label: "未選択" };

export const MMSF3_BROTHER_ROULETTE_NOISE_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_BROTHER_ROULETTE_NOISE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

export const MMSF3_BROTHER_ROULETTE_REZON_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_REZON_CARD_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

export const MMSF3_BROTHER_ROULETTE_SLOT_TYPE_SELECT_OPTIONS: SearchableSelectOption[] =
  MMSF3_BROTHER_ROULETTE_SLOT_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

export const MMSF3_BROTHER_VERSION_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_BROTHER_VERSION_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

export const MMSF3_PLAYER_NOISE_OPTIONS = MMSF3_NOISE_OPTIONS
  .filter((option) => option.value !== "00")
  .map((option) => `${option.label}ノイズ`);

export const MMSF3_PLAYER_REZON_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_REZON_CARD_OPTIONS.map((option) => ({ value: option.label, label: option.label })),
];

export const MMSF3_SSS_LEVEL_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_SSS_LEVEL_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

export const MMSF3_BROTHER_ROULETTE_WHITE_CARD_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_WHITE_CARD_SET_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

export const MMSF3_BROTHER_ROULETTE_MEGA_SELECT_OPTIONS: SearchableSelectOption[] = [
  EMPTY_SEARCHABLE_SELECT_OPTION,
  ...MMSF3_MEGA_CARD_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];
