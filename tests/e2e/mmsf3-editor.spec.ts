import { expect, test } from "@playwright/test";

test("mmsf3 editor shows white card set and folder validation", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const whiteCardSetPanel = page
    .locator("label", { hasText: "ホワイトカードセット" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");
  await whiteCardSetPanel.locator("select").selectOption("01");
  await expect(whiteCardSetPanel).toContainText("プラズマガン / プラズマガン / エアスプレッド1 / ビートスイング1");

  const cardEditor = page
    .locator("label", { hasText: "対戦構築カード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await cardEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  await cardEditor.locator("input[placeholder='カード名']").first().fill("キャノン");
  await cardEditor.locator("input[type='number']").first().fill("6");

  await cardEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  await cardEditor.locator("input[placeholder='カード名']").nth(1).fill("スペードマグネッツ");
  await cardEditor.locator("input[type='number']").nth(1).fill("2");

  await expect(page.getByText("ノーマルカード「キャノン」は5枚までです。")).toBeVisible();
  await expect(page.getByText("メガカード「スペードマグネッツ」は1枚までです。")).toBeVisible();
});

test("mmsf3 editor includes supplemental card suggestions", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const cardEditor = page
    .locator("label", { hasText: "対戦構築カード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await cardEditor.getByRole("button", { name: "行を追加", exact: true }).click();

  const firstCardInput = cardEditor.locator("input[placeholder='カード名']").first();
  await firstCardInput.click();

  const listbox = cardEditor.getByRole("listbox");
  await expect(listbox).toBeVisible();

  const options = await listbox.getByRole("option").evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ""));

  expect(options.slice(0, 6)).toEqual([
    "キャノン",
    "プラスキャノン",
    "ヘビーキャノン",
    "インパクトキャノン",
    "プラズマガン",
    "プラズマガンＸ",
  ]);
  expect(options).toContain("ゴルゴンアイ");
  expect(options).toContain("ブライブレイク");
  expect(options).toContain("ライトオブセイント");
  expect(options).not.toContain("ホワイトカード");

  await firstCardInput.fill("レーダー");
  await expect(listbox.getByRole("option", { name: "レーダーミサイル" })).toBeVisible();

  await firstCardInput.press("ArrowDown");
  await firstCardInput.press("Enter");
  await expect(firstCardInput).toHaveValue("レーダーミサイル");

  await firstCardInput.click();
  await firstCardInput.press("ArrowDown");
  await firstCardInput.press("Enter");
  await expect(firstCardInput).toHaveValue("グランドウェーブ１");
});
