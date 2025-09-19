export async function apiRequest<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include", // sends cookies for session
    headers: {
      "Content-Type": "application/json",
    },
    ...(init ?? {}),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`API error ${res.status}: ${msg}`);
  }

  if (res.status === 204) {
    // No content
    return undefined as T;
  }

  return (await res.json()) as T;
}
