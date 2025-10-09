import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { fmtDate } from "shared/i18n/format";
import { getFeedPage } from "shared/services/feed";

function Skeleton({ h = 80 }: { h?: number }) {
  return (
    <div
      className="bg-card border border-border rounded-xl opacity-60 mb-3"
      style={{ height: h }}
    />
  );
}

export default function FeedPage() {
  const { t, i18n } = useTranslation();
  const lastUpdatedRef = useRef<number | null>(null);

  const [pages, setPages] = useState<import('shared/app-schema').FeedPage[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [initialError, setInitialError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<Error | null>(null);

  const items = useMemo(() => pages.flatMap(p => p.items), [pages]);
  const nextCursor = pages.length ? pages[pages.length - 1].nextCursor : null;
  const hasNextPage = nextCursor != null;

  const loadInitial = useCallback(async () => {
    if (typeof window !== 'undefined') console.debug('[FeedPage] loadInitial');
    setInitialLoading(true);
    setInitialError(null);
    try {
      const page = await getFeedPage(null);
      setPages([page]);
      lastUpdatedRef.current = Date.now();
    } catch (e: any) {
      setInitialError(e);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setInitialError(null);
    try {
      const page = await getFeedPage(null);
      setPages([page]);
      lastUpdatedRef.current = Date.now();
    } catch (e: any) {
      setInitialError(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || loadingMore) return;
    if (typeof window !== 'undefined') console.debug('[FeedPage] fetchNextPage', { nextCursor });
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await getFeedPage(nextCursor);
      setPages(prev => [...prev, page]);
      lastUpdatedRef.current = Date.now();
    } catch (e: any) {
      setLoadMoreError(e);
    } finally {
      setLoadingMore(false);
    }
  }, [hasNextPage, loadingMore, nextCursor]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // (Debug globals removed – tests rely solely on network + DOM now)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted" data-testid="feed-last-updated">
          {t("feed.lastUpdated", {
            time: lastUpdatedRef.current
              ? fmtDate(lastUpdatedRef.current, i18n.language)
              : "—",
          })}
        </div>
        <button
          className="bg-card border border-border rounded px-3 py-1 text-sm"
          onClick={() => refresh()}
          disabled={refreshing}
          data-testid="feed-refresh"
        >
          {refreshing ? t("feed.refresh") + "…" : t("feed.refresh")}
        </button>
      </div>

      {initialLoading ? (
        <>
          <Skeleton /><Skeleton /><Skeleton />
        </>
      ) : initialError ? (
        <div className="text-danger" data-testid="feed-initial-error">
          {t("error.failedToLoadFeed")}
          <div className="text-muted mt-1 text-sm">
            {initialError?.message || "Unknown error"}
          </div>
          <button className="text-primary mt-2" onClick={() => refresh()} data-testid="feed-try-again">
            {t("feed.tryAgain")}
          </button>
        </div>
      ) : (
        <div>
          {items.length ? (
            items.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4 mb-3">
                <div className="font-semibold">{item.title}</div>
                <div className="text-muted mt-1">{item.body}</div>
                <div className="text-muted mt-2 text-xs">{item.createdAt}</div>
              </div>
            ))
          ) : (
            <div className="text-muted">{t("feed.empty")}</div>
          )}
          <div className="mt-4">
            {hasNextPage ? (
              <button
                className="bg-card border border-border rounded px-3 py-1 text-sm"
                onClick={() => fetchNextPage()}
                disabled={loadingMore}
                data-testid="feed-load-more"
              >
                {loadingMore ? t("feed.loadMore") + "…" : t("feed.loadMore")}
              </button>
            ) : (
              <div className="text-muted text-sm" data-testid="feed-end">{t("feed.end")}</div>
            )}
            {loadMoreError && (
              <div className="text-danger text-sm mt-2" data-testid="feed-load-more-error">{t("error.generic")}: {loadMoreError.message}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
