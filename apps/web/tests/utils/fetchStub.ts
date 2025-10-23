import type { Page } from "@playwright/test";

export type StubbedResponse = { status?: number; headers?: Record<string, string>; body?: any };
export type RouteMap = Record<string, (url: URL, meta?: any) => StubbedResponse | Promise<StubbedResponse>>;

/**
 * Install a global fetch stub before any page scripts run. Routes are handled in the Node context via exposeFunction,
 * so you can pass real functions and state into the route handlers.
 */
export async function installFetchStub(page: Page, routes: RouteMap) {
  const DEBUG = false;
  await page.exposeFunction("__FETCH_STUB_DISPATCH__", async (href: string, meta?: any) => {
  // Safely derive pathname and search without relying on full URL parsing (handles invalid hosts like dev.api.theconnection.app)
    let pathWithSearch = '/';
    try {
      if (/^https?:\/\//i.test(href)) {
        const protoIdx = href.indexOf('://');
        const slashIdx = href.indexOf('/', protoIdx + 3);
        if (slashIdx >= 0) {
          pathWithSearch = href.slice(slashIdx);
        } else {
          pathWithSearch = '/';
        }
      } else if (href.startsWith('/')) {
        pathWithSearch = href;
      } else {
        // relative path, ensure leading slash for URL constructor
        pathWithSearch = href.startsWith('/') ? href : `/${href}`;
      }
    } catch {
      pathWithSearch = '/';
    }

    const u = new URL(`http://localhost${pathWithSearch}`);
    const key = Object.keys(routes).find((k) => u.pathname.startsWith(k));
    if (!key) {
      if (DEBUG) console.log(`[fetchStub] passthrough: ${u.pathname}${u.search}`);
      return null;
    }
    const out = await routes[key](u, meta);
    if (DEBUG) {
      console.log(`[fetchStub] handled: ${u.pathname}${u.search} -> status ${out?.status ?? 200}`);
      try { console.log(`[fetchStub] nextCursor: ${(out as any)?.body?.nextCursor}`); } catch {}
    }
    return out;
  });

  await page.addInitScript(() => {
    const realFetch = window.fetch.bind(window);
    // mark active and collect hits for debugging
  (window as any).__FETCH_STUB_ACTIVE__ = true;
  (window as any).__FETCH_STUB_HITS__ = [];
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let href: string;
      if (typeof input === "string") {
        href = input;
      } else if (input instanceof URL) {
        href = input.toString();
      } else {
        href = (input as Request).url;
      }
      const meta = { mode: (window as any).__FEED_MODE__ };
      const res: any = await (window as any).__FETCH_STUB_DISPATCH__(href, meta);
      if (res) {
        try {
          const nc = (res as any)?.body?.nextCursor;
          (window as any).__FETCH_STUB_HITS__.push({ href, handled: true, status: res.status ?? 200, nextCursor: nc });
          // eslint-disable-next-line no-console
          if ((window as any).__FETCH_STUB_DEBUG__) console.log(`[fetchStub] browser handled: ${href} nextCursor=${nc}`);
        } catch {
          if ((window as any).__FETCH_STUB_DEBUG__) console.log(`[fetchStub] browser handled: ${href}`);
        }
        return new Response(JSON.stringify(res.body), {
          status: res.status ?? 200,
          headers: { "content-type": "application/json", ...(res.headers || {}) },
        });
      }
      (window as any).__FETCH_STUB_HITS__.push({ href, handled: false });
      if ((window as any).__FETCH_STUB_DEBUG__) console.log(`[fetchStub] browser passthrough: ${href}`);
      return realFetch(input as any, init);
    };
  });
}
