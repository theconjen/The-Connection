import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface MobileModernButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const MobileModernButton = forwardRef<HTMLButtonElement, MobileModernButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 mobile-text-modern";
    
    const variants = {
      primary: "mobile-button-modern text-white shadow-lg",
      secondary: "bg-secondary/10 text-secondary hover:bg-secondary/20 shadow-sm",
      outline: "mobile-modern-card border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50",
      ghost: "hover:bg-primary/10 text-primary"
    };
    
    const sizes = {
      sm: "px-3 py-2 text-sm h-8 rounded-lg",
      md: "px-4 py-3 text-base h-10 rounded-xl",
      lg: "px-6 py-4 text-lg h-12 rounded-xl"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

MobileModernButton.displayName = "MobileModernButton";

export default MobileModernButton;