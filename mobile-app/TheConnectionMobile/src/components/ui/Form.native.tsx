/**
 * Native implementation of Form using react-hook-form
 */
import * as React from 'react';
import { View, Text } from 'react-native';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { cn } from '../../lib/utils';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

const FormItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ className, children }) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <View className={cn('gap-2', className)}>{children}</View>
    </FormItemContext.Provider>
  );
};

const FormLabel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ className, children }) => {
  const { error } = useFormField();

  return (
    <Text
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        error && 'text-destructive',
        className
      )}
    >
      {children}
    </Text>
  );
};

const FormControl: React.FC<{
  children: React.ReactElement;
}> = ({ children }) => {
  const { error, formItemId } = useFormField();

  // Clone the child element and pass accessibility props
  return React.cloneElement(children, {
    nativeID: formItemId,
    accessibilityInvalid: !!error,
  } as any);
};

const FormDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ className, children }) => {
  return (
    <Text className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </Text>
  );
};

const FormMessage: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ className, children }) => {
  const { error } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <Text className={cn('text-sm font-medium text-destructive', className)}>
      {body}
    </Text>
  );
};

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};

export default Form;
