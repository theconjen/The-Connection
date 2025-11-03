import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { api } from "./env";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Support both `apiRequest(method, url, data?)` and `apiRequest(url, options?)` call styles
export async function apiRequest(
  methodOrUrl: string,
  maybeUrlOrOptions?: string | RequestInit,
  maybeData?: unknown,
): Promise<Response> {
  let url = methodOrUrl;
  let init: RequestInit = {};

  if (typeof maybeUrlOrOptions === "string") {
    url = maybeUrlOrOptions;
    init = {
      method: methodOrUrl,
      body: maybeData !== undefined ? JSON.stringify(maybeData) : undefined,
    };
  } else if (maybeUrlOrOptions) {
    init = { ...(maybeUrlOrOptions as RequestInit) };
  }

  if (!init.method) {
    init.method = "GET";
  }

  if (init.body && typeof init.body !== "string") {
    init.body = JSON.stringify(init.body);
  }

  const res = await api(url, init);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
// Return 'any' from getQueryFn so callers who don't pass a generic receive 'any' instead of 'unknown'.
export const getQueryFn = (options: { on401: UnauthorizedBehavior }): QueryFunction<any> => {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }) => {
    try {
      const res = await api(queryKey[0] as string, {
        method: "GET",
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
