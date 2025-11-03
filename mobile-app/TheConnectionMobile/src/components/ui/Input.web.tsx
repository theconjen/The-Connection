import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: 'default' | 'outline' | 'filled';
  onChangeText?: (text: string) => void;
};

const styles = {
  base: {
    height: 40,
    width: '100%',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    outline: 'none',
  } as React.CSSProperties,
  default: { border: '1px solid #e5e7eb', backgroundColor: '#fff' } as React.CSSProperties,
  outline: { border: '1px solid #9ca3af', backgroundColor: 'transparent' } as React.CSSProperties,
  filled: { border: '1px solid #e5e7eb', backgroundColor: '#f3f4f6' } as React.CSSProperties,
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ style, variant = 'default', onChangeText, onChange, ...props }, ref) => {
  const variantStyle = styles[variant] || styles.default;
  return (
    <input
      ref={ref}
      style={{ ...styles.base, ...variantStyle, ...(style as any) }}
      onChange={(e) => {
        onChange?.(e);
        onChangeText?.(e.target.value);
      }}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
