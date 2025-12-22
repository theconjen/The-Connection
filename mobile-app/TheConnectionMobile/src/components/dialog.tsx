import React, { createContext, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, radii, shadows } from '../theme/tokens';

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === 'boolean';
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useMemo(
    () => (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const value = useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('Dialog components must be wrapped in <Dialog>');
  return ctx;
};

export function DialogTrigger({ children }: { children: React.ReactElement }) {
  const { setOpen } = useDialog();
  return React.cloneElement(children, {
    onPress: (event: any) => {
      children.props.onPress?.(event);
      setOpen(true);
    },
  });
}

export interface DialogContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function DialogContent({ children, style }: DialogContentProps) {
  const { open, setOpen } = useDialog();

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <View style={[styles.content, style]}>
          {children}
          <DialogClose>
            <Text style={styles.closeText}>Close</Text>
          </DialogClose>
        </View>
      </View>
    </Modal>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <Text style={styles.description}>{children}</Text>;
}

export function DialogClose({ children }: { children: React.ReactNode }) {
  const { setOpen } = useDialog();
  return (
    <Pressable onPress={() => setOpen(false)} style={styles.closeButton} accessibilityRole="button">
      {typeof children === 'string' ? <Text style={styles.closeText}>{children}</Text> : children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.light.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  footer: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.light.text,
  },
  description: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.light.textSecondary,
  },
  closeButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.light.muted,
  },
  closeText: {
    color: colors.light.text,
    fontWeight: '600',
  },
});
