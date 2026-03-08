import { expect, test, type Locator } from "@playwright/test";

async function selectNoiseCard(panel: Locator, index: number, searchText: string, optionName: string) {
  const input = panel.getByRole("combobox").nth(index);
  await input.click();
  await input.fill(searchText);
  await panel.getByRole("option", { name: optionName }).click();
}

async function selectAbilityOption(panel: Locator, index: number, searchText: string, optionName: string) {
  const input = panel.getByRole("combobox").nth(index);
  await input.click();
  await input.fill(searchText);
  await panel.getByRole("option", { name: optionName }).click();
}

async function selectBrotherSlotType(slotCard: Locator, optionName: string) {
  const input = slotCard.getByRole("combobox").nth(0);
  await input.click();
  await input.fill(optionName);
  await slotCard.getByRole("option", { name: optionName }).click();
}

async function selectBrotherSss(slotCard: Locator, searchText: string, optionName: string) {
  const input = slotCard.getByRole("combobox").nth(1);
  await input.click();
  await input.fill(searchText);
  await slotCard.getByRole("option", { name: optionName }).click();
}

async function selectBrotherVersion(slotCard: Locator, searchText: string, optionName: string) {
  const input = slotCard.getByRole("combobox").nth(1);
  await input.click();
  await input.fill(searchText);
  await slotCard.getByRole("option", { name: optionName }).click();
}

test("mmsf3 editor shows folder validation", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

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

  const validationPanel = page
    .getByText("バリデーション", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel')][1]");
  await expect(validationPanel).toContainText("カード総数: 8 / 30");
});

