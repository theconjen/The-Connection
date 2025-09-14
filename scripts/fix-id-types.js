import { promises as fs } from "fs";
import path from "path";

/** Folders to scan (edit if needed) */
const ROOTS = ["server", "shared", "packages", "libs"].filter(async p => p);

/** File extensions to include */
const EXT = new Set([".ts", ".tsx"]);

/** Any of these names will be treated as numeric IDs */
const ID_NAMES = [
  "id",
  "userId",
  "communityId",
  "postId",
  "commentId",
  "groupId",
  "memberId",
  "roomId",
  "messageId",
  "eventId",
  "rsvpId",
  "livestreamId",
  "applicationId",
  "answerId",
  "questionId",
  "resourceId",
  "collectionId",
  "giftId",
  "tierId",
  "organizationId"
];

/**
 * Build one big regex that matches:
 *   <idName>   :   string
 * across params, interfaces, types, etc.
 * Examples it will hit:
 *   userId: string
 *   (communityId: string)
 *   { postId: string }
 */
const idAlt = ID_NAMES.map(n => n.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|");
const RX_ID_STRING =
  new RegExp(`\\b(${idAlt})\\b\\s*:\\s*string\\b`, "g");

/** Optionally, restrict changes to “server” & “shared” only. */
async function collectFiles(dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      await collectFiles(p, acc);
    } else {
      const ext = path.extname(e.name);
      if (EXT.has(ext)) acc.push(p);
    }
  }
  return acc;
}

async function maybeRead(p) {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

async function writeIfChanged(p, before, after) {
  if (before !== after) {
    await fs.writeFile(p, after, "utf8");
    return true;
  }
  return false;
}

async function run() {
  const roots = [];
  for (const r of ROOTS) {
    try {
      const stat = await fs.stat(r);
      if (stat.isDirectory()) roots.push(r);
    } catch {}
  }
  if (roots.length === 0) {
    console.log("No roots found. Edit ROOTS in scripts/fix-id-types.js");
    process.exit(0);
  }

  /** backup */
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = `.backups/fix-id-types-${stamp}`;
  await fs.mkdir(backupDir, { recursive: true });

  let files = [];
  for (const r of roots) {
    files = files.concat(await collectFiles(r));
  }

  let totalHits = 0;
  let changedCount = 0;

  for (const file of files) {
    const src = await maybeRead(file);
    if (src == null) continue;

    // Count matches first (for stats)
    const matches = src.match(RX_ID_STRING);
    const hits = matches ? matches.length : 0;
    if (!hits) continue;

    const next = src.replace(RX_ID_STRING, (_m, name) => `${name}: number`);
    if (await writeIfChanged(file, src, next)) {
      // Save backup copy of original (once per changed file)
      const rel = file;
      const dest = path.join(backupDir, rel.replace(/[\\/]/g, "__"));
      await fs.writeFile(dest, src, "utf8");
      totalHits += hits;
      changedCount++;
      console.log(`✔ ${file}  (${hits} change${hits === 1 ? "" : "s"})`);
    }
  }

  console.log(`\nDone. Updated ${changedCount} file(s), ${totalHits} occurrence(s).`);
  console.log(`Backups saved under: ${backupDir}`);
  console.log("Tip: run your TypeScript build to see any places that now need parseInt on req.params.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
