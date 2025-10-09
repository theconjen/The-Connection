import React from 'react';
import { Modal as RNModal, View, ViewProps } from 'react-native';

export type ModalProps = ViewProps & {
  visible: boolean;
  onClose?: () => void;
};

export const Modal: React.FC<ModalProps> = ({ visible, onClose, children, style, ...props }) => (
  <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View className="flex-1 bg-black/50 items-center justify-end">
      <View className="w-full rounded-t-2xl bg-white p-4" style={style} {...props}>
        {children}
      </View>
    </View>
  </RNModal>
);

export default Modal;
