import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const projectRoot = new URL("..", import.meta.url).pathname;
const rawDir = join(projectRoot, "scripts", "raw", "guide-pages");
const manifestFile = join(projectRoot, "data", "asset-manifest.json");
const outFile = join(projectRoot, "data", "card-asset-aliases.json");

const SECTION_ORDER = {
  mmsf1: ["standard", "mega", "giga", "bokutai", "folder"],
  mmsf2: ["standard", "mega", "giga", "blank", "gentei", "folder"],
  mmsf3: ["standard", "mega", "giga", "illegal", "satellite_server", "gentei", "nfb", "folder"],
};

const CARD_PAGE_FILES = {
  mmsf1: join(rawDir, "__rockman__ryusei__ryusei1__card.htm.html"),
  mmsf2: join(rawDir, "__rockman__ryusei__ryusei2__card.htm.html"),
  mmsf3: join(rawDir, "__rockman__ryusei__ryusei3__card.htm.html"),
};

const VERSION_BY_COLOR = {
  mmsf1: {
    lightblue: "pegasus",
    coral: "leo",
    lightgreen: "dragon",
  },
  mmsf2: {
    silver: "berserker",
    lightgreen: "shinobi",
    lightcoral: "dinosaur",
  },
  mmsf3: {
    silver: "black-ace",
    lightcoral: "red-joker",
  },
};

const VERSION_BY_ASSET_SUFFIX = {
  mmsf1: {
    p: "pegasus",
    l: "leo",
    d: "dragon",
  },
  mmsf2: {
    b: "berserker",
    s: "shinobi",
    d: "dinosaur",
  },
  mmsf3: {
    a: "black-ace",
    j: "red-joker",
  },
};

function readGuideHtml(file) {
  const buffer = readFileSync(file);
  const asciiHead = buffer.toString("ascii", 0, Math.min(buffer.length, 512)).toLowerCase();

  if (asciiHead.includes("charset=utf-8")) {
    return buffer.toString("utf8");
  }

  return execFileSync("iconv", ["-f", "CP932", "-t", "UTF-8//IGNORE", file], { encoding: "utf8" });
}

