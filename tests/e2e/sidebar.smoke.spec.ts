import { expect, test } from "@playwright/test";

test("sidebar and primary navigation smoke", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside");

  await expect(
    sidebar.getByRole("link", { name: "はじめに", exact: true }),
  ).toBeVisible();
  await expect(
    sidebar.getByRole("link", { name: "構築一覧", exact: true }),
  ).toBeVisible();
  await expect(
    sidebar.getByRole("link", { name: "戦法テンプレート", exact: true }),
  ).toBeVisible();

  await sidebar.getByRole("link", { name: "構築一覧", exact: true }).click();
  await expect(page).toHaveURL(/\/builds$/);

  await sidebar
    .getByRole("link", { name: "戦法テンプレート", exact: true })
    .click();
  await expect(page).toHaveURL(/\/templates$/);

  await page.goto("/");
  await page.getByRole("button", { name: "サイドバーを閉じる" }).click();

  await expect(
    page.getByRole("button", { name: "流星のロックマン1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "流星のロックマン2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "流星のロックマン3", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "流星のロックマン2", exact: true })
    .click();

  const collapsedVersions = page.locator("#mmsf2-collapsed-versions");
  await expect(
    collapsedVersions.getByRole("link", { name: "ベルセルク", exact: true }),
  ).toBeVisible();
  await expect(
    collapsedVersions.getByRole("link", { name: "シノビ", exact: true }),
  ).toBeVisible();
  await expect(
    collapsedVersions.getByRole("link", { name: "ダイナソー", exact: true }),
  ).toBeVisible();

  await collapsedVersions
    .getByRole("link", { name: "シノビ", exact: true })
    .click();
  await expect(page).toHaveURL(/\/editor\?game=mmsf2&version=shinobi$/);
  await expect(
    page.getByRole("button", { name: "PNG 出力", exact: true }),
  ).toBeVisible();
});

test("editor draft survives reload before saving", async ({ page }) => {
  await page.goto("/editor?game=mmsf2&version=shinobi");

  const titleField = page.getByPlaceholder("構築名");
  await titleField.fill("リロード復元テスト");

  await page.reload();

  await expect(page.getByPlaceholder("構築名")).toHaveValue("リロード復元テスト");
  await expect(page.getByText("未保存の編集内容を復元しました。")).toBeVisible();
});
