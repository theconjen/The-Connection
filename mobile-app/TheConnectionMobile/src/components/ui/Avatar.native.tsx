import React from 'react';
import { Image, Text, View, ImageProps, ViewProps } from 'react-native';

export const Avatar: React.FC<ViewProps> = ({ style, children, ...props }) => (
  <View className="h-10 w-10 rounded-full overflow-hidden bg-gray-200" style={style} {...props}>
    {children}
  </View>
);

export const AvatarImage: React.FC<ImageProps> = ({ style, ...props }) => (
  <Image className="h-full w-full" style={style} {...props} />
);

export const AvatarFallback: React.FC<ViewProps & { initials?: string }> = ({ style, children, initials, ...props }) => (
  <View className="flex-1 h-full w-full items-center justify-center bg-gray-300" style={style} {...props}>
    <Text className="text-gray-700 font-medium">{initials || children}</Text>
  </View>
);

const AvatarCompound = Object.assign(Avatar, {
  Image: AvatarImage,
  Fallback: AvatarFallback,
});

export default AvatarCompound;
