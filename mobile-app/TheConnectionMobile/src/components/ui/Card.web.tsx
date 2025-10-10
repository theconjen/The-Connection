import * as React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, ...props }) => (
  <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' , ...(style as any) }} {...props} />
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, ...props }) => (
  <div style={{ padding: '16px', ...(style as any) }} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ style, ...props }) => (
  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0, ...(style as any) }} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ style, ...props }) => (
  <p style={{ fontSize: 14, color: '#6b7280', margin: 0, ...(style as any) }} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, ...props }) => (
  <div style={{ padding: '0 16px 16px', ...(style as any) }} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, ...props }) => (
  <div style={{ padding: '0 16px 16px', display: 'flex', alignItems: 'center', ...(style as any) }} {...props} />
);

const CardCompound = Object.assign(Card, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});

export default CardCompound;
