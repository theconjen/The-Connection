import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';

interface PullToRefreshProps extends Omit<RefreshControlProps, 'colors' | 'tintColor'> {
  refreshing: boolean;
  onRefresh: () => void;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  refreshing,
  onRefresh,
  ...props
}) => {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#E91E63', '#FF6B9D']} // Android
      tintColor="#E91E63" // iOS
      progressBackgroundColor="#FFFFFF"
      {...props}
    />
  );
};

export default PullToRefresh;