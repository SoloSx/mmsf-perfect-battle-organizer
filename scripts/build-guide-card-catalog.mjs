import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = new URL("..", import.meta.url).pathname;
const rawDir = join(projectRoot, "scripts", "raw", "guide-pages");
const aliasFile = join(projectRoot, "data", "card-asset-aliases.json");
const outFile = join(projectRoot, "data", "guide-card-catalog.json");

const SECTION_ORDER = {
  mmsf1: ["standard", "mega", "giga", "bokutai", "folder"],
  mmsf2: ["standard", "mega", "giga", "star", "blank", "gentei", "folder"],
  mmsf3: ["standard", "mega", "giga", "illegal", "satellite_server", "gentei", "nfb", "folder"],
};

const CARD_PAGE_FILES = {
  mmsf1: join(rawDir, "__rockman__ryusei__ryusei1__card.htm.html"),
  mmsf2: join(rawDir, "__rockman__ryusei__ryusei2__card.htm.html"),
  mmsf3: join(rawDir, "__rockman__ryusei__ryusei3__card.htm.html"),
};

const MODERN_CARD_PAGE_FILES = {
  mmsf1: join(rawDir, "__chipcom__ryusei__docs__library__mmsf1.html"),
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

function stripHeadingAnchorSuffix(value) {
  return value.replace(/#$/u, "").trim();
}

function extractTableRows(html) {
  return [...html.matchAll(/<TR[^>]*>([\s\S]*?)<\/TR>|<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((rowMatch) => {
    const row = rowMatch[1] ?? rowMatch[2] ?? "";
    return [...row.matchAll(/<T[DH]([^>]*)>([\s\S]*?)<\/T[DH]>|<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/g)].map((cellMatch) => ({
      attrs: cellMatch[1] ?? cellMatch[3] ?? "",
      value: cleanHtmlText(cellMatch[2] ?? cellMatch[4] ?? ""),
    }));
  });
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
  return extractTableRows(html)
    .map((cells) => {
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

function extractModernMmsf2Cards(game, html) {
  const articleHtml = html.match(/<article class="markdown book-article">([\s\S]*?)<\/article>/i)?.[1] ?? html;
  const tokens = [...articleHtml.matchAll(/<h[23][^>]*>[\s\S]*?<\/h[23]>|<table>[\s\S]*?<\/table>/gi)].map((match) => match[0]);
  const entries = [];

  let currentH2 = "";
  let currentH3 = "";

  const gigaVersionByHeading = {
    ベルセルク: "berserker",
    シノビ: "shinobi",
    ダイナソー: "dinosaur",
  };

  for (const token of tokens) {
    if (/^<h2/i.test(token)) {
      currentH2 = stripHeadingAnchorSuffix(cleanHtmlText(token));
      currentH3 = "";
      continue;
    }

    if (/^<h3/i.test(token)) {
      currentH3 = stripHeadingAnchorSuffix(cleanHtmlText(token));
      continue;
    }

    const rows = extractTableRows(token).map((row) => row.map((cell) => cell.value));
    if (rows.length < 2) {
      continue;
    }

    const header = rows[0];
    const sourceIndex = header.findIndex((cell) => /^入手/.test(cell));
    if (sourceIndex === -1) {
      continue;
    }

    const section =
      currentH2 === "スタンダード" ? "standard"
      : currentH2 === "メガクラス" ? "mega"
      : currentH2 === "ギガクラス" ? "giga"
      : currentH2 === "スターカード" ? "star"
      : currentH2 === "ブランクカード" ? "blank"
      : null;

    if (!section) {
      continue;
    }

    for (const row of rows.slice(1)) {
      if (row.length < 2 || !row[1] || row[1] === "カード名") {
        continue;
      }

      const rawNumber = row[0] ?? "";
      const rawName = row[1] ?? "";
      const numberMatch = rawNumber.match(/^(?:[A-Z]-)?(\d+)$/i);
      const details = (row[sourceIndex] ?? "")
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((value) => value !== "***");

      entries.push({
        game,
        section,
        number: numberMatch ? Number(numberMatch[1]) : 0,
        version: section === "giga" ? (gigaVersionByHeading[currentH3] ?? null) : null,
        name: section === "blank" ? `${rawNumber} ${rawName}` : rawName,
        details: section === "blank" && details.length === 0 ? ["ウェーブコマンドカード"] : details,
      });
    }
  }

  return entries;
}

function extractModernMmsf1Cards(game, html) {
  const articleHtml = html.match(/<article class="markdown book-article">([\s\S]*?)<\/article>/i)?.[1] ?? html;
  const tokens = [...articleHtml.matchAll(/<h[23][^>]*>[\s\S]*?<\/h[23]>|<table>[\s\S]*?<\/table>/gi)].map((match) => match[0]);
  const entries = [];

  let currentH2 = "";
  let currentH3 = "";

  const megaVersionByPrefix = {
    P: "pegasus",
    L: "leo",
    D: "dragon",
  };

  const gigaVersionByHeading = {
    レオ: "leo",
    ペガサス: "pegasus",
    ドラゴン: "dragon",
    不問: null,
  };

  for (const token of tokens) {
    if (/^<h2/i.test(token)) {
      currentH2 = stripHeadingAnchorSuffix(cleanHtmlText(token));
      currentH3 = "";
      continue;
    }

    if (/^<h3/i.test(token)) {
      currentH3 = stripHeadingAnchorSuffix(cleanHtmlText(token));
      continue;
    }

    const rows = extractTableRows(token).map((row) => row.map((cell) => cell.value));
    if (rows.length < 2) {
      continue;
    }

    const header = rows[0];
    const sourceIndex = header.findIndex((cell) => /^入手/.test(cell));
    if (sourceIndex === -1) {
      continue;
    }

    const section =
      currentH2 === "スタンダード" ? "standard"
      : currentH2 === "メガ" ? "mega"
      : currentH2 === "ギガ" ? "giga"
      : null;

    if (!section) {
      continue;
    }

    for (const row of rows.slice(1)) {
      if (row.length < 2 || !row[1] || row[1] === "カード名") {
        continue;
      }

      const rawNumber = (row[0] ?? "").trim();
      const rawName = (row[1] ?? "").trim();
      let number = 0;
      let version = null;

      if (section === "mega") {
        const numberMatch = rawNumber.match(/^([PLD])?(\d+)$/i);
        if (!numberMatch) {
          continue;
        }

        const [, rawPrefix, rawNumberValue] = numberMatch;
        number = Number(rawNumberValue);
        version = rawPrefix ? (megaVersionByPrefix[rawPrefix.toUpperCase()] ?? null) : null;
      } else {
        const numberMatch = rawNumber.match(/^(\d+)$/);
        if (!numberMatch) {
          continue;
        }

        number = Number(numberMatch[1]);
        version = section === "giga" ? (gigaVersionByHeading[currentH3] ?? null) : null;
      }

      const details = (row[sourceIndex] ?? "")
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((value) => value !== "***");

      entries.push({
        game,
        section,
        number,
        version,
        name: rawName,
        details,
      });
    }
  }

  return entries;
}

function normalizeIllegalHeader(value) {
  return value.replace(/\n+/g, " / ").trim();
}

function extractIllegalSourceDescriptions(html) {
  const legendTableMatch = html.match(/<TABLE border="1">[\s\S]*?<TH>区分け<\/TH>[\s\S]*?<\/TABLE>/i);

  if (!legendTableMatch) {
    return {};
  }

  const rows = [...legendTableMatch[0].matchAll(/<TR[^>]*>([\s\S]*?)<\/TR>/gi)].map((rowMatch) =>
    [...rowMatch[0].matchAll(/<T[DH]([^>]*)>([\s\S]*?)<\/T[DH]>/gi)].map((cellMatch) => ({
      attrs: cellMatch[1] ?? "",
      value: cleanHtmlText(cellMatch[2] ?? ""),
    })),
  );

  const headerRowIndex = rows.findIndex((cells) => cells.length >= 2 && cells[0]?.value === "区分け" && cells[1]?.value === "説明");

  if (headerRowIndex === -1) {
    return {};
  }

  return Object.fromEntries(
    rows
      .slice(headerRowIndex + 1)
      .map((cells) => {
        if (cells.length < 2) {
          return null;
        }

        const label = normalizeIllegalHeader(cells[0].value);
        const description = cells[1].value;

        if (!label || !description) {
          return null;
        }

        return [label, description];
      })
      .filter(Boolean),
  );
}

function extractIllegalCardsFromSection(game, section, html) {
  const rows = [...html.matchAll(/<TR[^>]*>([\s\S]*?)<\/TR>/gi)].map((rowMatch) =>
    [...rowMatch[0].matchAll(/<T[DH]([^>]*)>([\s\S]*?)<\/T[DH]>/gi)].map((cellMatch) => ({
      attrs: cellMatch[1] ?? "",
      value: cleanHtmlText(cellMatch[2] ?? ""),
    })),
  );

  const headerRowIndex = rows.findIndex(
    (cells) => cells.length >= 3 && cells[0]?.value === "No." && cells[1]?.value === "名前",
  );

  if (headerRowIndex === -1) {
    return [];
  }

  const headerLabels = rows[headerRowIndex].slice(2).map((cell) => normalizeIllegalHeader(cell.value));

  return rows
    .slice(headerRowIndex + 1)
    .map((cells, index) => {
      if (cells.length < 2) {
        return null;
      }

      const no = cells[0].value;
      const name = cells[1].value;

      if (!name || (no && !/^(?:-|\d+)$/.test(no))) {
        return null;
      }

      return {
        game,
        section,
        number: /^\d+$/.test(no) ? Number(no) : index + 1,
        version: null,
        name,
        details: cells
          .slice(2, 2 + headerLabels.length)
          .flatMap((cell, cellIndex) => (cell.value.includes("○") ? [headerLabels[cellIndex]] : [])),
      };
    })
    .filter(Boolean);
}

function splitMegaRankDetails(value) {
  const sections = {
    normal: [],
    v2: [],
    v3: [],
  };
  let current = null;

  for (const line of value.split("\n").map((item) => item.trim()).filter(Boolean)) {
    if (line === "ノーマル") {
      current = "normal";
      continue;
    }

    if (line === "Ｖ２") {
      current = "v2";
      continue;
    }

    if (line.startsWith("Ｖ３")) {
      current = "v3";
      continue;
    }

    if (current) {
      sections[current].push(line);
    }
  }

  return sections;
}

function extractMmsf3MegaCardsFromSection(game, section, html) {
  const rows = [...html.matchAll(/<TR[^>]*>([\s\S]*?)<\/TR>/gi)].map((rowMatch) =>
    [...rowMatch[0].matchAll(/<T[DH]([^>]*)>([\s\S]*?)<\/T[DH]>/gi)].map((cellMatch) => ({
      attrs: cellMatch[1] ?? "",
      value: cleanHtmlText(cellMatch[2] ?? ""),
    })),
  );

  const headerRowIndex = rows.findIndex(
    (cells) => cells.length >= 3 && cells[0]?.value === "No." && cells[1]?.value === "名前" && cells[2]?.value === "入手方法",
  );

  if (headerRowIndex === -1) {
    return [];
  }

  const entries = [];

  for (let index = headerRowIndex + 1; index < rows.length; index += 1) {
    const cells = rows[index];

    if (cells.length < 2 || !/^\d+$/.test(cells[0].value) || !cells[1].value) {
      continue;
    }

    const rowspan = Number(cells[2]?.attrs.match(/rowspan="?(\d+)"/i)?.[1] ?? 1);

    if (cells[2] && rowspan > 1) {
      const groupedRows = rows.slice(index, index + rowspan);
      const rankDetails = splitMegaRankDetails(cells[2].value);
      const detailsByOffset = [rankDetails.normal, rankDetails.v2, rankDetails.v3];

      groupedRows.forEach((groupedCells, groupedIndex) => {
        if (groupedCells.length < 2 || !/^\d+$/.test(groupedCells[0].value) || !groupedCells[1].value) {
          return;
        }

        entries.push({
          game,
          section,
          number: Number(groupedCells[0].value),
          version: null,
          name: groupedCells[1].value,
          details: detailsByOffset[groupedIndex] ?? [],
        });
      });

      index += rowspan - 1;
      continue;
    }

    entries.push({
      game,
      section,
      number: Number(cells[0].value),
      version: null,
      name: cells[1].value,
      details: cells.slice(2).map((cell) => cell.value).filter(isMeaningfulDetail),
    });
  }

  return entries;
}

function upsertCatalogEntry(entries, nextEntry) {
  const index = entries.findIndex(
    (entry) => entry.game === nextEntry.game && entry.section === nextEntry.section && entry.name === nextEntry.name,
  );

  if (index === -1) {
    entries.push(nextEntry);
    return;
  }

  entries[index] = {
    ...entries[index],
    ...nextEntry,
  };
}

function findCatalogEntry(entries, game, name) {
  return entries.find((entry) => entry.game === game && entry.name === name) ?? null;
}

function applyMmsf2SourceOverrides(entries) {
  const renameMmsf2Entry = (number, from, to) => {
    const match = entries.find(
      (entry) => entry.game === "mmsf2" && entry.section === "star" && entry.number === number && entry.name === from,
    );

    if (match) {
      match.name = to;
    }
  };

  renameMmsf2Entry(42, "シンクロフック2★2", "シンクロフック2★3");
  renameMmsf2Entry(110, "デスサイズ3★3", "デスサイズ3★2");
  renameMmsf2Entry(116, "オロロンハット2★3", "オロロンハット2★2");
  renameMmsf2Entry(201, "ピラニアキッス3", "ピラニアキッス3★3");
  renameMmsf2Entry(281, "パープルカーペット★3", "パープルカーペット★2");
}

function applyMmsf1SourceOverrides(entries) {
  const renameEntry = (from, to) => {
    const matchedEntries = entries.filter((entry) => entry.game === "mmsf1" && entry.name === from);
    for (const entry of matchedEntries) {
      entry.name = to;
    }
  };

  const andromeda = entries.find((entry) => entry.game === "mmsf1" && entry.name === "アンドロメダ");
  if (andromeda) {
    andromeda.assetLocalPath = "/assets/cards/SF1/Cards/Andromeda.png";
  }

  renameEntry("プラスマガン2", "プラズマガン2");
  renameEntry("ボルテックアイ1", "ボルティックアイ1");
  renameEntry("ボルテックアイ2", "ボルティックアイ2");
  renameEntry("ボルテックアイ3", "ボルティックアイ3");
  renameEntry("グラビディステージ", "グラビティステージ");
}

function applyMmsf3SourceOverrides(entries) {
  const acidAceV3 = findCatalogEntry(entries, "mmsf3", "アシッドエースＶ３");
  const acidAceV2 = findCatalogEntry(entries, "mmsf3", "アシッドエースＶ２");

  if (acidAceV2 && acidAceV3 && acidAceV2.details.length === 0) {
    acidAceV2.details = [...acidAceV3.details];
  }

  const libraBalance1 = findCatalogEntry(entries, "mmsf3", "リブラバランス１");
  if (libraBalance1) {
    upsertCatalogEntry(entries, {
      ...libraBalance1,
      name: "リブラバランス",
    });
  }

  const painHellFlame = findCatalogEntry(entries, "mmsf3", "ペインヘルフレイム");
  if (painHellFlame) {
    upsertCatalogEntry(entries, {
      ...painHellFlame,
      name: "ペインフレイム",
    });
  }

  upsertCatalogEntry(entries, {
    game: "mmsf3",
    section: "gentei",
    number: 1,
    version: null,
    name: "アシッドイリーガル",
    details: ["次世代ワールドホビーフェア'09 winterで配信"],
    assetLocalPath: null,
  });

  upsertCatalogEntry(entries, {
    game: "mmsf3",
    section: "gentei",
    number: 2,
    version: null,
    name: "メテオオブクリムゾン",
    details: ["次世代ワールドホビーフェア'09 summerで配信"],
    assetLocalPath: null,
  });

  for (const name of ["ペガサスマジックGX", "レオキングダムGX", "ドラゴンスカイGX"]) {
    upsertCatalogEntry(entries, {
      game: "mmsf3",
      section: "gentei",
      number: 0,
      version: null,
      name,
      details: ["配信"],
      assetLocalPath: null,
    });
  }
}

function normalizeToken(value) {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, "").replace(/[・\-_＋+★☆()（）/]/g, "");
}

const aliases = JSON.parse(readFileSync(aliasFile, "utf8")).entries;
const catalogEntries = [];
const sourceDescriptionsByGame = {};

for (const [game, file] of Object.entries(CARD_PAGE_FILES)) {
  const html = readGuideHtml(file);

  if (game === "mmsf1") {
    const modernHtml = readGuideHtml(MODERN_CARD_PAGE_FILES.mmsf1);
    const extractedCards = extractModernMmsf1Cards(game, modernHtml);

    for (const card of extractedCards) {
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

  if (game === "mmsf2" && html.includes('class="markdown book-article"')) {
    const extractedCards = extractModernMmsf2Cards(game, html);

    for (const card of extractedCards) {
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

    continue;
  }

  for (const section of SECTION_ORDER[game]) {
    if (section === "folder") {
      continue;
    }

    if (game === "mmsf1" && section !== "bokutai") {
      continue;
    }

    const sectionHtml = extractSectionHtml(html, SECTION_ORDER[game], section);
    if (game === "mmsf3" && section === "illegal") {
      sourceDescriptionsByGame[game] = extractIllegalSourceDescriptions(sectionHtml);
    }

    const extractedCards =
      game === "mmsf3" && section === "illegal"
        ? extractIllegalCardsFromSection(game, section, sectionHtml)
        : game === "mmsf3" && section === "mega"
          ? extractMmsf3MegaCardsFromSection(game, section, sectionHtml)
        : extractCardsFromSection(game, section, sectionHtml);

    for (const card of extractedCards) {
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

applyMmsf1SourceOverrides(catalogEntries);
applyMmsf2SourceOverrides(catalogEntries);
applyMmsf3SourceOverrides(catalogEntries);

writeFileSync(outFile, JSON.stringify({ entries: catalogEntries, sourceDescriptionsByGame }, null, 2));
console.log(`guide-card-catalog.json written with ${catalogEntries.length} entries`);
