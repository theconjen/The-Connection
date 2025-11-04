import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiUrl } from "./env";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Support both `apiRequest(method, url, data?)` and `apiRequest(url, options?)` call styles
export async function apiRequest(
  methodOrUrl: string,
  maybeUrlOrOptions?: string | { method?: string; body?: string } | unknown,
  maybeData?: unknown,
): Promise<Response> {
  let method = 'GET';
  let url = methodOrUrl;
  let data: unknown | undefined = undefined;

  // Caller used (method, url, data)
  if (maybeUrlOrOptions && typeof maybeUrlOrOptions === 'string') {
    method = methodOrUrl;
    url = maybeUrlOrOptions;
    data = maybeData;
  } else if (maybeUrlOrOptions && typeof maybeUrlOrOptions === 'object') {
    // Caller used (url, options)
    const opts = maybeUrlOrOptions as any;
    method = opts.method || 'GET';
    data = opts.body ? JSON.parse(opts.body) : undefined;
  }

  const res = await fetch(apiUrl(url), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
// Return 'any' from getQueryFn so callers who don't pass a generic receive 'any' instead of 'unknown'.
export const getQueryFn = (options: { on401: UnauthorizedBehavior }): QueryFunction<any> => {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }) => {
    try {
  const res = await fetch(apiUrl(queryKey[0] as string), {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null as any;
      }

      await throwIfResNotOk(res);
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        // API returned HTML instead of JSON, likely a routing issue
        console.warn('API endpoint returned HTML instead of JSON:', queryKey[0]);
        throw new Error('API_NOT_AVAILABLE');
      }
      
      return (await res.json()) as any;
    } catch (error) {
      if (error instanceof Error && error.message === 'API_NOT_AVAILABLE') {
        throw error;
      }
      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        console.warn('Failed to parse JSON response from:', queryKey[0]);
        throw new Error('API_NOT_AVAILABLE');
      }
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
