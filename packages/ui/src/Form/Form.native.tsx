/**
 * React Native Form component using react-hook-form
 */

import * as React from "react";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

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
    throw new Error("useFormField should be used within <FormField>");
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

interface FormItemProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const FormItem: React.FC<FormItemProps> = ({ children, style }) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <View style={[styles.formItem, style]}>{children}</View>
    </FormItemContext.Provider>
  );
};
FormItem.displayName = "FormItem";

interface FormLabelProps {
  children: React.ReactNode;
  style?: TextStyle;
}

const FormLabel: React.FC<FormLabelProps> = ({ children, style }) => {
  const { error } = useFormField();

  return (
    <Text style={[styles.label, error && styles.labelError, style]}>
      {children}
    </Text>
  );
};
FormLabel.displayName = "FormLabel";

interface FormControlProps {
  children: React.ReactNode;
}

const FormControl: React.FC<FormControlProps> = ({ children }) => {
  return <>{children}</>;
};
FormControl.displayName = "FormControl";

interface FormDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

const FormDescription: React.FC<FormDescriptionProps> = ({
  children,
  style,
}) => {
  return <Text style={[styles.description, style]}>{children}</Text>;
};
FormDescription.displayName = "FormDescription";

interface FormMessageProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

const FormMessage: React.FC<FormMessageProps> = ({ children, style }) => {
  const { error } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return <Text style={[styles.message, style]}>{body}</Text>;
};
FormMessage.displayName = "FormMessage";

const styles = StyleSheet.create({
  formItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 6,
  },
  labelError: {
    color: '#ef4444',
  },
  description: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
    marginTop: 4,
  },
});

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
