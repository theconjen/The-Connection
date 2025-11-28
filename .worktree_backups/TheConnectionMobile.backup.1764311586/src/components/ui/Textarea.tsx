import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

export type TextareaProps = TextInputProps & { };

export const Textarea = React.forwardRef<TextInput, TextareaProps>((props, ref) => {
  return (
    <TextInput
      ref={ref}
      style={[styles.input, props.style]}
      placeholderTextColor="#9ca3af"
      multiline
      numberOfLines={props.numberOfLines ?? 4}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

const styles = StyleSheet.create({
  input: {
    minHeight: 80,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});

export default Textarea;
