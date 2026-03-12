export function normalizeBrotherFavoriteCardSlots(favoriteCards: string[] | undefined) {
  return (favoriteCards ?? []).map((favoriteCardName) => favoriteCardName.trim())
}
