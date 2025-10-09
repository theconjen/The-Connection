import React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';

export const Card: React.FC<ViewProps> = ({ style, ...props }) => (
  <View className="rounded-xl border border-gray-200 bg-white shadow-sm" style={style} {...props} />
);

export const CardHeader: React.FC<ViewProps> = ({ style, ...props }) => (
  <View className="px-4 py-4" style={style} {...props} />
);

export const CardTitle: React.FC<TextProps> = ({ style, ...props }) => (
  <Text className="text-xl font-semibold text-gray-900" style={style} {...props} />
);

export const CardDescription: React.FC<TextProps> = ({ style, ...props }) => (
  <Text className="text-sm text-gray-500" style={style} {...props} />
);

export const CardContent: React.FC<ViewProps> = ({ style, ...props }) => (
  <View className="px-4 pb-4" style={style} {...props} />
);

export const CardFooter: React.FC<ViewProps> = ({ style, ...props }) => (
  <View className="px-4 pb-4 flex-row items-center" style={style} {...props} />
);

const CardCompound = Object.assign(Card, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});

export default CardCompound;