test("mmsf3 editor validates version-exclusive giga cards for player and brother settings", async ({ page }) => {
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
  await firstCardInput.fill("Gメテオ");
  await expect(cardEditor.getByRole("option", { name: "Ｇメテオレーザー" })).toHaveCount(0);

  await firstCardInput.fill("Gメテオレイザー");
  await cardEditor.locator("input[type='number']").first().fill("1");

  await expect(page.getByText("ギガカード「Gメテオレイザー」はブラックエースでは使用できません。")).toBeVisible();

  const brotherEditor = page
    .locator("label", { hasText: "ブラザー情報" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");
  const topLeftCard = brotherEditor
    .getByText("左上", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");
  const topLeftInputs = topLeftCard.getByRole("combobox");

  await selectBrotherVersion(topLeftCard, "ブラック", "ブラックエース");
  await topLeftInputs.nth(5).click();
  await topLeftInputs.nth(5).fill("Gメテオ");
  await expect(topLeftCard.getByRole("option", { name: "Gメテオレイザー" })).toHaveCount(0);

  await page.goto("/editor?game=mmsf3&version=red-joker");

  const redJokerCardEditor = page
    .locator("label", { hasText: "対戦構築カード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");
  await redJokerCardEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  const redJokerFirstCardInput = redJokerCardEditor.locator("input[placeholder='カード名']").first();
  await redJokerFirstCardInput.click();
  await redJokerFirstCardInput.fill("ウィング");
  await expect(redJokerCardEditor.getByRole("option", { name: "ウィングブレード" })).toHaveCount(0);
  await redJokerFirstCardInput.fill("ウィングブレード");
  await redJokerCardEditor.locator("input[type='number']").first().fill("1");

  await expect(page.getByText("ギガカード「ウィングブレード」はレッドジョーカーでは使用できません。")).toBeVisible();

  const redJokerBrotherEditor = page
    .locator("label", { hasText: "ブラザー情報" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");
  const redJokerTopLeftCard = redJokerBrotherEditor
    .getByText("左上", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");
  const redJokerTopLeftInputs = redJokerTopLeftCard.getByRole("combobox");

  await selectBrotherVersion(redJokerTopLeftCard, "レッド", "レッドジョーカー");
  await redJokerTopLeftInputs.nth(5).click();
  await redJokerTopLeftInputs.nth(5).fill("ウィング");
  await expect(redJokerTopLeftCard.getByRole("option", { name: "ウィングブレード" })).toHaveCount(0);
});

test("mmsf3 editor expands mega and giga limits from class-up abilities without changing the 30 card cap", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "mmsf-perfect-battle-organizer/editor-draft/v2/new/mmsf3/black-ace",
      JSON.stringify({
        game: "mmsf3",
        version: "black-ace",
        commonSections: {
          cards: [
            { id: "m1", name: "スペードマグネッツ", quantity: 1, notes: "", isRegular: false },
            { id: "m2", name: "ダイヤアイスバーン", quantity: 1, notes: "", isRegular: false },
            { id: "m3", name: "クラブストロング", quantity: 1, notes: "", isRegular: false },
            { id: "m4", name: "クイーンヴァルゴ", quantity: 1, notes: "", isRegular: false },
            { id: "m5", name: "ジャックコーヴァス", quantity: 1, notes: "", isRegular: false },
            { id: "m6", name: "オヒュカスクイーン", quantity: 1, notes: "", isRegular: false },
            { id: "g1", name: "ウィングブレード", quantity: 1, notes: "", isRegular: false },
            { id: "g2", name: "ダークネスホール", quantity: 1, notes: "", isRegular: false },
          ],
          abilities: [
            { id: "a1", name: "メガクラス+1 (440P)", quantity: 440, notes: "", isRegular: false },
            { id: "a2", name: "ギガクラス+1 (750P)", quantity: 750, notes: "", isRegular: false },
          ],
        },
      }),
    );
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  await expect(page.getByText("メガカードは合計", { exact: false })).toHaveCount(0);
  await expect(page.getByText("ギガカードはフォルダに", { exact: false })).toHaveCount(0);
  await expect(page.getByText("カード総数: 8 / 30")).toBeVisible();
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

test("mmsf3 editor syncs card sources when replacing a battle card in the same row", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const cardEditor = page
    .locator("label", { hasText: "対戦構築カード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");
  const cardSourceEditor = page
    .locator("label", { hasText: "カード入手方法" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await cardEditor.getByRole("button", { name: "行を追加", exact: true }).click();

  const firstCardInput = cardEditor.locator("input[placeholder='カード名']").first();
  await firstCardInput.fill("キャノン");
  await expect(cardSourceEditor.getByText("キャノン", { exact: true })).toBeVisible();

  await firstCardInput.fill("プラスキャノン");
  await expect(cardSourceEditor.getByText("プラスキャノン", { exact: true })).toBeVisible();
  await expect(cardSourceEditor.getByText("キャノン", { exact: true })).toHaveCount(0);
});

test("mmsf3 editor uses fixed brother roulette slots with the generator option set", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const versionSelect = page.locator("select").filter({ has: page.locator("option[value='red-joker']") }).first();
  await expect(versionSelect).toHaveValue("black-ace");
  await versionSelect.selectOption("red-joker");
  await expect(versionSelect).toHaveValue("red-joker");

  const brotherEditor = page
    .locator("label", { hasText: "ブラザー情報" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  for (const label of ["左上", "右上", "左中", "右中", "左下", "右下"]) {
    await expect(brotherEditor.getByText(label, { exact: true })).toBeVisible();
  }

  const topLeftCard = brotherEditor
    .getByText("左上", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");
  const topRightCard = brotherEditor
    .getByText("右上", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");

  const topLeftInputs = topLeftCard.getByRole("combobox");
  const topRightInputs = topRightCard.getByRole("combobox");

  await topLeftInputs.nth(1).click();
  await topLeftInputs.nth(1).fill("レッド");
  await brotherEditor.getByRole("option", { name: "レッドジョーカー" }).click();

  await topLeftInputs.nth(2).click();
  await topLeftInputs.nth(2).fill("リブラ");
  await brotherEditor.getByRole("option", { name: "リブラ" }).click();

  await topLeftInputs.nth(3).click();
  await topLeftInputs.nth(3).fill("ソード");
  await brotherEditor.getByRole("option", { name: "ソード" }).click();

  await topLeftInputs.nth(4).click();
  await topLeftInputs.nth(4).fill("ワイドウェーブ3");
  await brotherEditor.getByRole("option", { name: "ワイドウェーブ3,シャークカッター2,ブルーインク,アイスグレネード" }).click();

  await topLeftInputs.nth(5).click();
  await topLeftInputs.nth(5).fill("Gメテオ");
  await brotherEditor.getByRole("option", { name: "Gメテオレイザー" }).click();

  await topLeftInputs.nth(6).click();
  await topLeftInputs.nth(6).fill("アシッド");
  await brotherEditor.getByRole("option", { name: "アシッドエース", exact: true }).click();

  await expect(topLeftInputs.nth(0)).toHaveValue("ブラザー");
  await expect(topLeftInputs.nth(1)).toHaveValue("レッドジョーカー");
  await expect(topLeftInputs.nth(2)).toHaveValue("リブラ");
  await expect(topLeftInputs.nth(3)).toHaveValue("ソード");
  await expect(topLeftInputs.nth(5)).toHaveValue("Gメテオレイザー");
  await expect(topLeftInputs.nth(6)).toHaveValue("アシッドエース");
  await expect(topRightInputs.nth(0)).toHaveValue("ブラザー");
});

test("mmsf3 editor does not offer ブライ as a brother merge noise", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const brotherEditor = page
    .locator("label", { hasText: "ブラザー情報" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");
  const topLeftCard = brotherEditor
    .getByText("左上", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");
  const topLeftNoiseInput = topLeftCard.getByRole("combobox").nth(2);

  await topLeftNoiseInput.click();
  await topLeftNoiseInput.fill("ブライ");

  await expect(topLeftCard.getByRole("option", { name: "ブライ" })).toHaveCount(0);
});

test("mmsf3 editor keeps player rezon card and white card in the rockman section", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const rockmanSection = page
    .locator("select:has(option[value='ブライノイズ'])")
    .first()
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel')][1]");

  await expect(rockmanSection.getByText("レゾンカード", { exact: true })).toBeVisible();
  await expect(rockmanSection.getByText("ホワイトカード", { exact: true })).toBeVisible();

  const rezonInput = rockmanSection
    .getByText("レゾンカード", { exact: true })
    .locator("xpath=following::input[@role='combobox'][1]");
  const whiteInput = rockmanSection
    .getByText("ホワイトカード", { exact: true })
    .locator("xpath=following::input[@role='combobox'][1]");

  await rezonInput.click();
  await rezonInput.fill("ソード");
  await rockmanSection.getByRole("option", { name: "ソード" }).click();

  await whiteInput.click();
  await whiteInput.fill("ワイドウェーブ3");
  await rockmanSection.getByRole("option", { name: "ワイドウェーブ3,シャークカッター2,ブルーインク,アイスグレネード" }).click();

  await expect(rezonInput).toHaveValue("ソード");
  await expect(whiteInput).toHaveValue("ワイドウェーブ3,シャークカッター2,ブルーインク,アイスグレネード");
});

test("mmsf3 editor allows up to three SSS brother slots", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const brotherEditor = page
    .locator("label", { hasText: "ブラザー情報" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  for (const label of ["左上", "右上", "左中"]) {
    await expect(brotherEditor.getByText(label, { exact: true })).toBeVisible();
  }

  const topLeftCard = brotherEditor
    .getByText("左上", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");
  const topRightCard = brotherEditor
    .getByText("右上", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");
  const midLeftCard = brotherEditor
    .getByText("左中", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");
  const midRightCard = brotherEditor
    .getByText("右中", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");

  await selectBrotherSlotType(topLeftCard, "SSS");
  await selectBrotherSss(topLeftCard, "オヒュ", "Lv.4: オヒュカス");

  await selectBrotherSlotType(topRightCard, "SSS");
  await selectBrotherSss(topRightCard, "フォル", "Lv.32: フォルテ");

  await selectBrotherSlotType(midLeftCard, "SSS");
  await selectBrotherSss(midLeftCard, "Lv.2", "Lv.24: オメガ");

  await expect(topLeftCard.getByRole("combobox").nth(1)).toHaveValue("Lv.4: オヒュカス");
  await expect(topRightCard.getByRole("combobox").nth(1)).toHaveValue("Lv.32: フォルテ");
  await expect(midLeftCard.getByRole("combobox").nth(1)).toHaveValue("Lv.24: オメガ");

  await midRightCard.getByRole("combobox").nth(0).click();
  await midRightCard.getByRole("combobox").nth(0).fill("SSS");
  await expect(midRightCard.getByRole("option", { name: "SSS" })).toHaveCount(0);
});

test("mmsf3 editor disables brother roulette when bura noise is selected", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const brotherEditor = page
    .locator("label", { hasText: "ブラザー情報" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await page.locator("select:has(option[value='ブライノイズ'])").first().selectOption({ label: "ブライノイズ" });

  await expect(brotherEditor).toContainText("ブライノイズではブラザーは設定できませんが、SSSは設定できます。");
  await expect(brotherEditor.getByText("シークレットサテライトサーバー", { exact: true })).toBeVisible();
  await expect(brotherEditor.getByText("SSS 01", { exact: true })).toBeVisible();
  await expect(brotherEditor.getByText("左上", { exact: true })).toHaveCount(0);

  const firstSssInput = brotherEditor.getByRole("combobox").nth(0);
  await firstSssInput.click();
  await firstSssInput.fill("フォル");
  await brotherEditor.getByRole("option", { name: "Lv.32: フォルテ" }).click();
  await expect(firstSssInput).toHaveValue("Lv.32: フォルテ");
});

test("mmsf3 editor includes cost-based ability options", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const abilityEditor = page
    .locator("label", { hasText: "アビリティ" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]")
    .first();

  await expect(abilityEditor.getByRole("combobox").first()).toHaveValue("エースＰＧＭ/0");
  await abilityEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  await selectAbilityOption(abilityEditor, 1, "HP+50", "ＨＰ+50/120");

  await abilityEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  const secondAbilityInput = abilityEditor.getByRole("combobox").nth(2);
  await secondAbilityInput.click();
  await secondAbilityInput.fill("HP+50");

  await expect(abilityEditor.getByRole("option", { name: "ＨＰ+50/120" })).toBeVisible();
  await expect(abilityEditor.getByRole("option", { name: "ＨＰ+50/110" })).toBeVisible();
  await expect(abilityEditor.getByRole("option", { name: "ＨＰ+50/100" })).toBeVisible();
  await expect(abilityEditor.getByRole("option", { name: "エースＰＧＭ/0" })).toHaveCount(0);

  await secondAbilityInput.fill("メガクラス+1");
  await expect(abilityEditor.getByRole("option", { name: "メガクラス+1/440" })).toBeVisible();
});

test("mmsf3 editor syncs ability sources like battle cards", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const abilityEditor = page
    .locator("label", { hasText: "アビリティ" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]")
    .first();
  const abilitySourceEditor = page
    .locator("label", { hasText: "アビリティ入手方法" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await expect(abilityEditor.getByRole("combobox").first()).toHaveValue("エースＰＧＭ/0");
  await expect(abilitySourceEditor).not.toContainText("エースＰＧＭ/0");
  await abilityEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  await selectAbilityOption(abilityEditor, 1, "HP+50", "ＨＰ+50/120");

  await expect(abilitySourceEditor).toContainText("ＨＰ+50/120");
  await expect(abilitySourceEditor.getByRole("button", { name: "入手方法詳細" })).toBeVisible();
  await expect(abilitySourceEditor.getByRole("button", { name: "所持済み" })).toBeVisible();
  await abilitySourceEditor.getByRole("button", { name: "入手方法詳細" }).click();
  await expect(abilitySourceEditor).toContainText("ストーリー中にマグネッツからメールでもらう");
});

test("mmsf3 editor shows multiple source detail panels at the same time", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const abilityEditor = page
    .locator("label", { hasText: "アビリティ" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]")
    .first();
  const abilitySourceEditor = page
    .locator("label", { hasText: "アビリティ入手方法" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await abilityEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  await selectAbilityOption(abilityEditor, 1, "HP+50", "ＨＰ+50/120");
  await abilityEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  await selectAbilityOption(abilityEditor, 2, "HP+50", "ＨＰ+50/110");

  await abilitySourceEditor.getByRole("button", { name: "入手方法詳細" }).nth(0).click();
  await abilitySourceEditor.getByRole("button", { name: "入手方法詳細" }).nth(1).click();

  await expect(abilitySourceEditor.getByRole("button", { name: "閉じる" })).toHaveCount(2);
  await expect(abilitySourceEditor).toContainText("ストーリー中にマグネッツからメールでもらう");
  await expect(abilitySourceEditor).toContainText("デンパくんスクエア(キング・ルーツ:デンパくん2体)");
});

test("mmsf3 editor normalizes legacy ability labels into the new cost format", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "mmsf-perfect-battle-organizer/editor-draft/v2/new/mmsf3/black-ace",
      JSON.stringify({
        game: "mmsf3",
        version: "black-ace",
        commonSections: {
          abilities: [{ id: "legacy-ability", name: "HP+100", quantity: 1, notes: "", isRegular: false }],
        },
      }),
    );
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const abilityEditor = page
    .locator("label", { hasText: "アビリティ" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]")
    .first();

  await expect(abilityEditor.getByRole("combobox").nth(0)).toHaveValue("エースＰＧＭ/0");
  await expect(abilityEditor.getByRole("combobox").nth(1)).toHaveValue("ＨＰ+100/170");
  await expect(abilityEditor).not.toContainText("未対応のアビリティ項目です。");
});

test("mmsf3 editor validates ability point totals against the standard limit", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const abilityEditor = page
    .locator("label", { hasText: "アビリティ" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]")
    .first();

  for (let index = 0; index < 4; index += 1) {
    await abilityEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  }

  await selectAbilityOption(abilityEditor, 1, "HP+500", "ＨＰ+500/610");
  await selectAbilityOption(abilityEditor, 2, "HP+500", "ＨＰ+500/570");
  await selectAbilityOption(abilityEditor, 3, "ファーストオーラ", "ファーストオーラ/400");
  await selectAbilityOption(abilityEditor, 4, "メガクラス+1", "メガクラス+1/360");

  await expect(abilityEditor).toContainText("合計P 1940/1900");
  await expect(page.getByText("アビリティ消費Pは 1900 以内にしてください。")).toBeVisible();
});

test("mmsf3 editor lowers the ability point limit as brother slots become SSS", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const brotherEditor = page
    .locator("label", { hasText: "ブラザー情報" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");
  const abilityEditor = page
    .locator("label", { hasText: "アビリティ" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]")
    .first();

  const topLeftCard = brotherEditor
    .getByText("左上", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");
  const topRightCard = brotherEditor
    .getByText("右上", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");
  const midLeftCard = brotherEditor
    .getByText("左中", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-[24px]')][1]");

  await expect(abilityEditor).toContainText("合計P 0/1900");

  await selectBrotherSlotType(topLeftCard, "SSS");
  await selectBrotherSss(topLeftCard, "オヒュ", "Lv.4: オヒュカス");
  await expect(abilityEditor).toContainText("合計P 0/1760");

  await selectBrotherSlotType(topRightCard, "SSS");
  await selectBrotherSss(topRightCard, "フォル", "Lv.32: フォルテ");
  await expect(abilityEditor).toContainText("合計P 0/1620");

  await selectBrotherSlotType(midLeftCard, "SSS");
  await selectBrotherSss(midLeftCard, "オメガ", "Lv.24: オメガ");
  await expect(abilityEditor).toContainText("合計P 0/1480");
});

test("mmsf3 editor limits duplicate random abilities to 9 and non-random abilities to 1", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "mmsf-perfect-battle-organizer/editor-draft/v2/new/mmsf3/black-ace",
      JSON.stringify({
        game: "mmsf3",
        version: "black-ace",
        commonSections: {
          abilities: [
            { id: "a1", name: "HP+50 (120P)", quantity: 120, notes: "", isRegular: false },
            { id: "a2", name: "HP+50 (120P)", quantity: 120, notes: "", isRegular: false },
            { id: "a3", name: "HP+50 (120P)", quantity: 120, notes: "", isRegular: false },
            { id: "a4", name: "HP+50 (120P)", quantity: 120, notes: "", isRegular: false },
            { id: "a5", name: "HP+50 (120P)", quantity: 120, notes: "", isRegular: false },
            { id: "a6", name: "HP+50 (120P)", quantity: 120, notes: "", isRegular: false },
            { id: "a7", name: "HP+50 (120P)", quantity: 120, notes: "", isRegular: false },
            { id: "a8", name: "HP+50 (120P)", quantity: 120, notes: "", isRegular: false },
            { id: "a9", name: "HP+50 (120P)", quantity: 120, notes: "", isRegular: false },
            { id: "a10", name: "HP+50 (120P)", quantity: 120, notes: "", isRegular: false },
            { id: "b1", name: "HP+50 (100P)", quantity: 100, notes: "", isRegular: false },
            { id: "b2", name: "HP+50 (100P)", quantity: 100, notes: "", isRegular: false },
          ],
        },
      }),
    );
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  await expect(page.getByText("ＨＰ+50/120 は最大9個までです。")).toBeVisible();
  await expect(page.getByText("ＨＰ+50/100 は最大1個までです。")).toBeVisible();
});

test("mmsf3 editor lowers the ability point limit for bura noise", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  await page.locator("select:has(option[value='ブライノイズ'])").first().selectOption({ label: "ブライノイズ" });

  const abilityEditor = page
    .locator("label", { hasText: "アビリティ" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]")
    .first();

  await abilityEditor.getByRole("button", { name: "行を追加", exact: true }).click();
  await abilityEditor.getByRole("button", { name: "行を追加", exact: true }).click();

  await selectAbilityOption(abilityEditor, 1, "ファーストオーラ", "ファーストオーラ/600");
  await selectAbilityOption(abilityEditor, 2, "HP+500", "ＨＰ+500/350");

  await expect(abilityEditor).toContainText("合計P 950/900");
  await expect(page.getByText("アビリティ消費Pは 900 以内にしてください。")).toBeVisible();
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

test("mmsf3 editor evaluates noise hand bonus, filters duplicate cards, and updates export preview", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const noiseCardPanel = page
    .locator("label", { hasText: "ノイズドカード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await selectNoiseCard(noiseCardPanel, 0, "アンドロメダ", "★: アンドロメダN(マックスバスター)");

  await noiseCardPanel.getByRole("combobox").nth(1).click();
  await expect(noiseCardPanel.getByRole("option", { name: "★: ラ・ムーN(Sインビジブル)" })).toHaveCount(0);
  await expect(noiseCardPanel.getByRole("option", { name: "★: アンドロメダN(マックスバスター)" })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await selectNoiseCard(noiseCardPanel, 1, "ジェミニ", "♠A: ジェミニ・スパークN(サンダーG.A+)");
  await selectNoiseCard(noiseCardPanel, 2, "イナドラン", "♠2: イナドランN(サンダー+10)");
  await selectNoiseCard(noiseCardPanel, 3, "ムーン", "♠3: ムーン・ディザスターN(HP+300)");
  await selectNoiseCard(noiseCardPanel, 4, "ゴロボルタ", "♠4: ゴロボルタN(SPクラウド)");

  await expect(noiseCardPanel).toContainText("ストレートフラッシュ");
  await expect(noiseCardPanel).toContainText("メガクラス+1");
  await expect(noiseCardPanel).toContainText("ギガクラス+1");
  await expect(noiseCardPanel).toContainText("マックスバスター");

  const brotherSystemSection = page
    .locator("h3", { hasText: "Brother & System" })
    .locator("xpath=ancestor::section[1]");
  await expect(brotherSystemSection).toContainText("ノイズハンド: ストレートフラッシュ");
  await expect(brotherSystemSection).toContainText("効果: メガクラス+1");
  await expect(brotherSystemSection).toContainText("★: アンドロメダN(マックスバスター) / マックスバスター");
});

test("mmsf3 editor applies straight sequence rules for noise hands", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const noiseCardPanel = page
    .locator("label", { hasText: "ノイズドカード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await selectNoiseCard(noiseCardPanel, 0, "ピラニッシュ", "♦10: ピラニッシュN(HP+250)");
  await selectNoiseCard(noiseCardPanel, 1, "ステルス", "♠J: ステルスN(HP+150)");
  await selectNoiseCard(noiseCardPanel, 2, "パサラン", "♣Q: パサランN(Sリカバリー30)");
  await selectNoiseCard(noiseCardPanel, 3, "ペガサス", "♦K: ペガサス・マジックN(アクアG.A+)");
  await selectNoiseCard(noiseCardPanel, 4, "レオ", "♥A: レオ・キングダムN(ファイアG.A+)");

  await expect(noiseCardPanel).toContainText("ストレート");
  await expect(noiseCardPanel).toContainText("HP+300");

  await selectNoiseCard(noiseCardPanel, 0, "モアイアン", "♥2: モアイアンN(ブレイク+10)");
  await expect(noiseCardPanel).toContainText("役なし");
  await expect(noiseCardPanel).toContainText("ノイズハンドボーナスは発生しません。");
});

test("mmsf3 editor prefers the highest noise hand when multiple hands overlap", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  const noiseCardPanel = page
    .locator("label", { hasText: "ノイズドカード" })
    .locator("xpath=ancestor::div[contains(@class, 'glass-panel-soft')][1]");

  await selectNoiseCard(noiseCardPanel, 0, "レオ", "♥A: レオ・キングダムN(ファイアG.A+)");
  await selectNoiseCard(noiseCardPanel, 1, "プルミン", "♦A: プルミンN(アクア+10)");
  await selectNoiseCard(noiseCardPanel, 2, "ジェミニ", "♠A: ジェミニ・スパークN(サンダーG.A+)");
  await selectNoiseCard(noiseCardPanel, 3, "カブホーン", "♣A: カブホーンN(HP+250)");
  await selectNoiseCard(noiseCardPanel, 4, "アンドロメダ", "★: アンドロメダN(マックスバスター)");

  await expect(noiseCardPanel).toContainText("ファイブカード");
  await expect(noiseCardPanel).toContainText("ステータスガード");
  await expect(noiseCardPanel).not.toContainText("フォーカード");
});

test("mmsf3 editor reports invalid imported noise card states", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "mmsf-perfect-battle-organizer/editor-draft/v2/new/mmsf3/black-ace",
      JSON.stringify({
        game: "mmsf3",
        version: "black-ace",
        gameSpecificSections: {
          mmsf3: {
            noiseCardIds: ["60", "61", "60", "", ""],
          },
        },
      }),
    );
  });

  await page.goto("/editor?game=mmsf3&version=black-ace");

  await expect(page.getByText("同じノイズドカードは重複して選択できません。").first()).toBeVisible();
  await expect(page.getByText("流星マークのカードは1枚までです。").first()).toBeVisible();
});
