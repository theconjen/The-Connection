/**
 * Native implementation of Dialog using React Native Modal
 */
import * as React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  type ModalProps,
} from 'react-native';
import { X } from 'lucide-react-native';
import { cn } from '../../lib/utils';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(
  undefined
);

const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger: React.FC<{
  children: React.ReactElement;
  asChild?: boolean;
}> = ({ children, asChild }) => {
  const { onOpenChange } = useDialog();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onPress: () => onOpenChange(true),
    } as any);
  }

  return (
    <Pressable onPress={() => onOpenChange(true)}>
      {children}
    </Pressable>
  );
};

const DialogContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { open, onOpenChange } = useDialog();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <Pressable
        className="flex-1 bg-black/80 justify-center items-center p-4"
        onPress={() => onOpenChange(false)}
      >
        <Pressable
          className={cn(
            'bg-background rounded-lg p-6 w-full max-w-lg shadow-lg',
            className
          )}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          <Pressable
            className="absolute right-4 top-4 rounded-sm opacity-70 active:opacity-100"
            onPress={() => onOpenChange(false)}
          >
            <X size={16} className="text-foreground" />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const DialogHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <View className={cn('flex flex-col space-y-1.5 mb-4', className)}>
    {children}
  </View>
);

const DialogFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <View className={cn('flex flex-col-reverse gap-2 mt-4', className)}>
    {children}
  </View>
);

const DialogTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <Text className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
    {children}
  </Text>
);

const DialogDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <Text className={cn('text-sm text-muted-foreground', className)}>
    {children}
  </Text>
);

const DialogClose = DialogTrigger; // Same behavior as trigger but for closing
const DialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const DialogOverlay: React.FC<any> = () => null; // Handled by Modal

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

export default Dialog;
