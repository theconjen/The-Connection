import { Capacitor } from "@capacitor/core";

const WEB_API = import.meta.env.VITE_API_BASE || "/api";
const NATIVE_API =
  import.meta.env.VITE_NATIVE_API || "https://api.theconnection.app";

export const API_BASE = Capacitor.isNativePlatform() ? NATIVE_API : WEB_API;

;(window as any).__API_BASE = API_BASE;
console.log("[API_BASE]", API_BASE, "native=", Capacitor.isNativePlatform());

type FetchOpts = RequestInit & { expectJson?: boolean };

export async function apiFetch(path: string, opts: FetchOpts = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const { expectJson = true, ...rest } = opts;

  const response = await fetch(url, {
    credentials: "include",
    ...rest,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = /application\/json/i.test(contentType);
  const preview = await response
    .clone()
    .text()
    .catch(() => "");

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} for ${url}\nContent-Type: ${contentType}\nFirst 120 chars: ${preview.slice(0, 120)}`
    );
  }

  if (!expectJson) {
    return response;
  }

  if (!isJson) {
    throw new Error(
      `Expected JSON from ${url} but got ${contentType}. First chars: ${preview.slice(0, 80)}`
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from ${url}. First chars: ${preview.slice(0, 120)}`
    );
  }
}
