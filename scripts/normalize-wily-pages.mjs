import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = new URL("..", import.meta.url).pathname;
const rawDir = join(projectRoot, "scripts", "raw", "wily");
const outFile = join(projectRoot, "data", "wily-guide-index.json");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function readWilyHtml(file) {
  const buffer = readFileSync(file);
  const asciiHead = buffer.toString("ascii", 0, Math.min(buffer.length, 512)).toLowerCase();

  if (asciiHead.includes("charset=utf-8")) {
    return buffer.toString("utf8");
  }

  return execFileSync("iconv", ["-f", "CP932", "-t", "UTF-8//IGNORE", file], { encoding: "utf8" });
}

const pages = walk(rawDir)
  .filter((file) => file.endsWith(".html"))
  .map((file) => {
    const html = readWilyHtml(file);
    const title = html.match(/<TITLE>([^<]+)<\/TITLE>/i)?.[1] ?? "";
    const headings = [...html.matchAll(/<H[123][^>]*>(.*?)<\/H[123]>/gi)].map((match) =>
      match[1].replace(/<[^>]+>/g, "").trim(),
    );
    return {
      file: file.replace(`${projectRoot}/`, ""),
      title,
      headings,
    };
  });

writeFileSync(outFile, JSON.stringify({ pages }, null, 2));
console.log(`wily-guide-index.json written with ${pages.length} pages`);
