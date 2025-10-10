import * as React from 'react';

export type TabsProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onValueChange?: (v: string) => void;
};

export type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export const Tabs: React.FC<TabsProps> = ({ children, style, ...props }) => (
  <div style={style} {...props}>{children}</div>
);

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, style, ...props }) => (
  <div style={{ display: 'inline-flex', background: '#f3f4f6', padding: 4, borderRadius: 6, ...(style as any) }} {...props}>{children}</div>
);

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, style, ...props }) => (
  <button style={{ padding: '6px 12px', borderRadius: 4, ...(style as any) }} {...props}>{children}</button>
);

export const TabsContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, style, ...props }) => (
  <div style={{ marginTop: 8, ...(style as any) }} {...props}>{children}</div>
);

const TabsCompound = Object.assign(Tabs, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});

export default TabsCompound;
