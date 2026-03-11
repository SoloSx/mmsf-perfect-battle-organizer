type Mmsf2EnhancementId = "" | "berserker" | "shinobi" | "dinosaur" | "burai";

export interface Mmsf2EnhancementEffect {
  id: Exclude<Mmsf2EnhancementId, "">;
  label: string;
  hpBonus: number;
  attackBonus: number;
  rapidBonus: number;
  chargeBonus: number;
  gaugeBonus: number;
  megaBonus: number;
  gigaBonus: number;
  grantedAbilities: string[];
}

export const MMSF2_ENHANCEMENT_EFFECTS: Record<Exclude<Mmsf2EnhancementId, "">, Mmsf2EnhancementEffect> = {
  berserker: {
    id: "berserker",
    label: "ベルセルク",
    hpBonus: 800,
    attackBonus: 3,
    rapidBonus: 2,
    chargeBonus: 3,
    gaugeBonus: 3,
    megaBonus: 4,
    gigaBonus: 2,
    grantedAbilities: ["アンダーシャツ", "ファーストバリア"],
  },
  shinobi: {
    id: "shinobi",
    label: "シノビ",
    hpBonus: 700,
    attackBonus: 3,
    rapidBonus: 4,
    chargeBonus: 4,
    gaugeBonus: 3,
    megaBonus: 4,
    gigaBonus: 2,
    grantedAbilities: ["アンダーシャツ", "フロートシューズ"],
  },
  dinosaur: {
    id: "dinosaur",
    label: "ダイナソー",
    hpBonus: 990,
    attackBonus: 4,
    rapidBonus: 2,
    chargeBonus: 2,
    gaugeBonus: 2,
    megaBonus: 2,
    gigaBonus: 3,
    grantedAbilities: ["スーパーアーマー"],
  },
  burai: {
    id: "burai",
    label: "ブライ",
    hpBonus: 850,
    attackBonus: 4,
    rapidBonus: 4,
    chargeBonus: 4,
    gaugeBonus: 3,
    megaBonus: 2,
    gigaBonus: 1,
    grantedAbilities: ["アンダーシャツ", "フロートシューズ", "ファーストバリア", "ロックマンブライ"],
  },
};

export function getMmsf2EnhancementEffect(value: string) {
  if (!value || !(value in MMSF2_ENHANCEMENT_EFFECTS)) {
    return null;
  }

  return MMSF2_ENHANCEMENT_EFFECTS[value as keyof typeof MMSF2_ENHANCEMENT_EFFECTS];
}

export function getMmsf2EnhancementLabel(value: string) {
  return getMmsf2EnhancementEffect(value)?.label ?? null;
}

export function getMmsf2EnhancementStatSummary(value: string) {
  const effect = getMmsf2EnhancementEffect(value);
  if (!effect) {
    return null;
  }

  return `HP+${effect.hpBonus} / A+${effect.attackBonus} / R+${effect.rapidBonus} / C+${effect.chargeBonus} / Gauge+${effect.gaugeBonus} / Mega+${effect.megaBonus} / Giga+${effect.gigaBonus}`;
}
