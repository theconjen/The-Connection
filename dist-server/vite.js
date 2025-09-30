import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const isDev = app.get("env") === "development" || process.env.NODE_ENV === "development";
  if (!isDev) return;
  let createViteServer;
  let createLogger;
  try {
    const viteModule = await import("vite");
    createViteServer = viteModule.createServer || viteModule.createServer;
    createLogger = viteModule.createLogger || viteModule.createLogger;
  } catch (e) {
    console.warn("Vite not found; skipping development middleware.", e);
    return;
  }
  const viteLogger = createLogger();
  let viteConfig = {};
  if (isDev) {
    try {
      const maybeConfig = await import("../vite.config.js").catch(
        () => import("../vite.config.ts").catch(() => ({}))
      );
      viteConfig = maybeConfig && maybeConfig.default || maybeConfig || {};
    } catch (e) {
      viteConfig = {};
    }
  }
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = path.resolve(process.cwd(), "dist/public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
export {
  log,
  serveStatic,
  setupVite
};
