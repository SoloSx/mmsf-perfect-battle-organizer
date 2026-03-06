# File Inventory

最終確認: 2026-03-07

このリポジトリは大きく次の3層です。

- アプリ本体: 75個の主要ファイル
- カード画像アセット: `public/assets/cards/` 配下に 961 ファイル
- ローカル生成物や作業用: `.local-tools/`, `.next/`, `out/`, `node_modules/`, `test-results/` など

## 1. アプリ本体ファイル

### ルートと設定

- `.gitignore`: 生成物、依存、ローカル作業ファイルの除外設定
- `.npmrc`: `engine-strict=true` を有効化して Node バージョンを厳格化
- `.nvmrc`: 推奨 Node バージョンを `24.14.0` に固定
- `README.md`: プロジェクト概要と review baseline の入口
- `package.json`: Next.js アプリ本体の依存関係と各種スクリプト定義
- `pnpm-lock.yaml`: pnpm の lockfile
- `next.config.ts`: `output: "export"` と画像最適化オフを設定
- `tsconfig.json`: TypeScript のコンパイラ設定と `@/*` エイリアス定義
- `eslint.config.mjs`: Next/TypeScript 向け ESLint 設定
- `postcss.config.mjs`: Tailwind CSS v4 用 PostCSS 設定
- `playwright.config.ts`: E2E テスト実行設定。`scripts/e2e-serve.sh` で静的配信を起動

### App Router

- `app/layout.tsx`: ルートレイアウト。フォント設定と `Providers` 注入
- `app/providers.tsx`: `AppDataProvider` を全画面に適用するクライアント境界
- `app/page.tsx`: ホーム画面へのエントリ
- `app/editor/page.tsx`: 構築エディタ画面へのエントリ。`Suspense` 境界あり
- `app/builds/page.tsx`: 構築一覧画面へのエントリ
- `app/templates/page.tsx`: 戦法テンプレート管理画面へのエントリ
- `app/globals.css`: 全体テーマ、ガラス風 UI、ボタン/入力系共通クラス
- `app/favicon.ico`: サイトのファビコン

### Components

- `components/app-shell.tsx`: 背景、サイドバー、コンテンツ幅制御をまとめた共通レイアウト
- `components/home-page.tsx`: トップ画面本体。作品/版選択と保存件数の表示
- `components/sidebar-nav.tsx`: 左サイドバー。ページ遷移と作品/版のツリー表示
- `components/build-editor-page.tsx`: 構築エディタ本体。保存、複製、PNG出力、ゲーム別入力フォームを全部持つ大型コンポーネント
- `components/build-library-page.tsx`: 保存済み構築の検索、絞り込み、複製、削除
- `components/strategy-templates-page.tsx`: 戦法テンプレートの作成、編集、JSON入出力
- `components/searchable-suggestion-input.tsx`: 候補付き入力 UI。キーボード操作対応
- `components/export-scene.tsx`: PNG 出力用の構築プレビュー画面
- `components/cosmic-background.tsx`: 背景用の canvas アニメーション

### Hooks

- `hooks/use-app-data.tsx`: localStorage 永続化、構築/テンプレート CRUD、Context 提供

### Lib

- `lib/types.ts`: アプリ全体の主要型定義
- `lib/utils.ts`: `cn`, `createId`, 日付整形、文字正規化、重複除去などの共通関数
- `lib/rules.ts`: 作品/版ラベル、版ごとの制約、アクセント色情報
- `lib/seed-data.ts`: 初期候補データと初期戦法テンプレート
- `lib/assets.ts`: カード名から画像アセットを引く検索ロジック
- `lib/guide-card-catalog.ts`: 攻略ページ由来のカード一覧と入手元候補の検索
- `lib/mmsf3-card-master.ts`: 流星3カードの表示順、区分、画像パス lookup
- `lib/mmsf3-roulette-options.ts`: 流星3のホワイトカードセット、メガ/ギガ候補定義
- `lib/mmsf3-battle-rules.ts`: 流星3フォルダ枚数制約の検証

### Data

- `data/asset-manifest.json`: 画像アセットの総覧。ゲーム、名前、ローカルパス、元URLなどを保持
- `data/asset-download-failures.json`: 画像取得スクリプトの失敗ログ
- `data/card-asset-aliases.json`: 日本語カード名と実画像ファイルの対応表
- `data/mmsf3-card-master.json`: 流星3カードの表示順、区分、画像パスのマスタ
- `data/guide-card-catalog.json`: 攻略ページから抽出したカード一覧と入手元データ
- `data/guide-page-index.json`: `scripts/raw/guide-pages/` HTML のタイトル・見出しインデックス

### Docs

- `docs/react-best-practices-review.md`: React/Next.js review ルールと手順
- `docs/file-inventory.md`: この棚卸しメモ

### Scripts

- `scripts/check-auto.sh`: `pnpm install --frozen-lockfile`, `lint`, `build` をまとめて実行
- `scripts/e2e-serve.sh`: 静的ビルド後に `serve` で `out/` を配信
- `scripts/with-local-node.sh`: ローカル Node バイナリを用意してコマンドを実行
- `scripts/ingest-card-assets.mjs`: 外部サイトからカード画像を取得し `asset-manifest.json` を生成
- `scripts/rebuild-asset-manifest.mjs`: `public/assets/cards/` からローカル manifest を再構築
- `scripts/build-card-asset-aliases.mjs`: 攻略ページ HTML と画像名からカード名エイリアス表を生成
- `scripts/build-guide-card-catalog.mjs`: 攻略ページ HTML からカードリスト/入手元カタログを生成
- `scripts/snapshot-guide-pages.mjs`: 攻略ページの元 HTML を `scripts/raw/guide-pages/` に保存
- `scripts/build-guide-page-index.mjs`: 保存済み攻略ページ HTML の見出し索引を作成
- `scripts/review-react-best-practices.mjs`: リポジトリ独自の React review レポートを生成

