import { getCardSection } from "@/lib/guide-card-catalog";
import { isMmsf1EnhancementEnabled } from "@/lib/mmsf1/enhancement";
import type { BrotherProfile, BuildCardEntry, VersionId } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

function countMmsf1ClassCards(cardNames: string[], version: VersionId) {
  let megaTotal = 0;
  let gigaTotal = 0;

  for (const cardName of cardNames) {
    const trimmedName = cardName.trim();
    if (!trimmedName) {
      continue;
    }

    const section = getCardSection("mmsf1", trimmedName, version);
    if (section === "mega") {
      megaTotal += 1;
    }

    if (section === "giga") {
      gigaTotal += 1;
    }
  }

  return { megaTotal, gigaTotal };
}

export function validateMmsf1FolderCards(entries: BuildCardEntry[], version: VersionId, enhancement?: string) {
  const errors: string[] = [];
  const { megaTotal, gigaTotal } = entries.reduce(
    (totals, entry) => {
      const trimmedName = entry.name.trim();
      if (!trimmedName) {
        return totals;
      }

      const section = getCardSection("mmsf1", trimmedName, version);
      const quantity = Number.isFinite(entry.quantity) ? Math.max(0, Math.trunc(entry.quantity)) : 0;

      if (section === "mega") {
        totals.megaTotal += quantity;
      }

      if (section === "giga") {
        totals.gigaTotal += quantity;
      }

      return totals;
    },
    { megaTotal: 0, gigaTotal: 0 },
  );
  const enhancementEnabled = isMmsf1EnhancementEnabled(enhancement);

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

  if (enhancementEnabled) {
    if (megaTotal > 6) {
      errors.push("MMSF1 の強化On時、メガカードは6枚までです。");
    }

    if (gigaTotal > 6) {
      errors.push("MMSF1 の強化On時、ギガカードは6枚までです。");
    }
  } else if (megaTotal + gigaTotal > 2) {
    errors.push("MMSF1 のメガ・ギガカードは合計2枚までです。");
  }

  return {
    errors,
  };
}

export function validateMmsf1BrotherFavoriteCards(entries: BrotherProfile[], version: VersionId) {
  for (const brother of entries) {
    const { megaTotal, gigaTotal } = countMmsf1ClassCards(brother.favoriteCards, version);
    const megaGigaTotal = megaTotal + gigaTotal;

    if (megaGigaTotal > 2) {
      return {
        errors: ["MMSF1 のブラザー FAV カードでメガ・ギガカードは合計2枚までです。"],
      };
    }
  }

  return { errors: [] };
}
