import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Use `any` to avoid strict ServerOptions typing mismatches across vite versions
  const serverOptions: any = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  // If not running in development, don't attempt to load vite at all.
  const isDev = app.get("env") === "development" || process.env.NODE_ENV === "development";
  if (!isDev) return;

  // Dynamically import vite and create a logger only when needed in development.
  let createViteServer: any;
  let createLogger: any;
  try {
    const viteModule: any = await import("vite");
    createViteServer = viteModule.createServer || viteModule.createServer;
    createLogger = viteModule.createLogger || viteModule.createLogger;
  } catch (e) {
    // If vite isn't available, log and skip Vite setup rather than crashing the process.
    console.warn("Vite not found; skipping development middleware.", e);
    return;
  }

  const viteLogger = createLogger();

  // Dynamically import vite.config only in development. Static import causes
  // Node to attempt resolving vite.config.ts in production which may not exist
  // (and isn't needed).
  let viteConfig: any = {};
  if (isDev) {
    try {
      // Import the vite config dynamically; cast to any to avoid missing 'default' on the fallback {}
      const maybeConfig: any = await import("../vite.config.js").catch(() =>
        import("../vite.config.ts").catch(() => ({}))
      );
      viteConfig = (maybeConfig && maybeConfig.default) || maybeConfig || {};
    } catch (e) {
      viteConfig = {};
    }
  }

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg: any, options: any) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist/public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
