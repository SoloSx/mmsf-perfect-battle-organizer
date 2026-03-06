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

export function validateMmsf3FolderCards(entries: BuildCardEntry[], version: VersionId) {
  const errors: string[] = [];
  const standardTotals = new Map<string, ClassifiedCardTotal>();
  const megaTotals = new Map<string, ClassifiedCardTotal>();
  const unknownCards = new Set<string>();
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
  }

  for (const { label, quantity } of standardTotals.values()) {
    if (quantity > 5) {
      errors.push(`ノーマルカード「${label}」は5枚までです。`);
    }
  }

  if (megaTotal > 5) {
    errors.push("メガカードは合計5枚までです。");
  }

  for (const { label, quantity } of megaTotals.values()) {
    if (quantity > 1) {
      errors.push(`メガカード「${label}」は1枚までです。`);
    }
  }

  if (gigaTotal > 1) {
    errors.push("ギガカードはフォルダに1枚までです。");
  }

  if (unknownCards.size > 0) {
    errors.push(`カード種別を判定できないカードがあります: ${Array.from(unknownCards).join("、")}`);
  }

  return { errors };
}
