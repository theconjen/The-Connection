import { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "shared/services/feed";

function Skeleton({ h = 80 }: { h?: number }) {
  return (
    <div
      className="bg-card border border-border rounded-xl opacity-60 mb-3"
      style={{ height: h }}
    />
  );
}

export default function FeedPage() {
  const lastUpdatedRef = useRef<number | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["feed"],
    queryFn: getFeed,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false // disable retries for deterministic UX & E2E error assertions
  });

  useEffect(() => {
    if (data && !isRefetching) lastUpdatedRef.current = Date.now();
  }, [data, isRefetching]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted">
          Last updated{" "}
          {lastUpdatedRef.current
            ? new Date(lastUpdatedRef.current).toLocaleTimeString()
            : "—"}
        </div>
        <button
          className="bg-card border border-border rounded px-3 py-1 text-sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <>
          <Skeleton /><Skeleton /><Skeleton />
        </>
      ) : isError ? (
        <div className="text-danger">
          Failed to load feed
          <div className="text-muted mt-1 text-sm">
            {(error as any)?.message || "Unknown error"}
          </div>
          <button className="text-primary mt-2" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <div>
          {data?.length ? (
            data.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4 mb-3">
                <div className="font-semibold">{item.title}</div>
                <div className="text-muted mt-1">{item.body}</div>
                <div className="text-muted mt-2 text-xs">{item.createdAt}</div>
              </div>
            ))
          ) : (
            <div className="text-muted">No items yet</div>
          )}
        </div>
      )}
    </div>
  );
}
