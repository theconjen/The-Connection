import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMediaQuery } from '../hooks/use-media-query';

interface MobilePullRefreshProps {
  onRefresh: () => Promise<any>;
  children: React.ReactNode;
}

export default function MobilePullRefresh({ onRefresh, children }: MobilePullRefreshProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const threshold = 70; // Pixels to pull down before refreshing
  
  // If not on mobile, just render children without pull-to-refresh
  if (!isMobile) {
    return <>{children}</>;
  }
  
  const handleRefresh = () => {
    setRefreshing(true);
    return onRefresh().finally(() => {
      setRefreshing(false);
      setCurrentY(0);
    });
  };
  
  const onTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setCurrentY(0);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    const y = e.touches[0].clientY - startY;
    if (y > 0) {
      setCurrentY(y);
    }
  };
  
  const onTouchEnd = () => {
    if (currentY > threshold && !refreshing) {
      handleRefresh();
    }
    setCurrentY(0);
  };
  
  const pullDistance = Math.min(currentY * 0.4, 100);
  const pullProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div 
      className="mobile-pull-refresh-container" 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ overflowY: 'visible' }}
    >
      {currentY > 0 && (
        <div 
          className="flex items-center justify-center transition-transform"
          style={{ 
            height: `${pullDistance}px`,
            opacity: pullProgress,
            transform: `translateY(${currentY > threshold ? 5 : 0}px)`
          }}
        >
          {currentY > threshold ? (
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">Release to refresh</span>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">Pull down to refresh</span>
            </div>
          )}
        </div>
      )}
      
      {refreshing && (
        <div className="flex items-center justify-center h-12 bg-background">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
          <span className="text-sm">Refreshing...</span>
        </div>
      )}
      
      <div className={refreshing ? 'opacity-75' : ''}>
        {children}
      </div>
    </div>
  );
}