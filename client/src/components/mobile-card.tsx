import { forwardRef } from "react";
import { Card } from "./ui/card";
import { cn } from "../lib/utils";
import TouchFeedback from "./mobile-touch-feedback";

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  pressable?: boolean;
  onPress?: () => void;
  hapticFeedback?: boolean;
}

/**
 * Mobile-optimized card component with touch feedback
 */
const MobileCard = forwardRef<HTMLDivElement, MobileCardProps>(
  ({ className, pressable = false, onPress, hapticFeedback = true, children, ...props }, ref) => {
    const cardContent = (
      <Card
        ref={ref}
        className={cn(
          "mobile-card",
          pressable && "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]",
          className
        )}
        {...props}
      >
        {children}
      </Card>
    );

    if (pressable && onPress) {
      return (
        <TouchFeedback
          hapticFeedback={hapticFeedback}
          onPress={onPress}
          pressScale={0.98}
        >
          {cardContent}
        </TouchFeedback>
      );
    }

    return cardContent;
  }
);

MobileCard.displayName = "MobileCard";

export { MobileCard };
export default MobileCard;