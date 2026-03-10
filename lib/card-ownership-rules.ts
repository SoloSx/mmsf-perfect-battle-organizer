import { guideCardCatalogEntries } from "@/lib/guide-card-catalog";
import type { BuildCardEntry, GameId } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

type LimitedCardInfo = {
  name: string;
};

const limitedCardTokensByGame = new Map<GameId, Map<string, LimitedCardInfo>>();

for (const game of ["mmsf1", "mmsf2", "mmsf3"] as const) {
  const limitedCards = new Map<string, LimitedCardInfo>();

  for (const entry of guideCardCatalogEntries) {
    if (entry.game !== game) {
      continue;
    }

    const isVersionExclusiveGiga = entry.section === "giga" && entry.version !== null;
    const isDistributionCard = entry.details.some((detail) => detail.includes("配信"));

    if (!isVersionExclusiveGiga && !isDistributionCard) {
      continue;
    }

    const token = normalizeToken(entry.name);
    if (!limitedCards.has(token)) {
      limitedCards.set(token, { name: entry.name });
    }
  }

  limitedCardTokensByGame.set(game, limitedCards);
}

export function validateLimitedCardOwnership(game: GameId, entries: BuildCardEntry[]) {
  const limitedCards = limitedCardTokensByGame.get(game) ?? new Map<string, LimitedCardInfo>();
  const totalsByToken = new Map<string, { name: string; total: number }>();
  const errors: string[] = [];

  for (const entry of entries) {
    const name = entry.name.trim();
    if (!name) {
      continue;
    }

    const token = normalizeToken(name);
    const limitedCard = limitedCards.get(token);
    if (!limitedCard) {
      continue;
    }

    const current = totalsByToken.get(token) ?? { name: limitedCard.name, total: 0 };
    current.total += Number.isFinite(entry.quantity) ? Math.max(0, Math.trunc(entry.quantity)) : 0;
    totalsByToken.set(token, current);
  }

  for (const { name, total } of totalsByToken.values()) {
    if (total > 1) {
      errors.push(`カード「${name}」は1枚までです。`);
    }
  }

  return { errors };
}
