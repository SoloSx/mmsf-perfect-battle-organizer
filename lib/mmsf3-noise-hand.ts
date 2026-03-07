import { getMmsf3NoiseCardSelectionErrors, getMmsf3NoiseCardsByIds } from "@/lib/mmsf3-noise-cards";
import type {
  NoiseCardMark,
  NoiseCardRank,
  NoiseHandEvaluation,
  NoiseHandId,
  NoiseHandResult,
} from "@/lib/types";

type StandardNoiseCard = {
  mark: Exclude<NoiseCardMark, "★">;
  rank: NoiseCardRank;
};

const RANKS: NoiseCardRank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS: Array<Exclude<NoiseCardMark, "★">> = ["♥", "♦", "♠", "♣"];
const STRAIGHT_PATTERNS: NoiseCardRank[][] = [
  ["A", "2", "3", "4", "5"],
  ["2", "3", "4", "5", "6"],
  ["3", "4", "5", "6", "7"],
  ["4", "5", "6", "7", "8"],
  ["5", "6", "7", "8", "9"],
  ["6", "7", "8", "9", "10"],
  ["7", "8", "9", "10", "J"],
  ["8", "9", "10", "J", "Q"],
  ["9", "10", "J", "Q", "K"],
  ["10", "J", "Q", "K", "A"],
];
const STRAIGHT_KEY_SET = new Set(STRAIGHT_PATTERNS.map((pattern) => pattern.join(",")));

const HAND_PRIORITY: Record<NoiseHandId, number> = {
  "two-pair": 1,
  "three-card": 2,
  straight: 3,
  flush: 3,
  "full-house": 4,
  "four-card": 5,
  "straight-flush": 6,
  "royal-straight-flush": 7,
  "five-card": 8,
};

function buildResult(
  id: NoiseHandId,
  label: string,
  bonusEffect: string,
  flushSuit: Exclude<NoiseCardMark, "★"> | null = null,
): NoiseHandResult {
  return {
    id,
    no: HAND_PRIORITY[id],
    label,
    bonusEffect,
    flushSuit,
  };
}

function getStraightKey(cards: StandardNoiseCard[]) {
  const uniqueRanks = Array.from(new Set(cards.map((card) => card.rank)));

  if (uniqueRanks.length !== 5) {
    return null;
  }

  const rankSet = new Set(uniqueRanks);
  const matchedPattern = STRAIGHT_PATTERNS.find((pattern) => pattern.every((rank) => rankSet.has(rank)));

  return matchedPattern ? matchedPattern.join(",") : null;
}

function evaluateResolvedHand(cards: StandardNoiseCard[]) {
  const rankCounts = new Map<NoiseCardRank, number>();
  const suitCounts = new Map<Exclude<NoiseCardMark, "★">, number>();
  const straightKey = getStraightKey(cards);

  for (const card of cards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1);
    suitCounts.set(card.mark, (suitCounts.get(card.mark) ?? 0) + 1);
  }

  const groupedCounts = Array.from(rankCounts.values()).sort((left, right) => right - left);
  const flushSuit = suitCounts.size === 1 ? cards[0].mark : null;
  const isStraight = Boolean(straightKey && STRAIGHT_KEY_SET.has(straightKey));
  const isRoyalStraight = straightKey === "10,J,Q,K,A";

  if (groupedCounts[0] === 5) {
    return buildResult("five-card", "ファイブカード", "ステータスガード");
  }

  if (flushSuit && isRoyalStraight) {
    return buildResult("royal-straight-flush", "ロイヤルストレートフラッシュ", "オートロックオン", flushSuit);
  }

  if (flushSuit && isStraight) {
    return buildResult("straight-flush", "ストレートフラッシュ", "メガクラス+1\nギガクラス+1", flushSuit);
  }

  if (groupedCounts[0] === 4) {
    return buildResult("four-card", "フォーカード", "メガクラス+2");
  }

  if (groupedCounts[0] === 3 && groupedCounts[1] === 2) {
    return buildResult("full-house", "フルハウス", "HP+500");
  }

  if (flushSuit) {
    const flushBonusBySuit: Record<Exclude<NoiseCardMark, "★">, string> = {
      "♥": "スーパーアーマー",
      "♦": "エアシューズ",
      "♠": "フロートシューズ",
      "♣": "カワリミ\nHP+200",
    };

    return buildResult("flush", "フラッシュ", flushBonusBySuit[flushSuit], flushSuit);
  }

  if (isStraight) {
    return buildResult("straight", "ストレート", "HP+300");
  }

  if (groupedCounts[0] === 3) {
    return buildResult("three-card", "スリーカード", "なし");
  }

  const pairCount = groupedCounts.filter((count) => count === 2).length;
  if (pairCount === 2) {
    return buildResult("two-pair", "ツーペア", "なし");
  }

  return null;
}

function compareCandidateHands(left: NoiseHandResult | null, right: NoiseHandResult | null) {
  if (!left) {
    return right ? -1 : 0;
  }

  if (!right) {
    return 1;
  }

  if (left.no !== right.no) {
    return left.no - right.no;
  }

  if (left.id === right.id) {
    return 0;
  }

  if (left.id === "flush" || right.id === "straight") {
    return 1;
  }

  if (left.id === "straight" || right.id === "flush") {
    return -1;
  }

  return 0;
}

export function evaluateNoiseHand(noiseCardIds: string[]): NoiseHandEvaluation {
  const selectedCards = getMmsf3NoiseCardsByIds(noiseCardIds);
  const errors = getMmsf3NoiseCardSelectionErrors(noiseCardIds);
  const joker = selectedCards.find((card) => card.isJoker) ?? null;
  const fixedCards = selectedCards.filter((card) => !card.isJoker && card.rank) as Array<{
    mark: Exclude<NoiseCardMark, "★">;
    rank: NoiseCardRank;
  }>;

  if (errors.length > 0 || selectedCards.length < 5) {
    return {
      selectedCards,
      bestHand: null,
      bonusEffect: null,
      flushSuit: null,
      jokerSubstitutionNote: null,
      errors,
    };
  }

  if (!joker) {
    const bestHand = evaluateResolvedHand(fixedCards);
    return {
      selectedCards,
      bestHand,
      bonusEffect: bestHand?.bonusEffect ?? null,
      flushSuit: bestHand?.flushSuit ?? null,
      jokerSubstitutionNote: null,
      errors,
    };
  }

  let bestHand: NoiseHandResult | null = null;
  let jokerSubstitutionNote: string | null = null;

  for (const mark of SUITS) {
    for (const rank of RANKS) {
      const candidateCards = [...fixedCards, { mark, rank }];
      const candidateHand = evaluateResolvedHand(candidateCards);

      if (compareCandidateHands(candidateHand, bestHand) <= 0) {
        continue;
      }

      bestHand = candidateHand;
      jokerSubstitutionNote = candidateHand
        ? `${joker.cardName}を${mark}${rank}として扱い、${candidateHand.label}を成立させます。`
        : null;
    }
  }

  return {
    selectedCards,
    bestHand,
    bonusEffect: bestHand?.bonusEffect ?? null,
    flushSuit: bestHand?.flushSuit ?? null,
    jokerSubstitutionNote,
    errors,
  };
}
