declare module '@tanstack/react-query' {
  // Minimal compatibility shims for the project's current codebase.
  // These are temporary and should be replaced by proper imports/types.
  export type QueryClient = any;
  export const QueryClient: QueryClient;
  export const QueryClientProvider: any;
  export type QueryClientProviderProps = any;
  export type QueryFunction<T = any> = (...args: any[]) => Promise<T>;
  // Make UseMutationResult generic so call-sites using generics compile.
  export type UseMutationResult<TData = any, TError = any, TVariables = any, TContext = any> = any;
  export const useQuery: (...args: any[]) => any;
  export const useMutation: (...args: any[]) => UseMutationResult<any, any, any, any>;
  export const useQueryClient: () => any;
  export const useIsFetching: (...args: any[]) => any;
  export const useIsMutating: (...args: any[]) => any;
  export const useQueryErrorResetBoundary: (...args: any[]) => any;
  export const usePrefetchQuery: (...args: any[]) => any;
  export const useInfiniteQuery: (...args: any[]) => any;
  export const useInfiniteQueryClient: any;
}
