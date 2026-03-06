import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const sourceRoots = ["app", "components", "hooks", "lib"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
      continue;
    }

    if (extensions.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

function countMatches(source, pattern) {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath) || filePath;
}

function collectSignals(filePath) {
  const source = readFileSync(filePath, "utf8");
  const signals = {
    client: source.includes('"use client"') ? 1 : 0,
    useEffect: countMatches(source, /\buseEffect\b/g),
    useMemo: countMatches(source, /\buseMemo\b/g),
    useTransition: countMatches(source, /\buseTransition\b/g),
    useDeferredValue: countMatches(source, /\buseDeferredValue\b/g),
    localStorage: countMatches(source, /\blocalStorage\b/g),
    suspense: countMatches(source, /\bSuspense\b/g),
    promiseAll: countMatches(source, /\bPromise\.all\b/g),
    dynamicImport: countMatches(source, /\bdynamic\(/g),
    htmlToImage: countMatches(source, /html-to-image/g),
  };

  const score =
    signals.client * 3 +
    signals.useEffect * 2 +
    signals.useMemo +
    signals.localStorage * 3 +
    signals.suspense * 2 +
    signals.promiseAll * 2 +
    signals.dynamicImport * 2 +
    signals.htmlToImage * 2;

  return { source, signals, score };
}

const files = sourceRoots.flatMap((root) => walk(path.join(repoRoot, root)));
const analyses = files.map((filePath) => ({
  filePath,
  repoPath: toRepoPath(filePath),
  ...collectSignals(filePath),
}));

const totals = analyses.reduce(
  (accumulator, item) => {
    accumulator.client += item.signals.client;
    accumulator.useEffect += item.signals.useEffect;
    accumulator.useMemo += item.signals.useMemo;
    accumulator.useTransition += item.signals.useTransition;
    accumulator.useDeferredValue += item.signals.useDeferredValue;
    accumulator.localStorage += item.signals.localStorage;
    accumulator.suspense += item.signals.suspense;
    accumulator.promiseAll += item.signals.promiseAll;
    accumulator.dynamicImport += item.signals.dynamicImport;
    accumulator.htmlToImage += item.signals.htmlToImage;
    return accumulator;
  },
  {
    client: 0,
    useEffect: 0,
    useMemo: 0,
    useTransition: 0,
    useDeferredValue: 0,
    localStorage: 0,
    suspense: 0,
    promiseAll: 0,
    dynamicImport: 0,
    htmlToImage: 0,
  },
);

const hotspots = analyses
  .filter((item) => item.score > 0)
  .sort((left, right) => right.score - left.score)
  .slice(0, 8);

const manualHotspots = [
  {
    file: "components/build-editor-page.tsx",
    focus: "Large client component. Review rerender pressure, derived state, and opportunities to split or defer work.",
    rules: ["rerender-*", "bundle-dynamic-imports", "rendering-content-visibility"],
  },
  {
    file: "hooks/use-app-data.tsx",
    focus: "localStorage persistence and context updates. Review schema versioning, serialization size, and unnecessary rerenders.",
    rules: ["client-localstorage-schema", "rerender-derived-state", "rerender-functional-setstate"],
  },
  {
    file: "components/cosmic-background.tsx",
    focus: "Animation cost on the client. Review canvas redraw frequency and avoid unnecessary work on every frame.",
    rules: ["rendering-*", "js-cache-function-results", "rerender-use-ref-transient-values"],
  },
  {
    file: "components/export-scene.tsx",
    focus: "Client-only image export. Review heavy rendering paths, serialized props, and lazy loading opportunities.",
    rules: ["bundle-dynamic-imports", "server-serialization", "rendering-conditional-render"],
  },
];

console.log("React Best Practices Review Report");
console.log("==================================");
console.log("");
console.log("Sources");
console.log("- Blog: https://vercel.com/blog/introducing-react-best-practices");
console.log("- Skill: /Users/xsolo/.codex/skills/vercel-react-best-practices");
console.log("- Project guide: docs/react-best-practices-review.md");
console.log("");
console.log("Baseline");
console.log(`- Source files scanned: ${files.length}`);
console.log(`- Client files: ${totals.client}`);
console.log(`- useEffect occurrences: ${totals.useEffect}`);
console.log(`- useMemo occurrences: ${totals.useMemo}`);
console.log(`- useTransition occurrences: ${totals.useTransition}`);
console.log(`- useDeferredValue occurrences: ${totals.useDeferredValue}`);
console.log(`- localStorage occurrences: ${totals.localStorage}`);
console.log(`- Suspense occurrences: ${totals.suspense}`);
console.log(`- Promise.all occurrences: ${totals.promiseAll}`);
console.log(`- dynamic() occurrences: ${totals.dynamicImport}`);
console.log(`- html-to-image imports: ${totals.htmlToImage}`);
console.log("");
console.log("Priority order");
console.log("1. async-*");
console.log("2. bundle-*");
console.log("3. server-*");
console.log("4. client-*");
console.log("5. rerender-*");
console.log("6. rendering-*");
console.log("7. js-*");
console.log("8. advanced-*");
console.log("");
console.log("Auto-detected hotspots");

for (const item of hotspots) {
  const reasons = [];
  if (item.signals.client) reasons.push("client");
  if (item.signals.useEffect) reasons.push(`useEffect:${item.signals.useEffect}`);
  if (item.signals.useMemo) reasons.push(`useMemo:${item.signals.useMemo}`);
  if (item.signals.localStorage) reasons.push(`localStorage:${item.signals.localStorage}`);
  if (item.signals.suspense) reasons.push(`Suspense:${item.signals.suspense}`);
  if (item.signals.promiseAll) reasons.push(`Promise.all:${item.signals.promiseAll}`);
  if (item.signals.dynamicImport) reasons.push(`dynamic:${item.signals.dynamicImport}`);
  if (item.signals.htmlToImage) reasons.push(`html-to-image:${item.signals.htmlToImage}`);
  console.log(`- ${item.repoPath} (${reasons.join(", ")})`);
}

console.log("");
console.log("Project-specific review targets");
for (const item of manualHotspots) {
  console.log(`- ${item.file}`);
  console.log(`  Focus: ${item.focus}`);
  console.log(`  Rules: ${item.rules.join(", ")}`);
}

console.log("");
console.log("Suggested Codex prompt");
console.log(
  '- "Review this change using $vercel-react-best-practices. Prioritize async waterfalls, bundle size, client localStorage schema, rerender pressure, and rendering cost. Findings first with file references and applicable rule ids."',
);
