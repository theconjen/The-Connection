import React from 'react';
import { Pressable, Text, ViewProps } from 'react-native';

export type ToggleProps = ViewProps & {
  pressed?: boolean;
  onPressedChange?: (next: boolean) => void;
};

export const Toggle: React.FC<ToggleProps> = ({ pressed = false, onPressedChange, children, style }) => (
  <Pressable
    className={`px-3 py-1.5 rounded-md ${pressed ? 'bg-gray-900' : 'bg-gray-200'}`}
    onPress={() => onPressedChange?.(!pressed)}
    style={style}
  >
    <Text className={`${pressed ? 'text-white' : 'text-gray-800'}`}>{children as any}</Text>
  </Pressable>
);

export default Toggle;
