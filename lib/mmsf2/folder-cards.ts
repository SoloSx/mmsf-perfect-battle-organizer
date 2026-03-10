import { getCardSection, guideCardCatalogEntries } from "@/lib/guide-card-catalog";
import type { BuildCardEntry, VersionId } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

export type Mmsf2BattleCardClass = "standard" | "mega" | "giga";
export type Mmsf2FolderEntryKind = "normal" | "star" | "blank";

export interface Mmsf2BlankCardDefinition {
  code: string;
  number: number;
  displayName: string;
  contentKey: string;
  contentToken: string;
  classType: Mmsf2BattleCardClass;
  duplicateKey: string;
}

export interface Mmsf2ResolvedFolderCard {
  entryId: string;
  entryKind: Mmsf2FolderEntryKind;
  displayName: string;
  contentKey: string;
  contentToken: string;
  classType: Mmsf2BattleCardClass;
  duplicateKey: string;
  quantity: number;
  blankCode: string | null;
}

export interface Mmsf2UnresolvedFolderCard {
  entryId: string;
  entryKind: Mmsf2FolderEntryKind;
  displayName: string;
}

function getMmsf2BlankCardClass(prefix: string): Mmsf2BattleCardClass {
  switch (prefix) {
    case "S":
      return "standard";
    case "M":
      return "mega";
    case "G":
      return "giga";
    default:
      throw new Error(`Unexpected MMSF2 blank card prefix: ${prefix}`);
  }
}

export function isMmsf2BattleCardClass(value: string | null): value is Mmsf2BattleCardClass {
  return value === "standard" || value === "mega" || value === "giga";
}

function getMmsf2StarBaseName(name: string) {
  return name.trim().replace(/[★☆][123]$/u, "").trim();
}

export const MMSF2_BLANK_CARD_DEFINITIONS: Mmsf2BlankCardDefinition[] = guideCardCatalogEntries
  .filter((entry) => entry.game === "mmsf2" && entry.section === "blank")
  .map((entry) => {
    const match = entry.name.match(/^([SMG])-(\d+)\s+(.+)$/u);

    if (!match) {
      throw new Error(`Unexpected MMSF2 blank card label: ${entry.name}`);
    }

    const [, prefix, rawNumber, rawContentKey] = match;
    const contentKey = rawContentKey.trim();
    const contentToken = normalizeToken(contentKey);

    return {
      code: `${prefix}-${rawNumber}`,
      number: Number(rawNumber),
      displayName: entry.name,
      contentKey,
      contentToken,
      classType: getMmsf2BlankCardClass(prefix),
      duplicateKey: `blank:${contentToken}`,
    };
  });

const blankDefinitionByDisplayToken = new Map<string, Mmsf2BlankCardDefinition>();
const blankDefinitionsByContentToken = new Map<string, Mmsf2BlankCardDefinition[]>();

for (const definition of MMSF2_BLANK_CARD_DEFINITIONS) {
  blankDefinitionByDisplayToken.set(normalizeToken(definition.displayName), definition);

  const grouped = blankDefinitionsByContentToken.get(definition.contentToken) ?? [];
  grouped.push(definition);
  blankDefinitionsByContentToken.set(definition.contentToken, grouped);
}

export function getMmsf2BlankCardDefinition(name: string) {
  const token = normalizeToken(name.trim());
  const directMatch = blankDefinitionByDisplayToken.get(token);
  if (directMatch) {
    return directMatch;
  }

  const byContent = blankDefinitionsByContentToken.get(token) ?? [];
  return byContent.length === 1 ? byContent[0] : null;
}

export function resolveMmsf2FolderCard(
  entry: Pick<BuildCardEntry, "id" | "name" | "quantity">,
  entryKind: Mmsf2FolderEntryKind,
  version: VersionId,
): Mmsf2ResolvedFolderCard | null {
  const displayName = entry.name.trim();
  if (!displayName) {
    return null;
  }

  const quantity = Number.isFinite(entry.quantity) ? Math.max(1, Math.trunc(entry.quantity)) : 1;

  if (entryKind === "blank") {
    const definition = getMmsf2BlankCardDefinition(displayName);
    if (!definition) {
      return null;
    }

    return {
      entryId: entry.id,
      entryKind,
      displayName,
      contentKey: definition.contentKey,
      contentToken: definition.contentToken,
      classType: definition.classType,
      duplicateKey: definition.duplicateKey,
      quantity,
      blankCode: definition.code,
    };
  }

  const contentKey = entryKind === "star" ? getMmsf2StarBaseName(displayName) : displayName;
  const classType = getCardSection("mmsf2", contentKey, version);
  if (!isMmsf2BattleCardClass(classType)) {
    return null;
  }

  const contentToken = normalizeToken(contentKey);

  return {
    entryId: entry.id,
    entryKind,
    displayName,
    contentKey,
    contentToken,
    classType,
    duplicateKey: `${entryKind}:${classType}:${contentToken}`,
    quantity,
    blankCode: null,
  };
}

export function resolveMmsf2FolderCards(
  folderCards: BuildCardEntry[],
  starCards: BuildCardEntry[],
  blankCards: BuildCardEntry[],
  version: VersionId,
) {
  const resolvedCards: Mmsf2ResolvedFolderCard[] = [];
  const unresolvedCards: Mmsf2UnresolvedFolderCard[] = [];

  const appendResolved = (entries: BuildCardEntry[], entryKind: Mmsf2FolderEntryKind) => {
    for (const entry of entries) {
      const resolved = resolveMmsf2FolderCard(entry, entryKind, version);

      if (!resolved) {
        const displayName = entry.name.trim();
        if (displayName) {
          unresolvedCards.push({
            entryId: entry.id,
            entryKind,
            displayName,
          });
        }
        continue;
      }

      resolvedCards.push(resolved);
    }
  };

  appendResolved(folderCards, "normal");
  appendResolved(starCards, "star");
  appendResolved(blankCards, "blank");

  return { resolvedCards, unresolvedCards };
}
