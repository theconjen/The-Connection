import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

export type InputProps = TextInputProps & {
  variant?: 'default' | 'outline' | 'filled';
};

export const Input = React.forwardRef<TextInput, InputProps>(({ style, variant = 'default', ...props }, ref) => {
  const base = 'h-10 w-full rounded-lg px-3 text-sm';
  const variantClass = variant === 'outline'
    ? 'border border-gray-400 bg-transparent'
    : variant === 'filled'
    ? 'border border-gray-200 bg-gray-100'
    : 'border border-gray-200 bg-white';
  return (
    <TextInput
      ref={ref}
      placeholderTextColor="#9ca3af"
      className={`${base} ${variantClass}`}
      style={style}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
