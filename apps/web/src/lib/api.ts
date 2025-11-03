const DEV_API_HOST = (import.meta.env.VITE_API_HOST as string | undefined) ?? "http://localhost:5000/api";

const API_HOST = import.meta.env.PROD
  ? "https://api.theconnection.app/api"
  : DEV_API_HOST;

if (typeof window !== "undefined") {
  (window as any).__API_BASE = API_HOST;
}

const stripApiPrefix = (segment: string) => {
  const lower = segment.toLowerCase();
  if (lower === "api") return "";
  if (lower.startsWith("api/")) {
    return segment.slice(segment.toLowerCase().indexOf("api/") + 4);
  }
  return segment;
};

const join = (...parts: string[]) =>
  parts
    .map((p) => (p ?? "").toString().replace(/^\/+|\/+$/g, ""))
    .map(stripApiPrefix)
    .filter(Boolean)
    .join("/");

export const API_BASE = API_HOST;

export const apiUrl = (path: string) => {
  if (!path) return API_HOST;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = join(path);
  if (!normalized) return API_HOST;
  return `${API_HOST}/${normalized}`;
};

export async function api(path: string, init: RequestInit = {}) {
  const url = apiUrl(path);
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  return res;
}

export const getJson = async <T>(path: string) => {
  const r = await api(path);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return (await r.json()) as T;
};

export const postJson = async <T>(path: string, body: unknown) => {
  const r = await api(path, { method: "POST", body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return (await r.json()) as T;
};
