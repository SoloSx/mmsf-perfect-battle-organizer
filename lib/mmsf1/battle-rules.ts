import { getCardSection } from "@/lib/guide-card-catalog";
import type { BrotherProfile, BuildCardEntry, VersionId } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

function countMmsf1MegaGigaCards(cardNames: string[], version: VersionId) {
  let megaGigaTotal = 0;

  for (const cardName of cardNames) {
    const trimmedName = cardName.trim();
    if (!trimmedName) {
      continue;
    }

    const section = getCardSection("mmsf1", trimmedName, version);
    if (section === "mega" || section === "giga") {
      megaGigaTotal += 1;
    }
  }

  return megaGigaTotal;
}

export function validateMmsf1FolderCards(entries: BuildCardEntry[], version: VersionId) {
  const errors: string[] = [];
  const megaGigaTotal = entries.reduce((sum, entry) => {
    const trimmedName = entry.name.trim();
    if (!trimmedName) {
      return sum;
    }

    const section = getCardSection("mmsf1", trimmedName, version);
    if (section !== "mega" && section !== "giga") {
      return sum;
    }

    return sum + (Number.isFinite(entry.quantity) ? Math.max(0, Math.trunc(entry.quantity)) : 0);
  }, 0);

  const standardCardTotals = new Map<string, { name: string; quantity: number }>();
  for (const entry of entries) {
    const trimmedName = entry.name.trim();
    if (!trimmedName) {
      continue;
    }

    const section = getCardSection("mmsf1", trimmedName, version);
    if (section !== "standard") {
      continue;
    }

    const token = normalizeToken(trimmedName);
    const current = standardCardTotals.get(token) ?? { name: trimmedName, quantity: 0 };
    current.quantity += Number.isFinite(entry.quantity) ? Math.max(0, Math.trunc(entry.quantity)) : 0;
    standardCardTotals.set(token, current);
  }

  for (const { name, quantity } of standardCardTotals.values()) {
    if (quantity > 3) {
      errors.push(`MMSF1 の通常カード「${name}」は3枚までです。`);
    }
  }

  if (megaGigaTotal > 2) {
    errors.push("MMSF1 のメガ・ギガカードは合計2枚までです。");
  }

  return {
    errors,
  };
}

export function validateMmsf1BrotherFavoriteCards(entries: BrotherProfile[], version: VersionId) {
  for (const brother of entries) {
    const megaGigaTotal = countMmsf1MegaGigaCards(brother.favoriteCards, version);

    if (megaGigaTotal > 2) {
      return {
        errors: ["MMSF1 のブラザー FAV カードでメガ・ギガカードは合計2枚までです。"],
      };
    }
  }

  return { errors: [] };
}
