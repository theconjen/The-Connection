declare module '@tanstack/react-query' {
  // Provide a default TData of any for useQuery so existing call-sites without generics
  // get 'any' instead of 'unknown'. This is a temporary compatibility shim while we
  // incrementally type the client queries.
  import { QueryObserverOptions, UseQueryResult } from '@tanstack/react-query';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export function useQuery<TData = any, TError = Error, TQueryFnData = unknown, TQueryKey extends readonly unknown[] = readonly unknown[]>(options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError>;
}
