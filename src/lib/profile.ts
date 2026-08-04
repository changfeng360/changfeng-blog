import fs from "node:fs";
import path from "node:path";
import type { Profile } from "@/data/content";

const profilePath = path.join(process.cwd(), "content", "profile.json");

export function getProfile(): Profile {
  const raw = fs.readFileSync(profilePath, "utf8");
  return JSON.parse(raw) as Profile;
}
