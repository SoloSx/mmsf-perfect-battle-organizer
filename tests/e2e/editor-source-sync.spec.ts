import { expect, test } from "@playwright/test";

test("editor syncs ability sources when replacing an ability in the same row", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf2&version=berserker");

  const abilityEditor = page
    .locator("label", { hasText: "アビリティ" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]")
    .first();
  const abilitySourceEditor = page
    .locator("label", { hasText: "アビリティ入手方法" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");
  const visibleAbilityNames = abilitySourceEditor.locator("span.truncate");
  const abilityInputs = abilityEditor.getByRole("combobox");
  await expect(abilityInputs).toHaveCount(2);

  const firstAbilityInput = abilityInputs.nth(1);
  await firstAbilityInput.click();
  await firstAbilityInput.fill("アンダーシャツ");
  await abilityEditor.getByRole("option", { name: "アンダーシャツ/60" }).click();
  await expect(abilityInputs).toHaveCount(3);
  await expect(visibleAbilityNames.filter({ hasText: "アンダーシャツ/60" })).toHaveCount(1);

  await firstAbilityInput.click();
  await firstAbilityInput.fill("スーパーアーマー");
  await abilityEditor.getByRole("option", { name: "スーパーアーマー/600" }).click();
  await expect(abilityInputs).toHaveCount(3);
  await expect(visibleAbilityNames.filter({ hasText: "スーパーアーマー/600" })).toHaveCount(1);
  await expect(visibleAbilityNames.filter({ hasText: "アンダーシャツ/60" })).toHaveCount(0);
});

test("editor keeps exactly one trailing empty battle-card row while typing", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const cardEditor = page
    .locator("label", { hasText: "対戦構築カード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");
  const cardNameInputs = cardEditor.locator("input[placeholder='カード名']");

  await expect(cardNameInputs).toHaveCount(1);
  await cardNameInputs.first().fill("キャノン");
  await expect(cardNameInputs).toHaveCount(2);

  await cardNameInputs.nth(1).fill("プラスキャノン");
  await expect(cardNameInputs).toHaveCount(3);

  await expect(cardNameInputs.nth(2)).toHaveValue("");
});
