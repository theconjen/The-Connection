export async function apiRequest<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? (res.json() as Promise<T>) : ((await res.text()) as unknown as T);
}
