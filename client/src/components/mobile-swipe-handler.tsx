import { useState, useRef, useCallback, useEffect } from "react";

interface SwipeHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Mobile Swipe Handler Component
 * Provides smooth swipe gesture detection for mobile interfaces
 */
export default function SwipeHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = "",
  disabled = false
}: SwipeHandlerProps) {
  const [startTouch, setStartTouch] = useState<{ x: number; y: number } | null>(null);
  const [currentTouch, setCurrentTouch] = useState<{ x: number; y: number } | null>(null);
  const [swiping, setSwiping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setStartTouch({ x: touch.clientX, y: touch.clientY });
    setCurrentTouch({ x: touch.clientX, y: touch.clientY });
    setSwiping(false);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !startTouch) return;
    
    const touch = e.touches[0];
    const current = { x: touch.clientX, y: touch.clientY };
    setCurrentTouch(current);

    const deltaX = current.x - startTouch.x;
    const deltaY = current.y - startTouch.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > threshold * 0.3) {
      setSwiping(true);
    }
  }, [disabled, startTouch, threshold]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled || !startTouch || !currentTouch) {
      setStartTouch(null);
      setCurrentTouch(null);
      setSwiping(false);
      return;
    }

    const deltaX = currentTouch.x - startTouch.x;
    const deltaY = currentTouch.y - startTouch.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if this is a swipe gesture
    if (Math.max(absDeltaX, absDeltaY) < threshold) {
      setStartTouch(null);
      setCurrentTouch(null);
      setSwiping(false);
      return;
    }

    // Determine swipe direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    setStartTouch(null);
    setCurrentTouch(null);
    setSwiping(false);
  }, [disabled, startTouch, currentTouch, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // Cancel swipe on touch cancel
  const handleTouchCancel = useCallback(() => {
    setStartTouch(null);
    setCurrentTouch(null);
    setSwiping(false);
  }, []);

  // Prevent context menu on long press during swipe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventContextMenu = (e: Event) => {
      if (swiping) {
        e.preventDefault();
      }
    };

    container.addEventListener('contextmenu', preventContextMenu);
    return () => {
      container.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [swiping]);

  return (
    <div
      ref={containerRef}
      className={`touch-manipulation ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{
        userSelect: swiping ? 'none' : 'auto',
        WebkitUserSelect: swiping ? 'none' : 'auto',
      }}
    >
      {children}
    </div>
  );
}