import { rmSync } from "node:fs";
import { join } from "node:path";

rmSync(join(process.cwd(), "public", "admin"), {
  recursive: true,
  force: true,
});
