import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface ContentFallbackProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  retry?: () => void;
  children?: ReactNode;
}

export default function ContentFallback({
  title = "Content Unavailable",
  description = "We couldn't load this content. Please try again later.",
  icon,
  action,
  retry,
  children
}: ContentFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border  border/40 rounded-md bg-card/30 min-h-[200px]">
      {icon}
      <h3 className="text-lg font-medium mt-4 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {description}
      </p>
      
      {retry && (
        <Button
          variant="outline"
          size="sm"
          onClick={retry}
          className="flex items-center gap-1 mb-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
      
      {action && (
        <Button
          variant="default"
          size="sm"
          onClick={action.onClick}
          className="flex items-center gap-1"
        >
          {action.label}
        </Button>
      )}
      
      {children}
    </div>
  );
}