### Raw HTML snapshots

- `scripts/raw/guide-pages/__rockman__ryusei__ryusei1__brother-band.htm.html`: 流星1 ブラザーバンド元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei1__card.htm.html`: 流星1 カード一覧元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei1__item.htm.html`: 流星1 アイテム元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei1__wave.htm.html`: 流星1 ウェーブロード元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei2__brother-band.htm.html`: 流星2 ブラザーバンド元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei2__card.htm.html`: 流星2 カード一覧元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei2__item.htm.html`: 流星2 アイテム元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei2__wave.htm.html`: 流星2 ウェーブロード元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei3__brother-band.htm.html`: 流星3 ブラザーバンド元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei3__card.htm.html`: 流星3 カード一覧元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei3__item.htm.html`: 流星3 アイテム元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei3__noise-change.htm.html`: 流星3 ノイズチェンジ元ページ
- `scripts/raw/guide-pages/__rockman__ryusei__ryusei3__wave.htm.html`: 流星3 ウェーブロード元ページ

### Public

- `public/file.svg`: 既定の静的 SVG アイコン
- `public/globe.svg`: 既定の静的 SVG アイコン
- `public/next.svg`: 既定の Next.js SVG
- `public/vercel.svg`: 既定の Vercel SVG
- `public/window.svg`: 既定の静的 SVG アイコン

### Tests

- `tests/e2e/sidebar.smoke.spec.ts`: サイドバーと主要導線のスモークテスト
- `tests/e2e/mmsf3-editor.spec.ts`: 流星3エディタのホワイトカードとフォルダ検証テスト

## 2. カード画像アセット

`public/assets/cards/` は命名変更の対象としては最後に回すべきです。アプリからは `data/asset-manifest.json`, `data/card-asset-aliases.json`, `data/mmsf3-card-master.json` 経由で参照されています。

件数:

- `public/assets/cards/SF1/Cards/`: 238 ファイル
- `public/assets/cards/SF2/Cards/`: 280 ファイル
- `public/assets/cards/SF3/Cards/`: 443 ファイル

主な命名パターン:

- `SF1/Cards/s001_Cannon.png` のような `s###_Name` 系: スタンダードカード
- `SF1/Cards/m01_OxFire.png` のような `m##_Name` 系: メガカード
- `SF1/Cards/g1p_PegasusMagicGX.png` のような `g*` 系: ギガ/派生カード
- `SF2/Cards/S007AirSpreader1.gif` のような英字+連番系: 流星2の旧来命名
- `SF3/Cards/Standard/001_cannon.png`: 流星3スタンダード
- `SF3/Cards/Mega/m01_spademagnets.png`: 流星3メガ
- `SF3/Cards/SecretStandard/xxx_*.png`: 流星3シークレットスタンダード
- `SF3/Cards/SecretMega/xxx_*.PNG`: 流星3シークレットメガ
- `SF3/Cards/SecretGiga/xxx_*.PNG`: 流星3シークレットギガ

役割:

- UI 上のカード画像表示
- PNG 出力時のカードタイル描画
- カード名から画像を引く lookup の実体

## 3. ローカル作業用・生成物

これらは「命名を整える対象」ではなく、基本は無視でよいファイルです。

### ローカル補助

- `AGENTS.md`: Codex 用のローカル指示書
- `next-env.d.ts`: Next.js が生成する型補助ファイル
- `.local-tools/package.json`: ローカル Playwright 実行用の最小 package
- `.local-tools/package-lock.json`: 上記 lockfile
- `.local-tools/playwright.config.ts`: ローカル補助用 Playwright 設定
- `.local-tools/mmsf-e2e.spec.ts`: ローカル補助用の E2E スモークテスト
- `.local-tools/node-v24.14.0-darwin-arm64.tar.xz`: ローカル Node 配布物
- `.local-tools/node-v24.14.0-darwin-arm64/README.md`: Node 配布物の README
- `.local-tools/node-v24.14.0-darwin-arm64/LICENSE`: Node 配布物のライセンス
- `.local-tools/node-v24.14.0-darwin-arm64/CHANGELOG.md`: Node 配布物の changelog
- `.local-tools/node_modules/.package-lock.json`: `.local-tools` 依存の内部 lockfile
- `.local-tools/test-results/.last-run.json`: `.local-tools` テスト結果メモ

### 生成ディレクトリ

- `.next/`: Next.js のビルド生成物
- `out/`: 静的 export の出力先
- `node_modules/`: 依存パッケージ
- `test-results/`: Playwright 実行結果

## 4. 命名見直しの候補

用途と名前のズレが比較的大きいのは次です。

- `hooks/use-app-data.tsx`: hook だけでなく Context provider も持つので `app-data-context.tsx` 系に寄せる余地あり
- `components/build-library-page.tsx`: ルート名 `/builds` と合わせるなら `builds-page.tsx` の方が直感的
- `lib/rules.ts`: かなり広い責務なので `version-rules.ts` や `game-rules.ts` の方が意味が明確
- `lib/assets.ts`: カード画像 lookup 専用なので `card-assets.ts` の方が具体的
- `lib/seed-data.ts`: 初期候補集なので `master-seed-data.ts` または `default-app-data.ts` 系に寄せる余地あり

次に作業するなら、まずは `components/`, `lib/`, `hooks/` の命名規則を決めてから一括リネームするのが安全です。
