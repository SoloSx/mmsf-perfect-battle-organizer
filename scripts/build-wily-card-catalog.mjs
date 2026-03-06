import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = new URL("..", import.meta.url).pathname;
const rawDir = join(projectRoot, "scripts", "raw", "wily");
const aliasFile = join(projectRoot, "data", "card-asset-aliases.json");
const outFile = join(projectRoot, "data", "wily-card-catalog.json");

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

function readWilyHtml(file) {
  const buffer = readFileSync(file);
  const asciiHead = buffer.toString("ascii", 0, Math.min(buffer.length, 512)).toLowerCase();

  if (asciiHead.includes("charset=utf-8")) {
    return buffer.toString("utf8");
  }

  return execFileSync("iconv", ["-f", "CP932", "-t", "UTF-8//IGNORE", file], { encoding: "utf8" });
}

function cleanHtmlText(value) {
  return value
    .replace(/<BR\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
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

function isMeaningfulDetail(value) {
  return value && value !== "-" && value !== "－－－" && value !== "　";
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
        cells.map((cell) => cell.attrs.match(/bgcolor="([^"]+)"/i)?.[1]?.toLowerCase() ?? "").find(Boolean) || "";

      return {
        game,
        section,
        number: Number(cells[0].value),
        version: VERSION_BY_COLOR[game]?.[bgColor] ?? null,
        name: cells[1].value,
        details: cells.slice(2).map((cell) => cell.value).filter(isMeaningfulDetail),
      };
    })
    .filter(Boolean);
}

function normalizeToken(value) {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, "").replace(/[・\-_＋+★☆()（）/]/g, "");
}

const aliases = JSON.parse(readFileSync(aliasFile, "utf8")).entries;
const catalogEntries = [];

for (const [game, file] of Object.entries(CARD_PAGE_FILES)) {
  const html = readWilyHtml(file);

  for (const section of SECTION_ORDER[game]) {
    if (section === "folder") {
      continue;
    }

    const sectionHtml = extractSectionHtml(html, SECTION_ORDER[game], section);
    for (const card of extractCardsFromSection(game, section, sectionHtml)) {
      const asset =
        aliases.find(
          (entry) =>
            entry.game === game &&
            entry.version === card.version &&
            normalizeToken(entry.name) === normalizeToken(card.name),
        ) ??
        aliases.find(
          (entry) => entry.game === game && entry.version === null && normalizeToken(entry.name) === normalizeToken(card.name),
        ) ??
        null;

      catalogEntries.push({
        ...card,
        assetLocalPath: asset?.assetLocalPath ?? null,
      });
    }
  }
}

writeFileSync(outFile, JSON.stringify({ entries: catalogEntries }, null, 2));
console.log(`wily-card-catalog.json written with ${catalogEntries.length} entries`);
