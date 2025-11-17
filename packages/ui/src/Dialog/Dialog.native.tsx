/**
 * React Native Dialog component using Modal
 * Provides same API as web version but with native implementation
 */

import React, { createContext, useContext, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

// Context to manage dialog state
interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

const useDialogContext = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within Dialog');
  }
  return context;
};

// Main Dialog component (root)
interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Dialog: React.FC<DialogProps> = ({
  children,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange =
    onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

// Dialog Trigger
interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({ children }) => {
  const { onOpenChange } = useDialogContext();

  return (
    <Pressable onPress={() => onOpenChange(true)}>
      {children}
    </Pressable>
  );
};

// Dialog Content (the actual modal)
interface DialogContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const DialogContent: React.FC<DialogContentProps> = ({
  children,
  style,
}) => {
  const { open, onOpenChange } = useDialogContext();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => onOpenChange(false)}
        />
        <View style={[styles.content, style]}>
          {children}
          <Pressable
            style={styles.closeButton}
            onPress={() => onOpenChange(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// Dialog Header
interface DialogHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.header, style]}>{children}</View>;
};

// Dialog Footer
interface DialogFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.footer, style]}>{children}</View>;
};

// Dialog Title
interface DialogTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({
  children,
  style,
}) => {
  return <Text style={[styles.title, style]}>{children}</Text>;
};

// Dialog Description
interface DialogDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({
  children,
  style,
}) => {
  return <Text style={[styles.description, style]}>{children}</Text>;
};

// Dialog Close (optional, as close button is built into DialogContent)
export const DialogClose: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { onOpenChange } = useDialogContext();
  return <Pressable onPress={() => onOpenChange(false)}>{children}</Pressable>;
};

// Not needed for native but exported for compatibility
export const DialogPortal: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
export const DialogOverlay: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
