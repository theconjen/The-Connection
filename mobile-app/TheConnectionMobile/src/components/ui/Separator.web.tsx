import * as React from 'react';

export const Separator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, ...props }) => (
  <div style={{ height: 1, width: '100%', background: '#e5e7eb', ...(style as any) }} {...props} />
);

export default Separator;
