import React, { createContext, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, radii } from '../theme/tokens';

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value?: string;
  setValue: (value: string, label?: string) => void;
  placeholder?: string;
  label?: string;
  selectedLabel?: string;
}

const SelectContext = createContext<SelectContextValue | null>(null);

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  children: React.ReactNode;
}

export function Select({ value, defaultValue, onValueChange, placeholder, label, children }: SelectProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>();
  const isControlled = typeof value !== 'undefined';

  const setValue = (next: string, itemLabel?: string) => {
    if (!isControlled) setInternalValue(next);
    setSelectedLabel(itemLabel ?? selectedLabel);
    onValueChange?.(next);
  };

  const ctxValue = useMemo<SelectContextValue>(
    () => ({
      open: internalOpen,
      setOpen: setInternalOpen,
      value: isControlled ? value : internalValue,
      setValue,
      placeholder,
      label,
      selectedLabel,
    }),
    [internalOpen, isControlled, value, internalValue, placeholder, label, selectedLabel]
  );

  return <SelectContext.Provider value={ctxValue}>{children}</SelectContext.Provider>;
}

const useSelect = () => {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select components must be wrapped in <Select>');
  return ctx;
};

export function SelectTrigger({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { setOpen, value, placeholder, selectedLabel } = useSelect();
  return (
    <Pressable style={[styles.trigger, style]} onPress={() => setOpen(true)}>
      <Text style={styles.triggerText}>{selectedLabel || value || placeholder || 'Choose option'}</Text>
      {children}
    </Pressable>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, selectedLabel } = useSelect();
  return <Text style={styles.triggerText}>{selectedLabel || value || placeholder || 'Select'}</Text>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const { open, setOpen, label } = useSelect();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export interface SelectItemProps {
  value: string;
  label: string;
}

export function SelectItem({ value, label }: SelectItemProps) {
  const { setValue, setOpen, value: currentValue } = useSelect();
  const isSelected = currentValue === value;
  return (
    <Pressable
      onPress={() => {
        setValue(value, label);
        setOpen(false);
      }}
      style={[styles.itemRow, isSelected && styles.itemRowSelected]}
    >
      <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{label}</Text>
      {isSelected ? <Text style={styles.itemCheck}>✓</Text> : null}
    </Pressable>
  );
}

export function SelectLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.itemLabel}>{children}</Text>;
}

export function SelectSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: colors.light.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.light.surface,
  },
  triggerText: {
    color: colors.light.text,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.light.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.light.text,
  },
  closeText: {
    color: colors.light.primary,
    fontWeight: '600',
  },
  itemRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemRowSelected: {
    backgroundColor: colors.light.muted,
  },
  itemLabel: {
    color: colors.light.text,
    fontSize: 16,
  },
  itemLabelSelected: {
    fontWeight: '700',
  },
  itemCheck: {
    color: colors.light.primary,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: colors.light.border,
    marginVertical: spacing.xs,
  },
});

export const SelectGroup = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
export const SelectViewport = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
export const SelectScrollUpButton = () => null;
export const SelectScrollDownButton = () => null;
export const SelectPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectIcon = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const SelectTriggerProps = {};
export const SelectValueProps = {};