function cleanHtmlText(value) {
  return value
    .replace(/<BR\s*\/?>/gi, " / ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSectionHtml(html, sections, section) {
  const start = html.search(new RegExp(`<A name="${section}">`, "i"));
  if (start === -1) {
    return "";
  }

  let end = html.length;
  for (const candidate of sections) {
    if (candidate === section) {
      continue;
    }

    const index = html.slice(start + 1).search(new RegExp(`<A name="${candidate}">`, "i"));
    if (index !== -1) {
      end = Math.min(end, start + 1 + index);
    }
  }

  return html.slice(start, end);
}

function extractCardsFromSection(game, section, html) {
  return [...html.matchAll(/<TR[^>]*>([\s\S]*?)<\/TR>/gi)]
    .map((rowMatch) => {
      const row = rowMatch[0];
      const cells = [...row.matchAll(/<T[DH]([^>]*)>([\s\S]*?)<\/T[DH]>/gi)].map((cellMatch) => ({
        attrs: cellMatch[1] ?? "",
        value: cleanHtmlText(cellMatch[2] ?? ""),
      }));

      if (cells.length < 2 || !/^\d+$/.test(cells[0].value)) {
        return null;
      }

      const bgColor =
        [...cells]
          .map((cell) => cell.attrs.match(/bgcolor="([^"]+)"/i)?.[1]?.toLowerCase() ?? "")
          .find(Boolean) || "";

      return {
        game,
        section,
        number: Number(cells[0].value),
        name: cells[1].value,
        version: VERSION_BY_COLOR[game]?.[bgColor] ?? null,
      };
    })
    .filter(Boolean);
}

function parseAssetMetadata(entry) {
  const file = basename(entry.localPath);

  if (entry.game === "mmsf1") {
    let match = file.match(/^s(\d{3})_/i);
    if (match) {
      return { section: "standard", number: Number(match[1]), version: null };
    }

    match = file.match(/^e(\d{2})_/i);
    if (match) {
      return { section: "bokutai", number: Number(match[1]), version: null };
    }

    match = file.match(/^m(\d{2})([pld]?)/i);
    if (match) {
      return {
        section: "mega",
        number: Number(match[1]),
        version: VERSION_BY_ASSET_SUFFIX.mmsf1[match[2].toLowerCase()] ?? null,
      };
    }

    match = file.match(/^g(\d)([pld]?)/i);
    if (match) {
      return {
        section: "giga",
        number: Number(match[1]),
        version: VERSION_BY_ASSET_SUFFIX.mmsf1[match[2].toLowerCase()] ?? null,
      };
    }
  }

  if (entry.game === "mmsf2") {
    let match = file.match(/^S(\d{3})/);
    if (match) {
      return { section: "standard", number: Number(match[1]), version: null };
    }

    match = file.match(/^M(\d{2})/);
    if (match) {
      return { section: "mega", number: Number(match[1]), version: null };
    }

    match = file.match(/^G([bsd])(\d)/i);
    if (match) {
      return {
        section: "giga",
        number: Number(match[2]),
        version: VERSION_BY_ASSET_SUFFIX.mmsf2[match[1].toLowerCase()] ?? null,
      };
    }
  }

  if (entry.game === "mmsf3") {
    let match = entry.localPath.match(/\/Standard\/(\d{3})_/i);
    if (match) {
      return { section: "standard", number: Number(match[1]), version: null };
    }

    match = entry.localPath.match(/\/Mega\/m(\d{2})_/i);
    if (match) {
      return { section: "mega", number: Number(match[1]), version: null };
    }

    match = entry.localPath.match(/\/Giga\/g(\d)([aj])/i);
    if (match) {
      return {
        section: "giga",
        number: Number(match[1]),
        version: VERSION_BY_ASSET_SUFFIX.mmsf3[match[2].toLowerCase()] ?? null,
      };
    }
  }

  return null;
}

function getAssetScore(entry) {
  const file = basename(entry.localPath);
  let score = 0;

  if (/\.png$/i.test(file)) {
    score += 3;
  } else if (/\.gif$/i.test(file)) {
    score += 2;
  } else {
    score += 1;
  }

  if (!/(EN|ES|FR|IT|DE|US)\.(png|gif|jpg|jpeg)$/i.test(file)) {
    score += 4;
  }

  return score;
}

function buildAssetIndex(manifestEntries) {
  const index = new Map();

  for (const entry of manifestEntries) {
    const metadata = parseAssetMetadata(entry);
    if (!metadata) {
      continue;
    }

    const key = `${entry.game}:${metadata.section}:${metadata.number}:${metadata.version ?? "*"}`;
    const current = index.get(key);
    if (!current || getAssetScore(entry) > getAssetScore(current)) {
      index.set(key, entry);
    }
  }

  return index;
}

const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
const assetIndex = buildAssetIndex(manifest.entries);
const aliases = [];

for (const [game, file] of Object.entries(CARD_PAGE_FILES)) {
  const html = readGuideHtml(file);
  for (const section of SECTION_ORDER[game]) {
    if (section === "folder") {
      continue;
    }

    const sectionHtml = extractSectionHtml(html, SECTION_ORDER[game], section);
    for (const card of extractCardsFromSection(game, section, sectionHtml)) {
      const exactKey = `${game}:${section}:${card.number}:${card.version ?? "*"}`;
      const wildcardKey = `${game}:${section}:${card.number}:*`;
      const asset = assetIndex.get(exactKey) ?? assetIndex.get(wildcardKey);

      if (!asset) {
        continue;
      }

      aliases.push({
        game,
        version: card.version,
        name: card.name,
        assetLocalPath: asset.localPath,
      });
    }
  }
}

writeFileSync(outFile, JSON.stringify({ entries: aliases }, null, 2));
console.log(`card-asset-aliases.json written with ${aliases.length} entries`);
