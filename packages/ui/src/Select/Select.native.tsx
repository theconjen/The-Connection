/**
 * React Native Select component using Modal and TouchableOpacity
 * Simplified version of @radix-ui/react-select API for React Native
 */

import React, { createContext, useContext, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';

// Context to manage select state
interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within Select');
  }
  return context;
};

// Main Select component (root)
interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export const Select: React.FC<SelectProps> = ({
  children,
  value: controlledValue,
  onValueChange,
  defaultValue = '',
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const handleValueChange =
    onValueChange !== undefined ? onValueChange : setInternalValue;

  return (
    <SelectContext.Provider
      value={{ value, onValueChange: handleValueChange, open, setOpen }}
    >
      {children}
    </SelectContext.Provider>
  );
};

// Select Trigger
interface SelectTriggerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  style,
  disabled = false,
}) => {
  const { setOpen } = useSelectContext();

  return (
    <Pressable
      style={[styles.trigger, style, disabled && styles.triggerDisabled]}
      onPress={() => !disabled && setOpen(true)}
      disabled={disabled}
    >
      {children}
      <Text style={styles.chevron}>▼</Text>
    </Pressable>
  );
};

// Select Value (displays selected value)
interface SelectValueProps {
  placeholder?: string;
  style?: TextStyle;
}

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder = 'Select...',
  style,
}) => {
  const { value } = useSelectContext();

  return (
    <Text style={[styles.value, !value && styles.placeholder, style]}>
      {value || placeholder}
    </Text>
  );
};

// Select Content (modal with options)
interface SelectContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  style,
}) => {
  const { open, setOpen } = useSelectContext();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
        />
        <View style={[styles.content, style]}>
          <ScrollView style={styles.scrollView}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Select Item
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value: itemValue,
  children,
  style,
  textStyle,
}) => {
  const { value, onValueChange, setOpen } = useSelectContext();
  const isSelected = value === itemValue;

  return (
    <Pressable
      style={[
        styles.item,
        isSelected && styles.itemSelected,
        style,
      ]}
      onPress={() => {
        onValueChange(itemValue);
        setOpen(false);
      }}
    >
      <Text
        style={[
          styles.itemText,
          isSelected && styles.itemTextSelected,
          textStyle,
        ]}
      >
        {children}
      </Text>
      {isSelected && <Text style={styles.checkmark}>✓</Text>}
    </Pressable>
  );
};

// Select Group (optional grouping)
export const SelectGroup: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <View style={styles.group}>{children}</View>;

// Select Label (for group labels)
export const SelectLabel: React.FC<{
  children: React.ReactNode;
  style?: TextStyle;
}> = ({ children, style }) => (
  <Text style={[styles.label, style]}>{children}</Text>
);

// Select Separator
export const SelectSeparator: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.separator, style]} />
);

// Compatibility exports (not used in native but exported for API compatibility)
export const SelectScrollUpButton: React.FC<any> = () => null;
export const SelectScrollDownButton: React.FC<any> = () => null;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  triggerDisabled: {
    opacity: 0.5,
    backgroundColor: '#f1f5f9',
  },
  value: {
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
  },
  placeholder: {
    color: '#94a3b8',
  },
  chevron: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollView: {
    padding: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
  },
  itemSelected: {
    backgroundColor: '#eff6ff',
  },
  itemText: {
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
  },
  itemTextSelected: {
    color: '#0ea5e9',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    color: '#0ea5e9',
    marginLeft: 8,
  },
  group: {
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
});
