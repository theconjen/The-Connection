import * as React from 'react';
import { Colors } from '../../theme/colors';

type ButtonHTMLProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  href?: string;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonHTMLProps>(({ variant = 'default', size = 'default', href, style, children, ...props }, ref) => {
  const bg = variant === 'default' ? Colors.primary
    : variant === 'destructive' ? Colors.destructive
    : variant === 'secondary' ? Colors.secondary
    : 'transparent';
  const color = variant === 'secondary' ? Colors.secondaryForeground
    : variant === 'link' ? Colors.primary
    : variant === 'ghost' ? Colors.cardForeground
    : Colors.primaryForeground;
  const paddings = size === 'sm' ? '8px 12px' : size === 'lg' ? '12px 24px' : '10px 16px';
  const radius = size === 'lg' ? 10 : 8;
  return (
    <button ref={ref} style={{ backgroundColor: bg, color, borderRadius: radius, padding: paddings, border: variant === 'outline' ? `1px solid ${Colors.border}` : 'none', ...style }} {...props}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
