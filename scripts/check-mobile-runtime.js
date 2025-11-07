#!/usr/bin/env node
/**
 * Guard to ensure Expo runtimeVersion is bumped whenever native-affecting changes occur.
 * Looks for plugin/native config edits in the latest commit range and fails if runtimeVersion is untouched.
 */

const { execSync } = require("node:child_process");

function run(command) {
  return execSync(command, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

function safeRun(command) {
  try {
    return run(command);
  } catch (error) {
    return "";
  }
}

const defaultRange = (() => {
  try {
    execSync("git rev-parse HEAD^", { stdio: "ignore" });
    return "HEAD^..HEAD";
  } catch (error) {
    return "";
  }
})();

const range = process.env.GIT_DIFF_RANGE || defaultRange;

if (!range) {
  console.log("[runtime-guard] No previous commit to diff against. Skipping guard.");
  process.exit(0);
}

const diffFilesOutput = safeRun(`git diff --name-only ${range}`);
if (!diffFilesOutput) {
  console.log("[runtime-guard] No file changes detected in range. Skipping guard.");
  process.exit(0);
}

const diffFiles = diffFilesOutput.split(/\r?\n/).filter(Boolean);
const guardFiles = [
  "apps/mobile/app.config.ts",
  "apps/mobile/package.json",
  "mobile-app/TheConnectionMobile/app.json",
  "mobile-app/TheConnectionMobile/package.json",
];

const watchedTouched = diffFiles.filter((file) => guardFiles.includes(file));

if (watchedTouched.length === 0) {
  console.log("[runtime-guard] No native configuration changes detected. Skipping guard.");
  process.exit(0);
}

const guardDiff = safeRun(`git diff ${range} -- ${guardFiles.join(" ")}`);
if (!guardDiff) {
  console.log("[runtime-guard] Unable to inspect diff contents. Skipping guard.");
  process.exit(0);
}

const pluginChanged = /^(?:\+|-).*?(plugins|expo-build-properties)/m.test(guardDiff);
const nativeConfigChanged = /^(?:\+|-).*?(android\s*:\s*\{|ios\s*:\s*\{)/m.test(guardDiff);
const runtimeChanged = /^(?:\+|-).*?runtimeVersion/m.test(guardDiff);

if ((pluginChanged || nativeConfigChanged) && !runtimeChanged) {
  console.error(
    "[runtime-guard] Detected native-affecting changes (plugins or native config) without a runtimeVersion update.\n" +
      "Please bump expo.runtimeVersion in apps/mobile/app.config.ts before promoting this release."
  );
  process.exit(1);
}

console.log("[runtime-guard] Native configuration changes look good.");
