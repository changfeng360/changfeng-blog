import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const CDN_BASE = "https://cdn.jsdelivr.net/npm/emoji-datasource@16.0.0";
const SHEET_URL = `${CDN_BASE}/img/apple/sheets/32.png`;
const EMOJI_JSON_URL = `${CDN_BASE}/emoji.json`;
const targetDir = join(process.cwd(), "public", "emoji");

function resolveLocalPackageRoot() {
  try {
    return dirname(require.resolve("emoji-datasource/package.json"));
  } catch {
    const fallback = join(process.cwd(), "node_modules", "emoji-datasource");
    return existsSync(fallback) ? fallback : "";
  }
}

async function writeUrlToFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(filePath, buffer);
}

function addKey(imageMap, key, sheetX, sheetY) {
  if (!key || sheetX == null || sheetY == null) {
    return;
  }
  const normalized = String(key).toLowerCase();
  if (!imageMap[normalized]) {
    imageMap[normalized] = { x: sheetX, y: sheetY };
  }
  const withoutFe0f = normalized.replace(/-fe0f$/g, "");
  if (!imageMap[withoutFe0f]) {
    imageMap[withoutFe0f] = { x: sheetX, y: sheetY };
  }
}

function addEntry(imageMap, entry) {
  if (!entry || entry.has_img_apple === false) {
    return;
  }
  addKey(imageMap, entry.unified, entry.sheet_x, entry.sheet_y);
  if (entry.non_qualified) {
    addKey(imageMap, entry.non_qualified, entry.sheet_x, entry.sheet_y);
  }
  if (entry.skin_variations) {
    for (const variation of Object.values(entry.skin_variations)) {
      addEntry(imageMap, variation);
    }
  }
}

function buildImageMap(emojiData) {
  const imageMap = {};
  let maxSheetX = 0;
  let maxSheetY = 0;

  function trackExtent(entry) {
    if (!entry || entry.sheet_x == null || entry.sheet_y == null) {
      return;
    }
    maxSheetX = Math.max(maxSheetX, entry.sheet_x);
    maxSheetY = Math.max(maxSheetY, entry.sheet_y);
    if (entry.skin_variations) {
      for (const variation of Object.values(entry.skin_variations)) {
        trackExtent(variation);
      }
    }
  }

  for (const entry of emojiData) {
    trackExtent(entry);
    addEntry(imageMap, entry);
  }

  const sheetSize = 32;
  imageMap.__meta = {
    size: sheetSize,
    width: (maxSheetX + 1) * (sheetSize + 2),
    height: (maxSheetY + 1) * (sheetSize + 2),
  };
  return imageMap;
}

async function prepare() {
  const packageRoot = resolveLocalPackageRoot();
  const localSheet = packageRoot
    ? join(packageRoot, "img", "apple", "sheets", "32.png")
    : "";
  const localEmojiJson = packageRoot ? join(packageRoot, "emoji.json") : "";

  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });

  let sheetPath = join(targetDir, "apple-sheet.png");
  let emojiData = [];

  try {
    if (localSheet && existsSync(localSheet)) {
      const localBuffer = readFileSync(localSheet);
      writeFileSync(sheetPath, localBuffer);
      emojiData = JSON.parse(readFileSync(localEmojiJson, "utf8"));
    } else {
      await writeUrlToFile(SHEET_URL, sheetPath);
      const emojiJsonPath = join(targetDir, "emoji.json");
      await writeUrlToFile(EMOJI_JSON_URL, emojiJsonPath);
      emojiData = JSON.parse(readFileSync(emojiJsonPath, "utf8"));
      rmSync(emojiJsonPath, { force: true });
    }

    const imageMap = buildImageMap(emojiData);
    writeFileSync(
      join(targetDir, "emoji-map.json"),
      JSON.stringify(imageMap),
      "utf8",
    );
    console.log(
      `[apple-emoji] copied Apple emoji sheet (${Math.round(
        statSync(sheetPath).size / 1024,
      )} KB) and emoji map to public/emoji.`,
    );
  } catch (error) {
    rmSync(targetDir, { recursive: true, force: true });
    console.warn(
      `[apple-emoji] could not prepare Apple emoji assets (${error.message}), using system emoji.`,
    );
  }
}

prepare();
