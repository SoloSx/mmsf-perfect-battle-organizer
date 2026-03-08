import { expect, test } from "@playwright/test";

test("editor syncs ability sources when replacing an ability in the same row", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf1&version=pegasus");

  const abilityEditor = page
    .locator("label", { hasText: "アビリティ" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]")
    .first();
  const abilitySourceEditor = page
    .locator("label", { hasText: "アビリティ入手方法" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");
  const visibleAbilityNames = abilitySourceEditor.locator("span.truncate");

  await abilityEditor.getByRole("button", { name: "行を追加", exact: true }).click();

  const firstAbilityInput = abilityEditor.locator("input[placeholder='カード名']").first();
  await firstAbilityInput.fill("エアシューズ");
  await expect(visibleAbilityNames.filter({ hasText: "エアシューズ" })).toHaveCount(1);

  await firstAbilityInput.fill("スーパーアーマー");
  await expect(visibleAbilityNames.filter({ hasText: "スーパーアーマー" })).toHaveCount(1);
  await expect(visibleAbilityNames.filter({ hasText: "エアシューズ" })).toHaveCount(0);
});
