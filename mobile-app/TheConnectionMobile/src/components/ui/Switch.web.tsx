import * as React from 'react';

type SwitchProps = {
  checked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
};

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(({ checked = false, onCheckedChange, disabled, style }, ref) => {
  return (
    <button
      ref={ref}
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      style={{ width: 44, height: 26, borderRadius: 13, background: checked ? '#0B132B' : '#e5e7eb', padding: 2, ...style }}
      disabled={disabled}
    >
      <div style={{ width: 20, height: 20, borderRadius: 10, background: '#fff', transform: `translateX(${checked ? 18 : 0}px)` }} />
    </button>
  );
});

Switch.displayName = 'Switch';

export default Switch;
