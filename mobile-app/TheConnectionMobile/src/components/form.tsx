import React from 'react';
import { Controller, FormProvider, useFormContext, type ControllerProps, type FieldPath, type FieldValues } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View, ViewProps } from 'react-native';
import { colors, spacing, radii } from '../theme/tokens';

export const Form = FormProvider;

export type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ ...props }: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

export const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) {
    throw new Error('useFormField must be used within <FormField>');
  }

  const fieldState = getFieldState(fieldContext.name, formState);

  return {
    name: fieldContext.name,
    ...fieldState,
  };
};

const FormItemContext = React.createContext<{ id: string } | null>(null);

export const FormItem = React.forwardRef<View, ViewProps>(({ children, style, ...rest }, ref) => {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <View ref={ref} style={[styles.item, style]} {...rest}>
        {children}
      </View>
    </FormItemContext.Provider>
  );
});
FormItem.displayName = 'FormItem';

export const FormLabel = ({ children, style }: { children: React.ReactNode; style?: any }) => {
  const { error } = useFormField();
  return <Text style={[styles.label, error ? styles.labelError : null, style]}>{children}</Text>;
};

export const FormControl = React.forwardRef<TextInput, React.ComponentProps<typeof TextInput>>(
  ({ style, ...props }, ref) => {
    return <TextInput ref={ref} style={[styles.input, style]} placeholderTextColor={colors.light.textSecondary} {...props} />;
  }
);
FormControl.displayName = 'FormControl';

export const FormDescription = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <Text style={[styles.description, style]}>{children}</Text>
);

export const FormMessage = ({ children, style }: { children?: React.ReactNode; style?: any }) => {
  const { error } = useFormField();
  const body = error ? String(error?.message ?? '') : children;

  if (!body) return null;

  return <Text style={[styles.error, style]}>{body}</Text>;
};

const styles = StyleSheet.create({
  item: {
    rowGap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.text,
  },
  labelError: {
    color: colors.light.destructive,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.light.input,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.light.text,
    backgroundColor: colors.light.surface,
  },
  description: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  error: {
    fontSize: 12,
    color: colors.light.destructive,
    marginTop: spacing.xs,
  },
});
