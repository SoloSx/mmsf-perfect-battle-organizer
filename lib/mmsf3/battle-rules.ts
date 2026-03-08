import { isMmsf3GigaCardAllowedInVersion } from "@/lib/mmsf3/giga-version-rules";
import { getMmsf3GigaCardOptionByLabel } from "@/lib/mmsf3/roulette-data";
import { VERSION_LABELS } from "@/lib/rules";
import { getCardSection } from "@/lib/guide-card-catalog";
import type { BuildCardEntry, VersionId } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

type Mmsf3BattleCardClass = "standard" | "mega" | "giga";

interface ClassifiedCardTotal {
  label: string;
  quantity: number;
}

function isMmsf3BattleCardClass(value: string | null): value is Mmsf3BattleCardClass {
  return value === "standard" || value === "mega" || value === "giga";
}

function addCardTotal(map: Map<string, ClassifiedCardTotal>, token: string, label: string, quantity: number) {
  const existing = map.get(token);

  if (existing) {
    existing.quantity += quantity;
    return;
  }

  map.set(token, { label, quantity });
}

export function validateMmsf3FolderCards(
  entries: BuildCardEntry[],
  version: VersionId,
  classBonuses: { megaBonus?: number; gigaBonus?: number } = {},
) {
  const mmsf3Version = version as Extract<VersionId, "black-ace" | "red-joker">;
  const errors: string[] = [];
  const standardTotals = new Map<string, ClassifiedCardTotal>();
  const megaTotals = new Map<string, ClassifiedCardTotal>();
  const unknownCards = new Set<string>();
  const megaLimit = 5 + (classBonuses.megaBonus ?? 0);
  const gigaLimit = 1 + (classBonuses.gigaBonus ?? 0);
  let megaTotal = 0;
  let gigaTotal = 0;

  for (const entry of entries) {
    const name = entry.name.trim();
    if (!name) {
      continue;
    }

    const quantity = Number.isFinite(entry.quantity) ? Math.max(1, entry.quantity) : 0;
    const section = getCardSection("mmsf3", name, version);
    const token = normalizeToken(name);

    if (!isMmsf3BattleCardClass(section)) {
      unknownCards.add(name);
      continue;
    }

    if (section === "standard") {
      addCardTotal(standardTotals, token, name, quantity);
      continue;
    }

    if (section === "mega") {
      megaTotal += quantity;
      addCardTotal(megaTotals, token, name, quantity);
      continue;
    }

    gigaTotal += quantity;
    const gigaOption = getMmsf3GigaCardOptionByLabel(name);
    if (gigaOption && !isMmsf3GigaCardAllowedInVersion(gigaOption.value, mmsf3Version)) {
      errors.push(`ギガカード「${gigaOption.label}」は${VERSION_LABELS[mmsf3Version]}では使用できません。`);
    }
  }

  for (const { label, quantity } of standardTotals.values()) {
    if (quantity > 5) {
      errors.push(`ノーマルカード「${label}」は5枚までです。`);
    }
  }

  if (megaTotal > megaLimit) {
    errors.push(`メガカードは合計${megaLimit}枚までです。`);
  }

  for (const { label, quantity } of megaTotals.values()) {
    if (quantity > 1) {
      errors.push(`メガカード「${label}」は1枚までです。`);
    }
  }

  if (gigaTotal > gigaLimit) {
    errors.push(`ギガカードはフォルダに${gigaLimit}枚までです。`);
  }

  if (unknownCards.size > 0) {
    errors.push(`カード種別を判定できないカードがあります: ${Array.from(unknownCards).join("、")}`);
  }

  return { errors };
}
