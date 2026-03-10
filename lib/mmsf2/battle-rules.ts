import { getCardSection } from "@/lib/guide-card-catalog";
import { isMmsf2BattleCardClass } from "@/lib/mmsf2/folder-cards";
import type { BuildCardEntry, VersionId } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

interface ClassifiedCardTotal {
  label: string;
  quantity: number;
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

export function validateMmsf2StarCards(starCards: BuildCardEntry[], version: VersionId) {
  const errors: string[] = [];
  const filledCards = starCards.filter((entry) => entry.name.trim());

  if (filledCards.length > 3) {
    errors.push("スターカードは3枚までです。");
  }

  const seen = new Set<string>();
  for (const entry of filledCards) {
    const token = normalizeToken(entry.name);
    if (seen.has(token)) {
      errors.push(`スターカード「${entry.name}」が重複しています。`);
    }
    seen.add(token);
  }

  for (const entry of filledCards) {
    const section = getCardSection("mmsf2", entry.name, version);
    if (section === "mega" || section === "giga" || section === "blank") {
      errors.push(`スターカード「${entry.name}」はスターカード一覧のカードのみ指定できます。`);
    }
  }

  return { errors };
}
