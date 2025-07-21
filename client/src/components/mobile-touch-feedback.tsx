import { useState, useEffect } from "react";

interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  hapticFeedback?: boolean;
  pressScale?: number;
  onPress?: () => void;
}

/**
 * Mobile Touch Feedback Component
 * Provides visual and haptic feedback for touch interactions
 */
export default function TouchFeedback({ 
  children, 
  className = "", 
  hapticFeedback = true,
  pressScale = 0.97,
  onPress
}: TouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [vibrationSupported, setVibrationSupported] = useState(false);

  useEffect(() => {
    setVibrationSupported('vibrate' in navigator);
  }, []);

  const handleTouchStart = () => {
    setIsPressed(true);
    if (hapticFeedback && vibrationSupported) {
      navigator.vibrate(5); // Very light haptic feedback
    }
    onPress?.();
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <div
      className={`transition-transform duration-150 ${className} ${
        isPressed ? 'brightness-90' : ''
      }`}
      style={{
        transform: isPressed ? `scale(${pressScale})` : 'scale(1)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {children}
    </div>
  );
}