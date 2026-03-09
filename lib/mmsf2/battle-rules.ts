import { getCardSection } from "@/lib/guide-card-catalog";
import type { BuildCardEntry, VersionId } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

type Mmsf2BattleCardClass = "standard" | "mega" | "giga";

interface ClassifiedCardTotal {
  label: string;
  quantity: number;
}

function isMmsf2BattleCardClass(value: string | null): value is Mmsf2BattleCardClass {
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

export function validateMmsf2FolderCards(entries: BuildCardEntry[], version: VersionId) {
  const errors: string[] = [];
  const cardTotals = new Map<string, ClassifiedCardTotal>();
  const unknownCards = new Set<string>();
  let megaTotal = 0;
  let gigaTotal = 0;

  for (const entry of entries) {
    const name = entry.name.trim();
    if (!name) {
      continue;
    }

    const quantity = Number.isFinite(entry.quantity) ? Math.max(1, entry.quantity) : 0;
    const section = getCardSection("mmsf2", name, version);
    const token = normalizeToken(name);

    if (!isMmsf2BattleCardClass(section)) {
      unknownCards.add(name);
      addCardTotal(cardTotals, token, name, quantity);
      continue;
    }

    addCardTotal(cardTotals, token, name, quantity);

    if (section === "mega") {
      megaTotal += quantity;
    }

    if (section === "giga") {
      gigaTotal += quantity;
    }
  }

  for (const { label, quantity } of cardTotals.values()) {
    if (quantity > 3) {
      errors.push(`同名カード「${label}」はフォルダ内3枚までです。`);
    }
  }

  if (gigaTotal > 1) {
    errors.push("ギガカードはフォルダ内1枚までです。");
  }

  if (megaTotal + gigaTotal > 2) {
    errors.push("メガ+ギガカードはフォルダ内合計2枚までです。");
  }

  if (unknownCards.size > 0) {
    errors.push(`カード種別を判定できないカードがあります: ${Array.from(unknownCards).join("、")}`);
  }

  return { errors };
}

export function validateMmsf2StarCards(starCards: string[], version: VersionId) {
  const errors: string[] = [];

  if (starCards.length > 3) {
    errors.push("スターカードは3枚までです。");
  }

  const seen = new Set<string>();
  for (const card of starCards) {
    const token = normalizeToken(card);
    if (seen.has(token)) {
      errors.push(`スターカード「${card}」が重複しています。`);
    }
    seen.add(token);
  }

  for (const card of starCards) {
    const section = getCardSection("mmsf2", card, version);
    if (section === "mega" || section === "giga") {
      errors.push(`スターカード「${card}」はスタンダードカード（★1）のみ指定できます。`);
    }
  }

  return { errors };
}
