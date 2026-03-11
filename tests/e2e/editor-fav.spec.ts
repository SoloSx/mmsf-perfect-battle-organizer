import { expect, test, type Locator } from "@playwright/test";

async function fillCardRow(cardEditor: Locator, rowIndex: number, name: string, quantity: string, favoriteCount: string) {
  await cardEditor.locator("input[placeholder='カード名']").nth(rowIndex).fill(name);
  await cardEditor.locator("input[type='number']").nth(rowIndex * 2).fill(quantity);
  await cardEditor.locator("input[type='number']").nth(rowIndex * 2 + 1).fill(favoriteCount);
}

test("mmsf1 editor allows partial FAV counts and marks the same number of tiles in export preview", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf1&version=pegasus");

  const cardEditor = page
    .locator("label", { hasText: "対戦構築カード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await cardEditor.getByRole("button", { name: "行を追加", exact: true }).click();

  await fillCardRow(cardEditor, 0, "キャノン", "4", "2");
  await fillCardRow(cardEditor, 1, "プラスキャノン", "4", "4");

  await expect(page.getByText("FAV カードは6枚指定してください。")).toHaveCount(0);

  const battleCardsSection = page
    .locator("h3", { hasText: "Battle Cards" })
    .locator("xpath=ancestor::section[1]");

  await expect(battleCardsSection.locator("[data-regular-card-overlay='true']")).toHaveCount(6);
});

test("mmsf2 editor allows partial FAV counts and marks only the selected copies in export preview", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf2&version=berserker");

  const cardEditor = page
    .locator("label", { hasText: "対戦構築カード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await cardEditor.getByRole("button", { name: "行を追加", exact: true }).click();

  await fillCardRow(cardEditor, 0, "キャノン", "4", "2");
  await fillCardRow(cardEditor, 1, "プラスキャノン", "2", "2");

  await expect(page.getByText("FAV カードは4枚指定してください。")).toHaveCount(0);

  const battleCardsSection = page
    .locator("h3", { hasText: "Battle Cards" })
    .locator("xpath=ancestor::section[1]");

  await expect(battleCardsSection.locator("[data-regular-card-overlay='true']")).toHaveCount(4);
});
