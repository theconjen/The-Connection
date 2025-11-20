import * as React from "react";

declare module "react-hook-form" {
  // Provide minimal surface to keep typechecking green across web/native forms.
  export type FieldValues = Record<string, any>;
  export type FieldPath<TFieldValues extends FieldValues = FieldValues> = keyof TFieldValues & string;
  export type ControllerProps<TFieldValues = any, TName = any, TContext = any> = any;
  export const Controller: React.FC<any>;
  export const FormProvider: React.FC<any>;
  export function useFormContext<TFieldValues extends FieldValues = FieldValues>(): any;
  export function useForm<TFieldValues = any, TContext = any, TTransformedValues = any>(props?: any): any;
}
