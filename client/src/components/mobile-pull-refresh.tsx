import { useState } from 'react';
import PullToRefresh from 'react-pull-to-refresh';
import { Loader2 } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

interface MobilePullRefreshProps {
  onRefresh: () => Promise<any>;
  children: React.ReactNode;
}

export default function MobilePullRefresh({ onRefresh, children }: MobilePullRefreshProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [refreshing, setRefreshing] = useState(false);
  
  // If not on mobile, just render children without pull-to-refresh
  if (!isMobile) {
    return <>{children}</>;
  }
  
  const handleRefresh = () => {
    setRefreshing(true);
    return onRefresh().finally(() => {
      setRefreshing(false);
    });
  };

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullDownThreshold={70}
      pullDownContent={
        <div className="flex items-center justify-center h-10 text-muted-foreground">
          <span className="text-sm">Pull down to refresh</span>
        </div>
      }
      refreshingContent={
        <div className="flex items-center justify-center h-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Refreshing...</span>
        </div>
      }
      className="mobile-pull-refresh"
    >
      <div className={refreshing ? 'opacity-75' : ''}>
        {children}
      </div>
    </PullToRefresh>
  );
}