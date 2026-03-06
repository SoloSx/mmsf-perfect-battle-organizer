import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const projectRoot = new URL("..", import.meta.url).pathname;
const publicDir = join(projectRoot, "public", "assets", "cards");
const outFile = join(projectRoot, "data", "asset-manifest.json");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function normalizeAlias(value) {
  return value.toLowerCase().replace(/\.(png|gif|jpg|jpeg)$/i, "").replace(/[_\s-]+/g, "");
}

const entries = walk(publicDir)
  .filter((file) => /\.(png|gif|jpg|jpeg)$/i.test(file) && statSync(file).size > 0)
  .map((file) => {
    const relativeFile = relative(publicDir, file);
    const [gameFolder = "", , fileName = ""] = relativeFile.split("/");
    const game = gameFolder.toLowerCase() === "sf1" ? "mmsf1" : gameFolder.toLowerCase() === "sf2" ? "mmsf2" : "mmsf3";

    return {
      game,
      name: fileName.replace(/\.(png|gif|jpg|jpeg)$/i, ""),
      localPath: `/assets/cards/${relativeFile}`,
      remotePath: null,
      aliases: [normalizeAlias(fileName)],
      attribution: "Sprites INC",
    };
  });

writeFileSync(outFile, JSON.stringify({ entries }, null, 2));
console.log(`asset-manifest.json written with ${entries.length} local entries`);
