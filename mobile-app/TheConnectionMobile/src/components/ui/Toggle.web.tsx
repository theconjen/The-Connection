import * as React from 'react';

export type ToggleProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed?: boolean;
  onPressedChange?: (next: boolean) => void;
};

export const Toggle: React.FC<ToggleProps> = ({ pressed = false, onPressedChange, children, style, ...props }) => (
  <button
    onClick={() => onPressedChange?.(!pressed)}
    style={{ padding: '6px 12px', borderRadius: 6, background: pressed ? '#111827' : '#e5e7eb', color: pressed ? '#fff' : '#111827', ...(style as any) }}
    {...props}
  >
    {children}
  </button>
);

export default Toggle;
