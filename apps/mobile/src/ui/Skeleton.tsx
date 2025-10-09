import { View } from 'react-native';

export function Skeleton({ height = 64, className = '' }: { height?: number; className?: string }) {
  return (
    <View
      className={`bg-card rounded-xl border border-border ${className}`}
      style={{ height, opacity: 0.6 }}
    />
  );
}
