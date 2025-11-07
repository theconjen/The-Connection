export function log(...args: unknown[]): void {
  if (process.env.NODE_ENV !== "test") {
    console.log(...args);
  }
}

export async function setupVite(_app: unknown, _server: unknown) {
  return { vite: null };
}

export function serveStatic(_app: unknown) {
  return (_req: unknown, _res: unknown, next?: (...args: unknown[]) => void) => {
    if (typeof next === "function") {
      next();
    }
  };
}

export default { log, setupVite, serveStatic };
