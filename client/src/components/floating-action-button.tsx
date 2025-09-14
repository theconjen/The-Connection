import React from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-center';
  className?: string;
}

export default function FloatingActionButton({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  className,
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-center': 'bottom-20 left-1/2 transform -translate-x-1/2',
  };

  return (
    <Button
      onClick={onClick}
      className={cn(
        'fixed z-50 shadow-lg active-scale touch-target',
        'h-14 w-14 rounded-full', 
        'bg-primary hover:bg-primary/90',
        'flex items-center justify-center',
        positionClasses[position],
        className
      )}
      aria-label={label || 'Action button'}
    >
      {icon}
      {label && <span className="sr-only">{label}</span>}
    </Button>
  );
}