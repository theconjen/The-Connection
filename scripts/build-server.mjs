import { build } from "esbuild";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SERVER_DIR = path.join(ROOT, "server");
const SHARED_DIR = path.join(ROOT, "shared");
const OUTPUT_DIR = path.join(ROOT, "dist-server");
const SHARED_OUTPUT_DIR = path.join(OUTPUT_DIR, "shared");

function walk(dir) {
  const stack = [dir];
  const files = [];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function copyAssets(files, sourceDir, outDir) {
  const assets = files.filter((file) => {
    return !file.endsWith(".ts") && !file.endsWith(".tsx");
  });

  for (const asset of assets) {
    const relative = path.relative(sourceDir, asset);
    const destination = path.join(outDir, relative);
    await ensureDir(path.dirname(destination));
    await fsp.copyFile(asset, destination);
  }
}

function normalizeRelativePath(fromDir, toFile) {
  let relativePath = path.relative(fromDir, toFile).replace(/\\/g, "/");
  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }
  return relativePath;
}

async function rewriteSharedImports() {
  const files = walk(OUTPUT_DIR).filter((file) => file.endsWith(".js"));

  for (const file of files) {
    if (file.startsWith(SHARED_OUTPUT_DIR)) continue;

    const original = await fsp.readFile(file, "utf8");
    let transformed = original;

    const replacements = [
      {
        pattern: /require\(["']@shared\/(.+?)["']\)/g,
        replacer: (match, subpath) => {
          const withExt = subpath.endsWith(".js") ? subpath : `${subpath}.js`;
          const target = path.join(SHARED_OUTPUT_DIR, withExt);
          const normalized = normalizeRelativePath(path.dirname(file), target);
          return `require("${normalized}")`;
        },
      },
      {
        pattern: /from\s+["']@shared\/(.+?)["']/g,
        replacer: (match, subpath) => {
          const withExt = subpath.endsWith(".js") ? subpath : `${subpath}.js`;
          const target = path.join(SHARED_OUTPUT_DIR, withExt);
          const normalized = normalizeRelativePath(path.dirname(file), target);
          return `from "${normalized}"`;
        },
      },
      {
        pattern: /import\(["']@shared\/(.+?)["']\)/g,
        replacer: (match, subpath) => {
          const withExt = subpath.endsWith(".js") ? subpath : `${subpath}.js`;
          const target = path.join(SHARED_OUTPUT_DIR, withExt);
          const normalized = normalizeRelativePath(path.dirname(file), target);
          return `import("${normalized}")`;
        },
      },
      {
        pattern: /import\((['"])(\.?\.?\/[^'"\s]+)\1\)/g,
        replacer: (match, quote, specifier) => {
          if (specifier.startsWith("./shared/")) {
            // Already handled by earlier replacements
            return match;
          }
          if (path.extname(specifier)) {
            return `import(${quote}${specifier}${quote})`;
          }
          return `import(${quote}${specifier}.js${quote})`;
        },
      },
    ];

    for (const { pattern, replacer } of replacements) {
      transformed = transformed.replace(pattern, replacer);
    }

    if (transformed !== original) {
      await fsp.writeFile(file, transformed, "utf8");
    }
  }
}

async function buildDirectory(sourceDir, outDir, { define = {} } = {}) {
  const files = walk(sourceDir);
  const entryPoints = files.filter((file) => {
    if (file.endsWith(".d.ts")) return false;
    return file.endsWith(".ts") || file.endsWith(".tsx");
  });

  if (entryPoints.length > 0) {
    await ensureDir(outDir);
    await build({
      absWorkingDir: ROOT,
      entryPoints,
      outdir: outDir,
      outbase: sourceDir,
      platform: "node",
      format: "cjs",
      packages: "external",
      sourcemap: false,
      logLevel: "info",
      define,
      loader: {
        ".ts": "ts",
        ".tsx": "tsx",
      },
    });
  }

  await copyAssets(files, sourceDir, outDir);

  return entryPoints.length;
}

async function main() {
  await fsp.rm(OUTPUT_DIR, { recursive: true, force: true });

  const serverCount = await buildDirectory(SERVER_DIR, OUTPUT_DIR);

  if (serverCount === 0) {
    throw new Error("No TypeScript entry points found in server directory");
  }

  const sharedCount = await buildDirectory(SHARED_DIR, SHARED_OUTPUT_DIR);

  await rewriteSharedImports();

  console.log(
    `Built ${serverCount + sharedCount} modules to ${OUTPUT_DIR} (server: ${serverCount}, shared: ${sharedCount})`
  );
}

main().catch((err) => {
  console.error("Server build failed", err);
  process.exitCode = 1;
});
