import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../shared/colors';
import { useRouter } from 'expo-router';

export type ButtonProps = React.ComponentProps<typeof Pressable> & {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  title?: string;
  href?: string;
};

export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(({ variant = 'default', size = 'default', title, style, children, href, onPress, ...props }, ref) => {
  const { container, text } = getStyles(variant, size);
  const router = useRouter();
  const handlePress: any = (e: any) => {
    if (href) {
      router.push(href as any);
      return;
    }
    onPress?.(e);
  };
  return (
    <Pressable ref={ref as any} style={[styles.base, container, style as ViewStyle]} onPress={handlePress} {...props}>
      {title ? <Text style={[styles.text, text]}>{title}</Text> : children}
    </Pressable>
  );
});

Button.displayName = 'Button';

function getStyles(variant: ButtonProps['variant'], size: ButtonProps['size']) {
  const bg = variant === 'default' ? Colors.primary
    : variant === 'destructive' ? Colors.destructive
    : variant === 'secondary' ? Colors.secondary
    : 'transparent';

  const container: ViewStyle = {
    backgroundColor: bg,
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: Colors.border,
  };

  const text: TextStyle = {
    color: variant === 'secondary' ? Colors.secondaryForeground
      : variant === 'link' ? Colors.primary
      : variant === 'ghost' ? Colors.cardForeground
      : Colors.primaryForeground,
  };

  const sizeMap: Record<string, ViewStyle> = {
    default: { height: 40, paddingHorizontal: 16, borderRadius: 8 },
    sm: { height: 36, paddingHorizontal: 12, borderRadius: 8 },
    lg: { height: 44, paddingHorizontal: 24, borderRadius: 10 },
    icon: { height: 40, width: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  };
  return { container: [sizeMap[size!]], text };
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Button;
