import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const projectRoot = new URL("..", import.meta.url).pathname;
const rawDir = join(projectRoot, "scripts", "raw", "guide-pages");

const pages = [
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei1/card.htm" },
  { url: "https://chipcom.org/ryusei/docs/%E3%83%A9%E3%82%A4%E3%83%96%E3%83%A9%E3%83%AA/", fileName: "__chipcom__ryusei__docs__library__mmsf1.html" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei1/item.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei1/wave.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei1/brother-band.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei2/card.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei2/item.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei2/wave.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei2/brother-band.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei3/card.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei3/item.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei3/wave.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei3/brother-band.htm" },
  { url: "http://wily.xrea.jp/rockman/ryusei/ryusei3/noise-change.htm" },
];

mkdirSync(rawDir, { recursive: true });

for (const page of pages) {
  const urlObj = new URL(page.url);
  const file = join(rawDir, page.fileName ?? `${urlObj.pathname.replaceAll("/", "__")}.html`);
  mkdirSync(dirname(file), { recursive: true });
  const body = execFileSync("curl", ["-L", "-sS", "--max-time", "30", page.url], { encoding: null });
  writeFileSync(file, body);
  console.log(`saved ${file}`);
}
