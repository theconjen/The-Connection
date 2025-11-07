#!/usr/bin/env node
import path from "node:path";
import process from "node:process";

import { build } from "vite";

async function main() {
  const configFile = path.resolve(process.cwd(), "vite.config.ts");
  const mode = process.env.NODE_ENV ?? "production";

  await build({
    configFile,
    mode,
    logLevel: process.env.VITE_LOG_LEVEL || "info",
  });
}

main().catch((error) => {
  console.error("Vite web build failed", error);
  process.exitCode = 1;
});
