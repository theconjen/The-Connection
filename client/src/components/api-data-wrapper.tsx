import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import ContentFallback from './content-fallback';

interface ApiDataWrapperProps<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: (data: T) => React.ReactNode;
  onRetry?: () => void;
  emptyComponent?: React.ReactNode;
  emptyCheck?: (data: T) => boolean;
}

export default function ApiDataWrapper<T>({
  data,
  isLoading,
  error,
  loadingComponent,
  errorComponent,
  children,
  onRetry,
  emptyComponent,
  emptyCheck = (data) => Array.isArray(data) && data.length === 0
}: ApiDataWrapperProps<T>) {
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        <p className="mt-4 text-muted-foreground">Loading content...</p>
      </div>
    );
  }

  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <ContentFallback
        title="Unable to load content"
        description={error.message || "There was a problem loading this content. Please try again."}
        icon={<AlertTriangle className="h-8 w-8 text-amber-500" />}
        retry={onRetry}
      />
    );
  }

  if (!data) {
    return (
      <ContentFallback
        title="No data available"
        description="The requested content could not be loaded."
        retry={onRetry}
      />
    );
  }

  if (emptyCheck(data) && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return <>{children(data)}</>;
}