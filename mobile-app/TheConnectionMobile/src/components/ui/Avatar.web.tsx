import * as React from 'react';

export const Avatar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, children, ...props }) => (
  <div style={{ height: 40, width: 40, borderRadius: '50%', overflow: 'hidden', background: '#e5e7eb', ...(style as any) }} {...props}>
    {children}
  </div>
);

export const AvatarImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ style, ...props }) => (
  <img style={{ height: '100%', width: '100%', ...(style as any) }} {...props} />
);

export const AvatarFallback: React.FC<React.HTMLAttributes<HTMLDivElement> & { initials?: string }> = ({ style, children, initials, ...props }) => (
  <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d1d5db', ...(style as any) }} {...props}>
    <span style={{ color: '#374151', fontWeight: 500 }}>{initials || children}</span>
  </div>
);

const AvatarCompound = Object.assign(Avatar, {
  Image: AvatarImage,
  Fallback: AvatarFallback,
});

export default AvatarCompound;
