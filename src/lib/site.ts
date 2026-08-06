import fs from "node:fs";
import path from "node:path";

export type SiteSettings = {
  baseFontSize: number;
  headingItalic: boolean;
  accentColor: string;
  backgroundColor: string;
  darkBackground: string;
  nowItems: string[];
};

const sitePath = path.join(process.cwd(), "content", "site.json");

export function getSiteSettings(): SiteSettings {
  const raw = fs.readFileSync(sitePath, "utf8");
  return JSON.parse(raw) as SiteSettings;
}
