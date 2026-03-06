import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const projectRoot = new URL("..", import.meta.url).pathname;
const dataDir = join(projectRoot, "data");
const publicDir = join(projectRoot, "public", "assets", "cards");

const sources = [
  { game: "mmsf1", url: "https://www.sprites-inc.co.uk/sprite.php?local=/Starforce/SF1/Cards/" },
  { game: "mmsf2", url: "https://www.sprites-inc.co.uk/sprite.php?local=/Starforce/SF2/Cards/" },
  { game: "mmsf3", url: "https://www.sprites-inc.co.uk/sprite.php?local=/Starforce/SF3/Cards/" },
];

function runCurl(args) {
  return execFileSync("curl", ["-k", "-L", "-sS", "--max-time", "30", ...args], {
    encoding: "utf8",
  });
}

function normalizeAlias(value) {
  return value.toLowerCase().replace(/\.(png|gif|jpg|jpeg)$/i, "").replace(/[_\s-]+/g, "");
}

mkdirSync(publicDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

const limit = Number(process.env.LIMIT || "0");
const manifest = [];
const manifestFile = join(dataDir, "asset-manifest.json");
const failureFile = join(dataDir, "asset-download-failures.json");
const failures = [];

function writeManifest() {
  writeFileSync(manifestFile, JSON.stringify({ entries: manifest }, null, 2));
}

function writeFailures() {
  writeFileSync(failureFile, JSON.stringify({ failures }, null, 2));
}

function hasCompleteFile(path) {
  return existsSync(path) && statSync(path).size > 0;
}

function buildRemoteUrl(remotePath) {
  const url = new URL("https://www.sprites-inc.co.uk");
  url.pathname = remotePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
    .replace(/%2F/g, "/");
  return url.toString();
}

function downloadAsset(remotePath, localFile) {
  execFileSync(
    "curl",
    ["-f", "-k", "-L", "-sS", "--retry", "3", "--retry-delay", "1", "--max-time", "30", buildRemoteUrl(remotePath), "-o", localFile],
    { stdio: "inherit" },
  );
}

writeFailures();

let processed = 0;

for (const source of sources) {
  const html = runCurl([source.url]);
  const matches = Array.from(new Set([...html.matchAll(/src="(\/files\/Starforce\/[^"]+\/Cards\/[^"]+)"/g)].map((match) => match[1])));
  const selected = limit > 0 ? matches.slice(0, limit) : matches;

  for (const remotePath of selected) {
    const relative = remotePath.replace("/files/Starforce/", "");
    const localFile = join(publicDir, relative.replaceAll(" ", "_"));
    mkdirSync(dirname(localFile), { recursive: true });

    try {
      if (!hasCompleteFile(localFile)) {
        downloadAsset(remotePath, localFile);
      }
    } catch (error) {
      failures.push({
        game: source.game,
        remotePath,
        localFile,
        error: error instanceof Error ? error.message : String(error),
      });
      writeFailures();
      continue;
    }

    const fileName = relative.split("/").pop() ?? "";
    manifest.push({
      game: source.game,
      name: fileName.replace(/\.(png|gif|jpg|jpeg)$/i, ""),
      localPath: `/assets/cards/${relative.replaceAll(" ", "_")}`,
      remotePath,
      aliases: [normalizeAlias(fileName)],
      attribution: "Sprites INC",
    });
    processed += 1;
    if (processed % 50 === 0) {
      console.log(`processed ${processed} assets`);
    }
    writeManifest();
  }
}

writeManifest();
writeFailures();
console.log(`asset-manifest.json written with ${manifest.length} entries`);
console.log(`asset-download-failures.json written with ${failures.length} failures`);
