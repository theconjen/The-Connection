import * as React from 'react';

export type ModalProps = React.HTMLAttributes<HTMLDivElement> & {
  visible: boolean;
  onClose?: () => void;
};

export const Modal: React.FC<ModalProps> = ({ visible, onClose, children, style, ...props }) => {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div style={{ position: 'absolute', bottom: 0, width: '100%', background: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, ...(style as any) }} onClick={(e) => e.stopPropagation()} {...props}>
        {children}
      </div>
    </div>
  );
};

export default Modal;
