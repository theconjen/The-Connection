import React from 'react';
import { View, ViewProps } from 'react-native';

export const Separator: React.FC<ViewProps> = ({ style, ...props }) => (
  <View className="h-px w-full bg-gray-200" style={style} {...props} />
);

export default Separator;
