
import * as React from "react"
import { TextInput, TextInputProps, StyleSheet } from "react-native"

interface InputProps extends TextInputProps {
  variant?: 'default' | 'outline' | 'filled';
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ style, variant = 'default', ...props }, ref) => {
    const getVariantStyle = () => {
      switch (variant) {
        case 'outline':
          return styles.outline;
        case 'filled':
          return styles.filled;
        default:
          return styles.default;
      }
    };

    return (
      <TextInput
        ref={ref}
        style={[
          styles.base,
          getVariantStyle(),
          style
        ]}
        placeholderTextColor="#6B7280"
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

const styles = StyleSheet.create({
  base: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'System',
  },
  default: {
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  outline: {
    borderColor: '#6B7280',
    backgroundColor: 'transparent',
    color: '#111827',
  },
  filled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
});

export { Input }
