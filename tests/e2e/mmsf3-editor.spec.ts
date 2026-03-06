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

test("mmsf3 export preview keeps full quantity and horizontal card art", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const cardEditor = page
    .locator("label", { hasText: "対戦構築カード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await cardEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  await cardEditor.locator("input[placeholder='カード名']").first().fill("キャノン");
  await cardEditor.locator("input[type='number']").first().fill("3");

  const battleCardsSection = page
    .locator("h3", { hasText: "Battle Cards" })
    .locator("xpath=ancestor::section[1]");

  await expect(battleCardsSection).toContainText("3 tiles");
  await expect(battleCardsSection.locator("img")).toHaveCount(3);

  const cardImages = battleCardsSection.locator("img");
  const firstCardBox = await cardImages.first().boundingBox();
  const secondCardBox = await cardImages.nth(1).boundingBox();
  expect(firstCardBox).not.toBeNull();
  expect(firstCardBox!.width).toBeGreaterThan(firstCardBox!.height);

  expect(secondCardBox).not.toBeNull();
  expect(Math.abs(secondCardBox!.x - (firstCardBox!.x + firstCardBox!.width))).toBeLessThan(1);

  const firstCardRadius = await cardImages.first().evaluate((node) =>
    window.getComputedStyle(node.parentElement as HTMLElement).borderTopLeftRadius,
  );
  expect(firstCardRadius).toBe("0px");
});

test("mmsf3 export preview renders 30 battle cards in a 10x3 grid", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const cardEditor = page
    .locator("label", { hasText: "対戦構築カード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await cardEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  await cardEditor.locator("input[placeholder='カード名']").first().fill("キャノン");
  await cardEditor.locator("input[type='number']").first().fill("30");

  const battleCardsSection = page
    .locator("h3", { hasText: "Battle Cards" })
    .locator("xpath=ancestor::section[1]");

  await expect(battleCardsSection).toContainText("30 tiles");
  await expect(battleCardsSection.locator("img")).toHaveCount(30);

  const cardImages = battleCardsSection.locator("img");
  const firstCardBox = await cardImages.first().boundingBox();
  const tenthCardBox = await cardImages.nth(9).boundingBox();
  const eleventhCardBox = await cardImages.nth(10).boundingBox();

  expect(firstCardBox).not.toBeNull();
  expect(tenthCardBox).not.toBeNull();
  expect(eleventhCardBox).not.toBeNull();

  expect(Math.abs(tenthCardBox!.y - firstCardBox!.y)).toBeLessThan(1);
  expect(eleventhCardBox!.y).toBeGreaterThan(firstCardBox!.y + firstCardBox!.height - 1);
});

test("mmsf3 editor allows only one REG card and marks it in export preview", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const cardEditor = page
    .locator("label", { hasText: "対戦構築カード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await cardEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  const firstCardInput = cardEditor.locator("input[placeholder='カード名']").first();
  await firstCardInput.fill("キャノン");
  await firstCardInput.press("Escape");

  await cardEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  const secondCardInput = cardEditor.locator("input[placeholder='カード名']").nth(1);
  await secondCardInput.fill("プラスキャノン");
  await secondCardInput.press("Escape");

  const regularButtons = cardEditor.getByRole("button", { name: "REG" });
  await regularButtons.first().click();
  await expect(regularButtons.first()).toHaveAttribute("aria-pressed", "true");
  await expect(regularButtons.nth(1)).toHaveAttribute("aria-pressed", "false");

  await regularButtons.nth(1).click();
  await expect(regularButtons.first()).toHaveAttribute("aria-pressed", "false");
  await expect(regularButtons.nth(1)).toHaveAttribute("aria-pressed", "true");

  const battleCardsSection = page
    .locator("h3", { hasText: "Battle Cards" })
    .locator("xpath=ancestor::section[1]");
  const regularCardTile = battleCardsSection.locator("[data-regular-card='true']");
  const regularCardOverlay = battleCardsSection.locator("[data-regular-card-overlay='true']");

  await expect(regularCardTile).toHaveCount(1);
  await expect(regularCardOverlay).toHaveCount(1);

  const regularCardBorder = await regularCardOverlay.evaluate((node) => ({
    borderStyle: window.getComputedStyle(node as HTMLElement).borderStyle,
    borderColor: window.getComputedStyle(node as HTMLElement).borderTopColor,
    borderWidth: window.getComputedStyle(node as HTMLElement).borderTopWidth,
    boxShadow: window.getComputedStyle(node as HTMLElement).boxShadow,
  }));
  expect(regularCardBorder.borderStyle).toBe("solid");
  expect(regularCardBorder.borderColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(regularCardBorder.borderWidth).toBe("5px");
  expect(regularCardBorder.boxShadow).not.toBe("none");
});
