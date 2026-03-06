import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const projectRoot = new URL("..", import.meta.url).pathname;
const rawDir = join(projectRoot, "scripts", "raw", "wily");

const pages = [
  "http://wily.xrea.jp/rockman/ryusei/ryusei1/card.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei1/item.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei1/wave.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei1/brother-band.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei2/card.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei2/item.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei2/wave.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei2/brother-band.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei3/card.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei3/item.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei3/wave.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei3/brother-band.htm",
  "http://wily.xrea.jp/rockman/ryusei/ryusei3/noise-change.htm",
];

mkdirSync(rawDir, { recursive: true });

for (const url of pages) {
  const urlObj = new URL(url);
  const file = join(rawDir, `${urlObj.pathname.replaceAll("/", "__")}.html`);
  mkdirSync(dirname(file), { recursive: true });
  const body = execFileSync("curl", ["-L", "-sS", "--max-time", "30", url], { encoding: null });
  writeFileSync(file, body);
  console.log(`saved ${file}`);
}
