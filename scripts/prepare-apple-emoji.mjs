import { createRequire } from "node:module";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

let packageRoot = "";
try {
  packageRoot = dirname(
    require.resolve("emoji-datasource/package.json"),
  );
} catch {
  const fallback = join(process.cwd(), "node_modules", "emoji-datasource");
  if (existsSync(fallback)) {
    packageRoot = fallback;
  }
}

if (!packageRoot) {
  console.warn(
    "[apple-emoji] emoji-datasource not installed, using system emoji.",
  );
  process.exit(0);
}

const sourceSheet = join(packageRoot, "img", "apple", "sheets", "32.png");
const targetDir = join(process.cwd(), "public", "emoji");
const emojiJsonPath = join(packageRoot, "emoji.json");

if (!existsSync(sourceSheet)) {
  console.warn(
    "[apple-emoji] package is missing img/apple/sheets/32.png, using system emoji.",
  );
  process.exit(0);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(sourceSheet, join(targetDir, "apple-sheet.png"));

const imageMap = {};
let maxSheetX = 0;
let maxSheetY = 0;

function addKey(key, sheetX, sheetY) {
  if (!key || sheetX == null || sheetY == null) {
    return;
  }
  const normalized = String(key).toLowerCase();
  if (!imageMap[normalized]) {
    imageMap[normalized] = { x: sheetX, y: sheetY };
    maxSheetX = Math.max(maxSheetX, sheetX);
    maxSheetY = Math.max(maxSheetY, sheetY);
  }
  const withoutFe0f = normalized.replace(/-fe0f$/g, "");
  if (!imageMap[withoutFe0f]) {
    imageMap[withoutFe0f] = { x: sheetX, y: sheetY };
  }
}

function addEntry(entry) {
  if (!entry || entry.has_img_apple === false) {
    return;
  }
  addKey(entry.unified, entry.sheet_x, entry.sheet_y);
  if (entry.non_qualified) {
    addKey(entry.non_qualified, entry.sheet_x, entry.sheet_y);
  }
  if (entry.skin_variations) {
    for (const variation of Object.values(entry.skin_variations)) {
      addEntry(variation);
    }
  }
}

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

if (existsSync(emojiJsonPath)) {
  const emojiData = JSON.parse(readFileSync(emojiJsonPath, "utf8"));
  for (const entry of emojiData) {
    trackExtent(entry);
    addEntry(entry);
  }
  const sheetSize = 32;
  imageMap.__meta = {
    size: sheetSize,
    width: (maxSheetX + 1) * (sheetSize + 2),
    height: (maxSheetY + 1) * (sheetSize + 2),
  };
  writeFileSync(
    join(targetDir, "emoji-map.json"),
    JSON.stringify(imageMap),
    "utf8",
  );
}

console.log(
  `[apple-emoji] copied Apple emoji sheet (${Math.round(
    statSync(join(targetDir, "apple-sheet.png")).size / 1024,
  )} KB) and emoji map to public/emoji.`,
);
