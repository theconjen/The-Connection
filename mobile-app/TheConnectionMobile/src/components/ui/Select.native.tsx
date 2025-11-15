/**
 * Native implementation of Select using Picker
 */
import * as React from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { cn } from '../../lib/utils';

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
  undefined
);

const useSelect = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      {children}
    </SelectContext.Provider>
  );
};

const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View>{children}</View>
);

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const { value } = useSelect();
  return <Text className="flex-1">{value || placeholder}</Text>;
};

const SelectTrigger: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { setOpen } = useSelect();

  return (
    <Pressable
      className={cn(
        'flex h-10 w-full flex-row items-center justify-between rounded-md border border-input bg-background px-3 py-2',
        className
      )}
      onPress={() => setOpen(true)}
    >
      {children}
      <ChevronDown size={16} className="text-muted-foreground opacity-50" />
    </Pressable>
  );
};

const SelectContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { open, setOpen } = useSelect();

  return (
    <Modal visible={open} transparent animationType="fade">
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={() => setOpen(false)}
      >
        <Pressable
          className={cn(
            'bg-popover rounded-md border shadow-lg max-h-96 w-80',
            className
          )}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView className="p-1">{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const SelectLabel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <Text className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}>
    {children}
  </Text>
);

const SelectItem: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className }) => {
  const { value: selectedValue, onValueChange, setOpen } = useSelect();
  const isSelected = value === selectedValue;

  return (
    <Pressable
      className={cn(
        'relative flex w-full flex-row items-center rounded-sm py-1.5 pl-8 pr-2 active:bg-accent',
        className
      )}
      onPress={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
    >
      <View className="absolute left-2 h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check size={16} />}
      </View>
      <Text className="text-sm">{children}</Text>
    </Pressable>
  );
};

const SelectSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <View className={cn('my-1 h-px bg-muted', className)} />
);

const SelectScrollUpButton: React.FC = () => null;
const SelectScrollDownButton: React.FC = () => null;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};

export default Select;
