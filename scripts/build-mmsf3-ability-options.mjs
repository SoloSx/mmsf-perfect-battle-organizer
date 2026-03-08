import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_PATH = path.join("scripts", "raw", "guide-pages", "__rockman__ryusei__ryusei3__item.htm.html");
const OUTPUT_PATH = path.join("data", "mmsf3-ability-options.json");

function toHalfWidth(value) {
  return value
    .replace(/\u3000/g, " ")
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0));
}

function cleanCell(raw) {
  return toHalfWidth(
    raw
      .replace(/<BR\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " "),
  )
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line !== ">")
    .join("\n");
}

function parseCost(value) {
  return Number.parseInt(toHalfWidth(value), 10);
}

async function main() {
  const source = await readFile(SOURCE_PATH);
  const html = new TextDecoder("shift_jis").decode(source);
  const start = html.indexOf('<A name="ability-wave">');
  const end = html.indexOf('<A name="key-item">');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Failed to locate ability section in MMSF3 item page.");
  }

  const section = html.slice(start, end);
  const rows = [...section.matchAll(/<TR>([\s\S]*?)<\/TR>/g)].map((match) => match[1]);
  const entries = [];
  let currentName = "";
  let currentEffect = "";

  for (const row of rows.slice(1)) {
    const cells = [...row.matchAll(/<T[DH][^>]*>([\s\S]*?)<\/T[DH]>/g)].map((match) => cleanCell(match[1]));

    if (cells.length === 0 || cells.every((cell) => !cell)) {
      continue;
    }

    if (cells.length === 4) {
      currentName = cells[0];
      currentEffect = cells[3];
      entries.push({
        id: `mmsf3-ability-${String(entries.length + 1).padStart(3, "0")}`,
        name: currentName,
        cost: parseCost(cells[1]),
        label: `${currentName} (${parseCost(cells[1])}P)`,
        sources: cells[2].split("\n").filter(Boolean),
        effect: currentEffect,
      });
      continue;
    }

    if (cells.length === 2 && currentName) {
      const cost = parseCost(cells[0]);
      entries.push({
        id: `mmsf3-ability-${String(entries.length + 1).padStart(3, "0")}`,
        name: currentName,
        cost,
        label: `${currentName} (${cost}P)`,
        sources: cells[1].split("\n").filter(Boolean),
        effect: currentEffect,
      });
    }
  }

  await writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(
      {
        sourcePath: SOURCE_PATH,
        entries,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`Wrote ${entries.length} MMSF3 ability options to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
