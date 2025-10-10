import React from 'react';
import { View, Text, Pressable, ViewProps } from 'react-native';

export type TabsProps = ViewProps & {
  value?: string;
  onValueChange?: (v: string) => void;
};

export type TabsTriggerProps = ViewProps & {
  value: string;
};

export const Tabs: React.FC<TabsProps> = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const TabsList: React.FC<ViewProps> = ({ children, style }) => (
  <View className="flex-row bg-gray-100 p-1 rounded-md" style={style}>{children}</View>
);

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children }) => (
  <Pressable className="px-3 py-1.5 rounded-sm">
    <Text>{children as any}</Text>
  </Pressable>
);

export const TabsContent: React.FC<ViewProps> = ({ children, style }) => (
  <View className="mt-2" style={style}>{children}</View>
);

// Merge compound components on the default export so usage like <Tabs.List> works
const TabsCompound = Object.assign(Tabs, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});

export default TabsCompound;
