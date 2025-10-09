// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      shared: path.resolve(__dirname, "../../shared"),
      "shared-env": path.resolve(__dirname, "./src/env.web"),
    },
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname),               // apps/web
        path.resolve(__dirname, "../../"),     // repo root => ../../shared
      ],
    },
    // Explicit port
    port: 5173,
  },
});
